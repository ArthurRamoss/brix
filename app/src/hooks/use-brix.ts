"use client";

import { usePrivy } from "@privy-io/react-auth";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { connection } from "../lib/connection";
import {
  getBrixProgram,
  BRZ_MINT,
  VAULT_ADMIN,
  deriveVaultPDA,
} from "../lib/brix-program";

// --- Tipos de dados do vault (espelham os campos do state.rs) ---

export interface VaultData {
  admin: PublicKey;
  brzMint: PublicKey;
  vaultAta: PublicKey;
  totalShares: bigint;
  totalDeployed: bigint;
  totalDeposits: bigint;
  totalRepaid: bigint;
  paused: boolean;
  // Calculados no cliente
  vaultAtaBalance: bigint; // BRZ idle no ATA
  totalAssets: bigint; // = vaultAtaBalance + totalDeployed
  aprBps: number; // estimativa de APR em bps (calculada com recebiveis ativos)
}

export interface PositionData {
  shares: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  // Calculado: valor em BRZ das shares
  estimatedValueBrz: bigint;
}

// --- Hook principal ---

export function useBrix() {
  const { authenticated, user } = usePrivy();

  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Busca a wallet Solana do usuário via linkedAccounts.
  // useWallets() do pacote principal retorna só EVM. A wallet Solana embedded
  // fica em user.linkedAccounts com type==='wallet' && chainType==='solana'.
  const solanaWallet = useMemo(() => {
    return user?.linkedAccounts.find(
      (a) => a.type === "wallet" && "chainType" in a && (a as { chainType: string }).chainType === "solana",
    ) as { address: string } | undefined ?? null;
  }, [user]);

  // Anchor wallet adapter — placeholder que permite ler dados (fetch) sem sign.
  // Sign real requer a embedded Solana wallet do Privy (integrado no CP3).
  const anchorWallet = useMemo(() => {
    const address = solanaWallet?.address ?? VAULT_ADMIN.toBase58();
    return {
      publicKey: new PublicKey(address),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signTransaction: async (tx: any) => tx,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signAllTransactions: async (txs: any[]) => txs,
    };
  }, [solanaWallet]);

  // Instância do program (null se não conectado)
  const program = useMemo(() => {
    if (!anchorWallet) return null;
    return getBrixProgram(anchorWallet);
  }, [anchorWallet]);

  // --- Fetch de dados on-chain ---

  const fetchVaultData = useCallback(async () => {
    const [vaultPDA] = deriveVaultPDA();

    try {
      // program?.account.<ContaName>.fetch(pda) busca os dados da conta on-chain.
      // Analogia: é como um GET /api/vault/:id que lê direto do banco de dados distribuído.
      // Se o program não estiver disponível, usa um provider read-only.
      let vault;
      if (program) {
        vault = await (program.account as any).vault.fetch(vaultPDA);
      } else {
        // Read-only: busca sem wallet (para mostrar dados públicos sem login)
        const { getBrixProgram: getReadOnly } = await import("../lib/brix-program");
        const readOnlyWallet = {
          publicKey: VAULT_ADMIN,
          signTransaction: async <T,>(tx: T) => tx,
          signAllTransactions: async <T,>(txs: T[]) => txs,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const readOnlyProgram = getReadOnly(readOnlyWallet as any);
        vault = await (readOnlyProgram.account as any).vault.fetch(vaultPDA);
      }

      // Busca o saldo real do ATA do vault (BRZ idle)
      let ataBalance = BigInt(0);
      try {
        const ataInfo = await connection.getTokenAccountBalance(
          new PublicKey(vault.vaultAta),
        );
        ataBalance = BigInt(ataInfo.value.amount);
      } catch {
        // ATA pode não existir ainda se o vault não foi inicializado
      }

      const totalDeployed = BigInt(vault.totalDeployed.toString());
      const totalAssets = ataBalance + totalDeployed;

      // APR estimado: se há capital deployed, a yield vem dos receivables.
      // Por ora mostramos 20% fixo como valor de demo (CP3 vai calcular real).
      const aprBps = 2000; // 20%

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
        aprBps,
      });
    } catch (err) {
      // Vault ainda não inicializado no devnet — estado normal antes do seed-demo
      console.warn("Vault não encontrado:", err);
      setVaultData(null);
    }
  }, [program]);

  const fetchPositionData = useCallback(async () => {
    if (!program || !anchorWallet) return;

    const [vaultPDA] = deriveVaultPDA();

    try {
      const [positionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          vaultPDA.toBuffer(),
          anchorWallet.publicKey.toBuffer(),
        ],
        program.programId,
      );

      const position = await (program.account as any).investorPosition.fetch(positionPDA);
      const vault = await (program.account as any).vault.fetch(vaultPDA);

      const shares = BigInt(position.shares.toString());
      const totalShares = BigInt(vault.totalShares.toString());

      // Busca saldo real do ATA pra calcular valor estimado das shares
      let ataBalance = BigInt(0);
      try {
        const ataInfo = await connection.getTokenAccountBalance(
          new PublicKey(vault.vaultAta),
        );
        ataBalance = BigInt(ataInfo.value.amount);
      } catch {}

      const totalDeployed = BigInt(vault.totalDeployed.toString());
      const totalAssets = ataBalance + totalDeployed;

      // estimatedValue = shares * totalAssets / totalShares
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
  }, [program, anchorWallet]);

  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  useEffect(() => {
    if (authenticated) {
      fetchPositionData();
    }
  }, [authenticated, fetchPositionData]);

  // --- Ações ---

  async function deposit(amountBrz: number) {
    if (!program || !anchorWallet) {
      toast.error("Conecte sua carteira primeiro.");
      return;
    }

    const amountLamports = BigInt(Math.floor(amountBrz * 1_000_000)); // BRZ tem 6 decimais
    const [vaultPDA] = deriveVaultPDA();

    // Busca o ATA do vault (já criado no initialize_vault)
    const vault = await (program.account as any).vault.fetch(vaultPDA);
    const vaultAta = new PublicKey(vault.vaultAta);

    // ATA do investidor para BRZ
    const investorBrzAta = getAssociatedTokenAddressSync(
      BRZ_MINT,
      anchorWallet.publicKey,
    );

    const loadingToast = toast.loading("Enviando depósito...");
    setIsLoading(true);

    try {
      // program.methods.deposit(amount)
      //   .accounts({ ... }) — passa as contas que o program precisa
      //   .rpc()             — assina com a wallet e envia pra devnet
      // Analogia: é como chamar POST /api/vault/deposit com autenticação JWT
      const txSig = await program.methods
        .deposit(new BN(amountLamports.toString()))
        .accounts({
          investor: anchorWallet.publicKey,
          vault: vaultPDA,
          brzMint: BRZ_MINT,
          vaultAta,
          investorBrzAta,
        })
        .rpc();

      toast.dismiss(loadingToast);
      toast.success("Depósito realizado!", {
        description: `Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
      });

      await fetchVaultData();
      await fetchPositionData();
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha no depósito", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  async function withdraw(shares: bigint) {
    if (!program || !anchorWallet) {
      toast.error("Conecte sua carteira primeiro.");
      return;
    }

    const [vaultPDA] = deriveVaultPDA();
    const investorBrzAta = getAssociatedTokenAddressSync(
      BRZ_MINT,
      anchorWallet.publicKey,
    );

    const loadingToast = toast.loading("Processando saque...");
    setIsLoading(true);

    try {
      const txSig = await program.methods
        .withdraw(new BN(shares.toString()))
        .accounts({
          investor: anchorWallet.publicKey,
          investorBrzAta,
        })
        .rpc();

      toast.dismiss(loadingToast);
      toast.success("Saque realizado!", {
        description: `Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
      });

      await fetchVaultData();
      await fetchPositionData();
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha no saque", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return {
    // Estado
    vaultData,
    positionData,
    isLoading,
    authenticated,
    wallet: solanaWallet,
    walletAddress: solanaWallet?.address ?? null,
    // Ações
    deposit,
    withdraw,
    refetch: () => { fetchVaultData(); fetchPositionData(); },
  };
}

// Helper: formata lamports BRZ (6 decimais) pra exibição em R$
export function formatBrz(lamports: bigint): string {
  const value = Number(lamports) / 1_000_000;
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
