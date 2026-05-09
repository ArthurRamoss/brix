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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { connection } from "../lib/connection";
import {
  BRZ_MINT,
  VAULT_ADMIN,
  deriveVaultPDA,
  getBrixProgram,
  type AnchorWalletAdapter,
} from "../lib/brix-program";
import {
  getAgencyContracts,
  recordVaultEvent,
  type AgencyContract,
} from "../lib/agency-clients";
import { BRIX_PROTOCOL_FEE_BPS } from "../lib/brix-fees";

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

// Two-level cache of last computed vault/position state.
//
// Layer 1 (module-level): survives mount/unmount within the same session —
// e.g. navigating from /history back to /invest paints instantly.
// Layer 2 (localStorage): survives F5/full reload, so a returning user sees
// last-known values during the very first paint while we kick off the fresh
// on-chain fetch in the background.
//
// VaultData/PositionData hold PublicKey + BigInt, so they need custom
// serialize/deserialize to round-trip through JSON.

const VAULT_CACHE_KEY = "brix:vault_data:v1";
const POSITION_CACHE_KEY = "brix:position_data:v1";
const STATE_CACHE_TTL_MS = 5 * 60_000;

type Persisted<T> = { data: T; expires: number };

function serializeVault(v: VaultData): unknown {
  return {
    admin: v.admin.toBase58(),
    brzMint: v.brzMint.toBase58(),
    vaultAta: v.vaultAta.toBase58(),
    totalShares: v.totalShares.toString(),
    totalDeployed: v.totalDeployed.toString(),
    totalDeposits: v.totalDeposits.toString(),
    totalRepaid: v.totalRepaid.toString(),
    paused: v.paused,
    vaultAtaBalance: v.vaultAtaBalance.toString(),
    totalAssets: v.totalAssets.toString(),
    aprBps: v.aprBps,
  };
}

function deserializeVault(raw: unknown): VaultData | null {
  try {
    const r = raw as Record<string, string | boolean | number>;
    return {
      admin: new PublicKey(r.admin as string),
      brzMint: new PublicKey(r.brzMint as string),
      vaultAta: new PublicKey(r.vaultAta as string),
      totalShares: BigInt(r.totalShares as string),
      totalDeployed: BigInt(r.totalDeployed as string),
      totalDeposits: BigInt(r.totalDeposits as string),
      totalRepaid: BigInt(r.totalRepaid as string),
      paused: r.paused as boolean,
      vaultAtaBalance: BigInt(r.vaultAtaBalance as string),
      totalAssets: BigInt(r.totalAssets as string),
      aprBps: r.aprBps as number,
    };
  } catch {
    return null;
  }
}

function serializePosition(p: PositionData): unknown {
  return {
    shares: p.shares.toString(),
    totalDeposited: p.totalDeposited.toString(),
    totalWithdrawn: p.totalWithdrawn.toString(),
    estimatedValueBrz: p.estimatedValueBrz.toString(),
  };
}

function deserializePosition(raw: unknown): PositionData | null {
  try {
    const r = raw as Record<string, string>;
    return {
      shares: BigInt(r.shares),
      totalDeposited: BigInt(r.totalDeposited),
      totalWithdrawn: BigInt(r.totalWithdrawn),
      estimatedValueBrz: BigInt(r.estimatedValueBrz),
    };
  } catch {
    return null;
  }
}

function readPersistedState<T>(
  key: string,
  deserialize: (raw: unknown) => T | null,
): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted<unknown>;
    if (parsed.expires < Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }
    return deserialize(parsed.data);
  } catch {
    return null;
  }
}

function writePersistedState(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  try {
    const entry: Persisted<unknown> = {
      data,
      expires: Date.now() + STATE_CACHE_TTL_MS,
    };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore (quota, etc)
  }
}

let cachedVaultData: VaultData | null =
  readPersistedState<VaultData>(VAULT_CACHE_KEY, deserializeVault);
let cachedPositionData: PositionData | null =
  readPersistedState<PositionData>(POSITION_CACHE_KEY, deserializePosition);

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

function readPrivyEmail(user: ReturnType<typeof usePrivy>["user"]): string {
  return (
    user?.email?.address ??
    (
      user?.linkedAccounts.find((a) => a.type === "email") as
        | { address?: string }
        | undefined
    )?.address ??
    "unknown@local"
  );
}

export function useBrix() {
  const { authenticated, user } = usePrivy();
  const { wallets, ready: solanaWalletsReady } = useSolanaWallets();
  const { signTransaction: signPrivyTransaction } = useSignTransaction();

  // useState initial values are NULL so SSR + first client render match.
  // The module-level cache (and localStorage) is read via useEffect after
  // mount — that's the only way to avoid the hydration mismatch error.
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate from in-memory + localStorage cache after mount. SSR renders
  // with null (correct — no window). Client first render matches that. The
  // useEffect runs synchronously after the first paint; the subsequent
  // render fills the values without flickering through "BRZ 0".
  useEffect(() => {
    if (cachedVaultData) setVaultData(cachedVaultData);
    if (cachedPositionData) setPositionData(cachedPositionData);
  }, []);

  const solanaWallet = useMemo(() => wallets[0] ?? null, [wallets]);

  // Privy's useSignTransaction() returns a NEW function reference on every render.
  // Putting it in the anchorWallet useMemo deps creates an infinite loop:
  // signPrivyTransaction changes → anchorWallet re-creates → program re-creates
  // → fetchVaultData re-creates → useEffect re-fires → setState → re-render → ∞.
  // The ref keeps the callable up-to-date without participating in dep arrays.
  const signTransactionRef = useRef(signPrivyTransaction);
  signTransactionRef.current = signPrivyTransaction;

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
      ) => signWithPrivy(tx, solanaWallet, signTransactionRef.current),
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[],
      ) => {
        const signed: T[] = [];
        for (const tx of txs) {
          signed.push(
            await signWithPrivy(tx, solanaWallet, signTransactionRef.current),
          );
        }
        return signed;
      },
    };
  }, [solanaWallet]);

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

      // APR derived from active receivables (cache-backed via lib/cache.ts):
      // weighted average of rateBps by principal, NET of BRIX_PROTOCOL_FEE_BPS.
      // The first call hits the network; subsequent calls within 20s are a
      // cache hit so this is effectively free.
      let aprBps = 0;
      try {
        const contracts = await getAgencyContracts();
        const active = contracts.filter(
          (c) => c.status === "funded" || c.status === "registered",
        );
        if (active.length > 0) {
          const totalPrincipal = active.reduce(
            (s, c) => s + c.principalBrz,
            0,
          );
          if (totalPrincipal > 0) {
            const weighted = active.reduce(
              (s, c) => s + c.rateBps * c.principalBrz,
              0,
            );
            const gross = Math.round(weighted / totalPrincipal);
            aprBps = Math.max(0, gross - BRIX_PROTOCOL_FEE_BPS);
          }
        }
      } catch {
        // ignore — APR falls back to 0 (cache miss + network failure)
      }

      const next: VaultData = {
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
      };
      cachedVaultData = next;
      writePersistedState(VAULT_CACHE_KEY, serializeVault(next));
      setVaultData(next);
    } catch (err) {
      console.warn("Vault not found:", err);
      // Don't clobber cached value with null on transient errors — keep last
      // known good state so remounted views don't flash empty.
    }
  }, [program]);

  // Reads on-chain vault state and returns the current TVL in BRZ (no setState).
  // Used right after a deposit/withdraw to attach a fresh snapshot to the
  // VaultEvent we record off-chain.
  const fetchVaultTvlBrz = useCallback(async (): Promise<number> => {
    const [vaultPDA] = deriveVaultPDA();
    const vault = await brixAccounts(program).vault.fetch(vaultPDA);
    let ataBalance = 0n;
    try {
      const ataInfo = await connection.getTokenAccountBalance(
        new PublicKey(vault.vaultAta),
      );
      ataBalance = BigInt(ataInfo.value.amount);
    } catch {
      // ignore
    }
    const totalDeployed = BigInt(vault.totalDeployed.toString());
    return Number(ataBalance + totalDeployed) / 1_000_000;
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

      const next: PositionData = {
        shares,
        totalDeposited: BigInt(position.totalDeposited.toString()),
        totalWithdrawn: BigInt(position.totalWithdrawn.toString()),
        estimatedValueBrz,
      };
      cachedPositionData = next;
      writePersistedState(POSITION_CACHE_KEY, serializePosition(next));
      setPositionData(next);
    } catch {
      // Same reasoning as vault — don't reset to null on transient failures.
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

      // Record the off-chain event for history + chart, then refresh state.
      try {
        const tvlAfter = await fetchVaultTvlBrz();
        await recordVaultEvent({
          investorEmail: readPrivyEmail(user),
          investorPubkey: anchorWallet.publicKey.toBase58(),
          kind: "deposit",
          amountBrz,
          txSignature: txSig,
          vaultTvlBrzAfter: tvlAfter,
        });
      } catch (err) {
        console.warn("[use-brix] failed to record deposit event:", err);
      }

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

      // Pre-tx vault TVL is captured for delta; here we record post-tx for the
      // chart, plus the BRZ amount the user actually received (shares→BRZ).
      try {
        const tvlAfter = await fetchVaultTvlBrz();
        // Best-effort BRZ amount: shares * (totalAssets / totalShares) at time of withdraw.
        const totalSharesNow = vaultData
          ? Number(vaultData.totalShares)
          : 1;
        const totalAssetsNow = vaultData
          ? Number(vaultData.totalAssets)
          : 0;
        const sharePrice =
          totalSharesNow > 0 ? totalAssetsNow / totalSharesNow : 1;
        const amountBrz = (Number(shares) * sharePrice) / 1_000_000;
        await recordVaultEvent({
          investorEmail: readPrivyEmail(user),
          investorPubkey: anchorWallet.publicKey.toBase58(),
          kind: "withdraw",
          amountBrz,
          txSignature: txSig,
          vaultTvlBrzAfter: tvlAfter,
        });
      } catch (err) {
        console.warn("[use-brix] failed to record withdraw event:", err);
      }

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
