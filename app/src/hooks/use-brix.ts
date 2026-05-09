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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
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

// ─── localStorage layer ──────────────────────────────────────────────────────
// Persists vault/position across full reloads. The module-level store below
// hydrates from this on first import so we paint last-known values instantly.

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

// ─── Module-level singleton store ────────────────────────────────────────────
// All useBrix() callers share the same vault/position state. Mounts/unmounts
// from tab switches or page navs don't re-fetch — they just subscribe to the
// store and read its current value. TTL enforces refresh when stale; an
// in-flight promise dedups parallel callers down to a single RPC roundtrip.
//
// Why useSyncExternalStore instead of useState:
//   - getSnapshot returns the same reference for unchanged data → no spurious
//     re-renders.
//   - getServerSnapshot returns null so SSR + first hydration paint match.
//   - Post-hydration, snapshot becomes the localStorage-hydrated value, so
//     remounted components read instantly without an empty-state flash.

const VAULT_TTL_MS = 30_000;
const POSITION_TTL_MS = 30_000;

let vaultStore: VaultData | null = readPersistedState<VaultData>(
  VAULT_CACHE_KEY,
  deserializeVault,
);
let positionStore: PositionData | null = readPersistedState<PositionData>(
  POSITION_CACHE_KEY,
  deserializePosition,
);
let isLoadingStore = false;

let lastVaultFetchAt = 0;
let lastPositionFetchAt = 0;
let inflightVaultFetch: Promise<void> | null = null;
let inflightPositionFetch: Promise<void> | null = null;

const subscribers = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function notify() {
  for (const cb of subscribers) cb();
}

function setVaultStore(v: VaultData) {
  vaultStore = v;
  writePersistedState(VAULT_CACHE_KEY, serializeVault(v));
  notify();
}

function setPositionStore(p: PositionData | null) {
  positionStore = p;
  if (p) writePersistedState(POSITION_CACHE_KEY, serializePosition(p));
  notify();
}

function setIsLoadingStore(v: boolean) {
  if (isLoadingStore === v) return;
  isLoadingStore = v;
  notify();
}

function getVaultSnapshot(): VaultData | null {
  return vaultStore;
}
function getPositionSnapshot(): PositionData | null {
  return positionStore;
}
function getIsLoadingSnapshot(): boolean {
  return isLoadingStore;
}
function getNullSnapshot(): null {
  return null;
}
function getFalseSnapshot(): boolean {
  return false;
}

// ─── Fetch primitives (with dedup + TTL) ────────────────────────────────────

async function doFetchVault(program: BrixProgramClient): Promise<void> {
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
    let aprBps = 0;
    try {
      const contracts = await getAgencyContracts();
      const active = contracts.filter(
        (c) => c.status === "funded" || c.status === "registered",
      );
      if (active.length > 0) {
        const totalPrincipal = active.reduce((s, c) => s + c.principalBrz, 0);
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

    setVaultStore({
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
    console.warn("Vault not found:", err);
    // Don't clobber vaultStore — keep last known good state so remounted
    // views don't flash empty.
  }
}

async function fetchVaultIfStale(
  program: BrixProgramClient,
  force = false,
): Promise<void> {
  if (inflightVaultFetch) return inflightVaultFetch;
  if (!force && vaultStore && Date.now() - lastVaultFetchAt < VAULT_TTL_MS) {
    return;
  }
  inflightVaultFetch = (async () => {
    try {
      await doFetchVault(program);
    } finally {
      lastVaultFetchAt = Date.now();
      inflightVaultFetch = null;
    }
  })();
  return inflightVaultFetch;
}

async function doFetchPosition(
  program: BrixProgramClient,
  investorPubkey: PublicKey,
): Promise<void> {
  const [vaultPDA] = deriveVaultPDA();
  try {
    const [positionPDA] = derivePositionPDA(
      program.programId,
      vaultPDA,
      investorPubkey,
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

    setPositionStore({
      shares,
      totalDeposited: BigInt(position.totalDeposited.toString()),
      totalWithdrawn: BigInt(position.totalWithdrawn.toString()),
      estimatedValueBrz,
    });
  } catch {
    // Don't reset on transient failures — keep last position.
  }
}

async function fetchPositionIfStale(
  program: BrixProgramClient,
  investorPubkey: PublicKey,
  force = false,
): Promise<void> {
  if (inflightPositionFetch) return inflightPositionFetch;
  if (
    !force &&
    positionStore &&
    Date.now() - lastPositionFetchAt < POSITION_TTL_MS
  ) {
    return;
  }
  inflightPositionFetch = (async () => {
    try {
      await doFetchPosition(program, investorPubkey);
    } finally {
      lastPositionFetchAt = Date.now();
      inflightPositionFetch = null;
    }
  })();
  return inflightPositionFetch;
}

// ─── Privy signing helpers ───────────────────────────────────────────────────

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

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBrix() {
  const { authenticated, user, ready: privyReady } = usePrivy();
  const { wallets, ready: solanaWalletsReady } = useSolanaWallets();
  const { signTransaction: signPrivyTransaction } = useSignTransaction();

  // Subscribe to module-level store. SSR + first client hydration return the
  // server snapshot (null) so they match. Post-hydration, the client snapshot
  // is the populated store value (hydrated from localStorage on module load).
  const vaultData = useSyncExternalStore<VaultData | null>(
    subscribe,
    getVaultSnapshot,
    getNullSnapshot,
  );
  const positionData = useSyncExternalStore<PositionData | null>(
    subscribe,
    getPositionSnapshot,
    getNullSnapshot,
  );
  const isLoading = useSyncExternalStore<boolean>(
    subscribe,
    getIsLoadingSnapshot,
    getFalseSnapshot,
  );

  const solanaWallet = useMemo(() => wallets[0] ?? null, [wallets]);

  // Privy's useSignTransaction() returns a NEW function reference on every
  // render. Putting it in deps creates an infinite loop; the ref keeps the
  // callable up-to-date without participating in dep arrays.
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

  // Trigger initial vault + position fetches when wallet stabilizes. Multiple
  // useBrix instances mounting simultaneously all call these — module-level
  // dedup collapses the burst into a single network request.
  useEffect(() => {
    void fetchVaultIfStale(program);
  }, [program]);

  useEffect(() => {
    // Boot phase: Privy still initializing — don't touch the store. Otherwise
    // we'd clobber the localStorage-hydrated cache and force the KPIs to flash
    // through 0 → real value once Privy resolves a few hundred ms later.
    if (!privyReady) return;

    // Privy resolved AND user is not logged in: legitimately empty state.
    // (Not perfect across user-switches since the cache key isn't user-scoped,
    // but covers the common "logged out" case.)
    if (!authenticated || !solanaWalletsReady || !solanaWallet) {
      setPositionStore(null);
      return;
    }

    void fetchPositionIfStale(program, anchorWallet.publicKey);
  }, [
    privyReady,
    authenticated,
    solanaWalletsReady,
    solanaWallet,
    program,
    anchorWallet.publicKey,
  ]);

  // Read-only helper used by deposit/withdraw to attach a fresh TVL snapshot
  // to recorded events. Doesn't go through the store — intentionally returns
  // a one-shot value.
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
    setIsLoadingStore(true);

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

      // Record off-chain event for history + chart, then force-refetch (bypass
      // TTL) since we just changed on-chain state.
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

      await Promise.all([
        fetchVaultIfStale(program, true),
        fetchPositionIfStale(program, anchorWallet.publicKey, true),
      ]);
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha no depósito", { description: msg });
    } finally {
      setIsLoadingStore(false);
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
    setIsLoadingStore(true);

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

      try {
        const tvlAfter = await fetchVaultTvlBrz();
        const totalSharesNow = vaultStore ? Number(vaultStore.totalShares) : 1;
        const totalAssetsNow = vaultStore ? Number(vaultStore.totalAssets) : 0;
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

      await Promise.all([
        fetchVaultIfStale(program, true),
        fetchPositionIfStale(program, anchorWallet.publicKey, true),
      ]);
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha no saque", { description: msg });
    } finally {
      setIsLoadingStore(false);
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
      void fetchVaultIfStale(program, true);
      if (authenticated && solanaWallet) {
        void fetchPositionIfStale(program, anchorWallet.publicKey, true);
      }
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
