"use client";

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
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { connection } from "../lib/connection";
import {
  BRZ_MINT,
  VAULT_ADMIN,
  deriveVaultPDA,
  getBrixProgram,
  type AnchorWalletAdapter,
} from "../lib/brix-program";

const DEVNET_CHAIN = "solana:devnet" as const;

type AnchorNumeric = { toString(): string };

type RawVault = {
  admin: PublicKey | string;
  brzMint: PublicKey | string;
  vaultAta: PublicKey | string;
  totalShares: AnchorNumeric;
  totalDeployed: AnchorNumeric;
  totalDeposits: AnchorNumeric;
  totalRepaid: AnchorNumeric;
  paused: boolean;
};

type RawPosition = {
  shares: AnchorNumeric;
  totalDeposited: AnchorNumeric;
  totalWithdrawn: AnchorNumeric;
};

type AccountFetcher<T> = {
  fetch(address: PublicKey): Promise<T>;
};

type BrixProgramClient = ReturnType<typeof getBrixProgram>;

type BrixAccounts = {
  vault: AccountFetcher<RawVault>;
  investorPosition: AccountFetcher<RawPosition>;
};

export interface VaultData {
  admin: PublicKey;
  brzMint: PublicKey;
  vaultAta: PublicKey;
  totalShares: bigint;
  totalDeployed: bigint;
  totalDeposits: bigint;
  totalRepaid: bigint;
  paused: boolean;
  vaultAtaBalance: bigint;
  totalAssets: bigint;
  aprBps: number;
}

export interface PositionData {
  shares: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  estimatedValueBrz: bigint;
}

function brixAccounts(program: BrixProgramClient): BrixAccounts {
  return program.account as unknown as BrixAccounts;
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

function derivePositionPDA(
  programId: PublicKey,
  vaultPDA: PublicKey,
  investor: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), vaultPDA.toBuffer(), investor.toBuffer()],
    programId,
  );
}

export function useBrix() {
  const { authenticated } = usePrivy();
  const { wallets, ready: solanaWalletsReady } = useSolanaWallets();
  const { signTransaction: signPrivyTransaction } = useSignTransaction();

  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [positionData, setPositionData] = useState<PositionData | null>(null);
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

  const fetchVaultData = useCallback(async () => {
    const [vaultPDA] = deriveVaultPDA();

    try {
      const vault = await brixAccounts(program).vault.fetch(vaultPDA);

      let ataBalance = 0n;
      try {
        const ataInfo = await connection.getTokenAccountBalance(
          new PublicKey(vault.vaultAta),
        );
        ataBalance = BigInt(ataInfo.value.amount);
      } catch {
        // Vault ATA may not exist before scripts/seed-demo.ts runs.
      }

      const totalDeployed = BigInt(vault.totalDeployed.toString());
      const totalAssets = ataBalance + totalDeployed;

      setVaultData({
        admin: new PublicKey(vault.admin),
        brzMint: new PublicKey(vault.brzMint),
        vaultAta: new PublicKey(vault.vaultAta),
        totalShares: BigInt(vault.totalShares.toString()),
        totalDeployed,
        totalDeposits: BigInt(vault.totalDeposits.toString()),
        totalRepaid: BigInt(vault.totalRepaid.toString()),
        paused: vault.paused,
        vaultAtaBalance: ataBalance,
        totalAssets,
        aprBps: 2000,
      });
    } catch (err) {
      console.warn("Vault not found:", err);
      setVaultData(null);
    }
  }, [program]);

  const fetchPositionData = useCallback(async () => {
    if (!authenticated || !solanaWalletsReady || !solanaWallet) {
      setPositionData(null);
      return;
    }

    const [vaultPDA] = deriveVaultPDA();

    try {
      const [positionPDA] = derivePositionPDA(
        program.programId,
        vaultPDA,
        anchorWallet.publicKey,
      );

      const [position, vault] = await Promise.all([
        brixAccounts(program).investorPosition.fetch(positionPDA),
        brixAccounts(program).vault.fetch(vaultPDA),
      ]);

      const shares = BigInt(position.shares.toString());
      const totalShares = BigInt(vault.totalShares.toString());

      let ataBalance = 0n;
      try {
        const ataInfo = await connection.getTokenAccountBalance(
          new PublicKey(vault.vaultAta),
        );
        ataBalance = BigInt(ataInfo.value.amount);
      } catch {
        // Missing vault ATA means there is no user position to value yet.
      }

      const totalDeployed = BigInt(vault.totalDeployed.toString());
      const totalAssets = ataBalance + totalDeployed;
      const estimatedValueBrz =
        totalShares > 0n ? (shares * totalAssets) / totalShares : 0n;

      setPositionData({
        shares,
        totalDeposited: BigInt(position.totalDeposited.toString()),
        totalWithdrawn: BigInt(position.totalWithdrawn.toString()),
        estimatedValueBrz,
      });
    } catch {
      setPositionData(null);
    }
  }, [
    authenticated,
    anchorWallet.publicKey,
    program,
    solanaWallet,
    solanaWalletsReady,
  ]);

  useEffect(() => {
    void Promise.resolve().then(fetchVaultData);
  }, [fetchVaultData]);

  useEffect(() => {
    void Promise.resolve().then(fetchPositionData);
  }, [fetchPositionData]);

  async function deposit(amountBrz: number) {
    if (!authenticated || !solanaWalletsReady || !solanaWallet) {
      toast.error("Conecte sua carteira Solana primeiro.");
      return;
    }

    const amountLamports = BigInt(Math.floor(amountBrz * 1_000_000));
    const [vaultPDA] = deriveVaultPDA();

    const vault = await brixAccounts(program).vault.fetch(vaultPDA);
    const vaultAta = new PublicKey(vault.vaultAta);
    const investorBrzAta = getAssociatedTokenAddressSync(
      BRZ_MINT,
      anchorWallet.publicKey,
    );
    const [position] = derivePositionPDA(
      program.programId,
      vaultPDA,
      anchorWallet.publicKey,
    );

    const loadingToast = toast.loading("Enviando depósito...");
    setIsLoading(true);

    try {
      const txSig = await program.methods
        .deposit(new BN(amountLamports.toString()))
        .accounts({
          investor: anchorWallet.publicKey,
          vault: vaultPDA,
          brzMint: BRZ_MINT,
          vaultAta,
          investorBrzAta,
          position,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.dismiss(loadingToast);
      toast.success("Depósito realizado!", {
        description: `Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
      });

      await Promise.all([fetchVaultData(), fetchPositionData()]);
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha no depósito", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  async function withdraw(shares: bigint) {
    if (!authenticated || !solanaWalletsReady || !solanaWallet) {
      toast.error("Conecte sua carteira Solana primeiro.");
      return;
    }

    const [vaultPDA] = deriveVaultPDA();
    const vault = await brixAccounts(program).vault.fetch(vaultPDA);
    const vaultAta = new PublicKey(vault.vaultAta);
    const investorBrzAta = getAssociatedTokenAddressSync(
      BRZ_MINT,
      anchorWallet.publicKey,
    );
    const [position] = derivePositionPDA(
      program.programId,
      vaultPDA,
      anchorWallet.publicKey,
    );

    const loadingToast = toast.loading("Processando saque...");
    setIsLoading(true);

    try {
      const txSig = await program.methods
        .withdraw(new BN(shares.toString()))
        .accounts({
          investor: anchorWallet.publicKey,
          vault: vaultPDA,
          vaultAta,
          position,
          investorBrzAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      toast.dismiss(loadingToast);
      toast.success("Saque realizado!", {
        description: `Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
      });

      await Promise.all([fetchVaultData(), fetchPositionData()]);
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha no saque", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return {
    vaultData,
    positionData,
    isLoading,
    authenticated,
    wallet: solanaWallet,
    walletAddress: solanaWallet?.address ?? null,
    deposit,
    withdraw,
    refetch: () => {
      void fetchVaultData();
      void fetchPositionData();
    },
  };
}

export function formatBrz(lamports: bigint): string {
  const value = Number(lamports) / 1_000_000;
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
