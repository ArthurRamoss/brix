"use client";

// Agency-side on-chain wiring: register_receivable + fund_landlord + repay.

import { BN } from "@coral-xyz/anchor";
import { usePrivy } from "@privy-io/react-auth";
import {
  useSignTransaction,
  useWallets as useSolanaWallets,
  type ConnectedStandardSolanaWallet,
  type UseSignTransaction,
} from "@privy-io/react-auth/solana";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BRZ_MINT,
  VAULT_ADMIN,
  deriveVaultPDA,
  getBrixProgram,
  type AnchorWalletAdapter,
} from "../lib/brix-program";

const DEVNET_CHAIN = "solana:devnet" as const;

type RawVault = {
  vaultAta: PublicKey | string;
};

type AccountFetcher<T> = {
  fetch(address: PublicKey): Promise<T>;
};

type BrixProgramClient = ReturnType<typeof getBrixProgram>;

function vaultAccount(program: BrixProgramClient) {
  return (program.account as unknown as { vault: AccountFetcher<RawVault> })
    .vault;
}

function serializeForPrivy(tx: Transaction | VersionedTransaction): Uint8Array {
  if (tx instanceof VersionedTransaction) return tx.serialize();
  return tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
}

function deserializeSigned<T extends Transaction | VersionedTransaction>(
  original: T,
  bytes: Uint8Array,
): T {
  if (original instanceof VersionedTransaction) {
    return VersionedTransaction.deserialize(bytes) as T;
  }
  return Transaction.from(bytes) as T;
}

async function signWithPrivy<T extends Transaction | VersionedTransaction>(
  tx: T,
  wallet: ConnectedStandardSolanaWallet,
  signTransaction: UseSignTransaction["signTransaction"],
): Promise<T> {
  const { signedTransaction } = await signTransaction({
    transaction: serializeForPrivy(tx),
    wallet,
    chain: DEVNET_CHAIN,
  });
  return deserializeSigned(tx, signedTransaction);
}

function deriveReceivablePDA(programId: PublicKey, contractId: number[]) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("receivable"), Uint8Array.from(contractId)],
    programId,
  );
}

export function useAgency() {
  const { authenticated } = usePrivy();
  const { wallets, ready: solanaWalletsReady } = useSolanaWallets();
  const { signTransaction: signPrivyTransaction } = useSignTransaction();
  const [isLoading, setIsLoading] = useState(false);

  const solanaWallet = useMemo(() => wallets[0] ?? null, [wallets]);

  const anchorWallet = useMemo<AnchorWalletAdapter>(() => {
    if (!solanaWallet) {
      return {
        publicKey: VAULT_ADMIN,
        signTransaction: async () => {
          throw new Error("Solana wallet is not ready to sign.");
        },
        signAllTransactions: async () => {
          throw new Error("Solana wallet is not ready to sign.");
        },
      };
    }

    return {
      publicKey: new PublicKey(solanaWallet.address),
      signTransaction: async <T extends Transaction | VersionedTransaction>(
        tx: T,
      ) => signWithPrivy(tx, solanaWallet, signPrivyTransaction),
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[],
      ) => {
        const signed: T[] = [];
        for (const tx of txs) {
          signed.push(
            await signWithPrivy(tx, solanaWallet, signPrivyTransaction),
          );
        }
        return signed;
      },
    };
  }, [solanaWallet, signPrivyTransaction]);

  const program = useMemo(
    () => getBrixProgram(anchorWallet),
    [anchorWallet],
  );

  const anteciparReceivable = useCallback(
    async (params: {
      contractId: number[];
      principalBrz: number;
      repaymentBrz: number;
      rateBps: number;
      durationDays: number;
      landlord?: PublicKey;
    }) => {
      if (!authenticated || !solanaWalletsReady || !solanaWallet) {
        toast.error("Conecte sua carteira Solana primeiro.");
        return null;
      }

      const [vaultPDA] = deriveVaultPDA();
      const [receivablePDA] = deriveReceivablePDA(
        program.programId,
        params.contractId,
      );
      const landlord = params.landlord ?? anchorWallet.publicKey;

      const principalLamports = new BN(
        Math.floor(params.principalBrz * 1_000_000),
      );
      const repaymentLamports = new BN(
        Math.floor(params.repaymentBrz * 1_000_000),
      );

      const loadingToast = toast.loading("Step 1/2 - Registrando on-chain...");
      setIsLoading(true);

      try {
        const registerSig = await program.methods
          .registerReceivable(
            params.contractId,
            principalLamports,
            repaymentLamports,
            params.rateBps,
            params.durationDays,
          )
          .accounts({
            agency: anchorWallet.publicKey,
            vault: vaultPDA,
            landlord,
            receivable: receivablePDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        toast.loading("Step 2/2 - Liberando BRZ para o proprietário...", {
          id: loadingToast,
        });

        const landlordBrzAta = getAssociatedTokenAddressSync(BRZ_MINT, landlord);
        const vault = await vaultAccount(program).fetch(vaultPDA);

        const fundSig = await program.methods
          .fundLandlord(params.contractId)
          .accounts({
            agency: anchorWallet.publicKey,
            vault: vaultPDA,
            vaultAta: new PublicKey(vault.vaultAta),
            receivable: receivablePDA,
            landlord,
            landlordBrzAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        toast.dismiss(loadingToast);
        toast.success("Antecipação confirmada!", {
          description: `Register: https://explorer.solana.com/tx/${registerSig}?cluster=devnet | Fund: https://explorer.solana.com/tx/${fundSig}?cluster=devnet`,
        });
        return fundSig;
      } catch (err: unknown) {
        toast.dismiss(loadingToast);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Account does not exist")) {
          toast.error("Vault não encontrado no devnet", {
            description: "Rode pnpm demo:seed primeiro.",
          });
        } else {
          toast.error("Falha na antecipação", { description: msg });
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      authenticated,
      anchorWallet.publicKey,
      program,
      solanaWallet,
      solanaWalletsReady,
    ],
  );

  const repay = useCallback(
    async (params: { contractId: number[]; amountBrz: number }) => {
      if (!authenticated || !solanaWalletsReady || !solanaWallet) {
        toast.error("Conecte sua carteira Solana primeiro.");
        return null;
      }

      const [vaultPDA] = deriveVaultPDA();
      const [receivablePDA] = deriveReceivablePDA(
        program.programId,
        params.contractId,
      );
      const repayerBrzAta = getAssociatedTokenAddressSync(
        BRZ_MINT,
        anchorWallet.publicKey,
      );
      const amountLamports = new BN(
        Math.floor(params.amountBrz * 1_000_000),
      );

      const loadingToast = toast.loading("Registrando pagamento on-chain...");
      setIsLoading(true);

      try {
        const vault = await vaultAccount(program).fetch(vaultPDA);
        const txSig = await program.methods
          .repay(params.contractId, amountLamports)
          .accounts({
            repayer: anchorWallet.publicKey,
            vault: vaultPDA,
            vaultAta: new PublicKey(vault.vaultAta),
            receivable: receivablePDA,
            repayerBrzAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        toast.dismiss(loadingToast);
        toast.success("Pagamento registrado!", {
          description: `Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
        });
        return txSig;
      } catch (err: unknown) {
        toast.dismiss(loadingToast);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error("Falha no repay", { description: msg });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      authenticated,
      anchorWallet.publicKey,
      program,
      solanaWallet,
      solanaWalletsReady,
    ],
  );

  return {
    isLoading,
    walletAddress: solanaWallet?.address ?? null,
    anteciparReceivable,
    repay,
  };
}
