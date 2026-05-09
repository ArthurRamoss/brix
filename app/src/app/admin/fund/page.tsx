"use client";

// /admin/fund — TEMPORARY page for funding the on-chain admin wallet from
// any logged-in Privy wallet (investor or agency persona). The admin needs
// SOL on devnet to upgrade the Brix program (anchor deploy), and the public
// devnet faucet is rate-limited per IP/8h. Both Privy embedded wallets
// (investor + agency) hold ~2.5 SOL each, so we route the deploy budget
// through them.
//
// Delete this whole folder after the deploy lands — it shouldn't ship to
// any real environment.

import { usePrivy } from "@privy-io/react-auth";
import {
  useSignTransaction,
  useWallets as useSolanaWallets,
} from "@privy-io/react-auth/solana";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useEffect, useState } from "react";

const ADMIN = new PublicKey("EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs");
const RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export default function FundAdminPage() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useSolanaWallets();
  const { signTransaction } = useSignTransaction();
  const [amount, setAmount] = useState(2);
  const [status, setStatus] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [adminBalance, setAdminBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const wallet = wallets[0] ?? null;

  // Refresh balances on mount + after each send.
  const refreshBalances = async () => {
    try {
      const conn = new Connection(RPC, "confirmed");
      const [adm, wal] = await Promise.all([
        conn.getBalance(ADMIN),
        wallet ? conn.getBalance(new PublicKey(wallet.address)) : Promise.resolve(0),
      ]);
      setAdminBalance(adm / LAMPORTS_PER_SOL);
      if (wallet) setWalletBalance(wal / LAMPORTS_PER_SOL);
    } catch (err) {
      console.warn("balance fetch failed:", err);
    }
  };

  useEffect(() => {
    if (wallet) void refreshBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.address]);

  const send = async () => {
    if (!wallet) {
      setStatus("no wallet connected");
      return;
    }
    setBusy(true);
    setStatus("building tx...");
    try {
      const conn = new Connection(RPC, "confirmed");
      const { blockhash, lastValidBlockHeight } =
        await conn.getLatestBlockhash();
      const from = new PublicKey(wallet.address);
      const tx = new Transaction({
        feePayer: from,
        recentBlockhash: blockhash,
      });
      tx.add(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: ADMIN,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        }),
      );

      setStatus("signing in privy...");
      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const { signedTransaction } = await signTransaction({
        transaction: serialized,
        wallet,
        chain: "solana:devnet",
      });

      setStatus("broadcasting...");
      const sig = await conn.sendRawTransaction(signedTransaction, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      await conn.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );
      setStatus(
        `✓ done · ${sig.slice(0, 16)}… · https://explorer.solana.com/tx/${sig}?cluster=devnet`,
      );
      await refreshBalances();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`✗ ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <PageShell>checking privy…</PageShell>;
  }

  if (!authenticated) {
    return (
      <PageShell>
        <p style={{ marginBottom: 16 }}>Login first (any persona).</p>
        <button onClick={() => login()} style={btnStyle}>
          login
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Row label="from (your wallet)">
        <span style={mono}>{wallet?.address ?? "—"}</span>
        <span style={{ color: "var(--fg-3)" }}>
          {walletBalance !== null ? `${walletBalance.toFixed(4)} SOL` : "—"}
        </span>
      </Row>
      <Row label="to (brix program admin)">
        <span style={mono}>{ADMIN.toBase58()}</span>
        <span style={{ color: "var(--fg-3)" }}>
          {adminBalance !== null ? `${adminBalance.toFixed(4)} SOL` : "—"}
        </span>
      </Row>

      <div style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--fg-2)" }}>
          amount (SOL):
        </label>
        <input
          type="number"
          step="0.5"
          min="0.1"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            color: "var(--fg-0)",
            fontFamily: "monospace",
            fontSize: 14,
            padding: "8px 12px",
            width: 120,
          }}
        />
        <button onClick={send} disabled={busy || amount <= 0} style={btnStyle}>
          {busy ? "…" : `send ${amount} SOL`}
        </button>
      </div>

      {status && (
        <pre
          style={{
            marginTop: 24,
            padding: 16,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: status.startsWith("✓")
              ? "var(--green)"
              : status.startsWith("✗")
                ? "#f88"
                : "var(--fg-2)",
          }}
        >
          {status}
        </pre>
      )}

      <p
        style={{
          marginTop: 32,
          padding: 12,
          background: "var(--bg-1)",
          border: "1px solid var(--line-soft)",
          borderRadius: 6,
          fontSize: 11,
          color: "var(--fg-3)",
        }}
      >
        ⚠ temporary admin tool · delete <code>app/src/app/admin/</code> after
        the program upgrade lands.
      </p>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          margin: "0 0 8px",
          letterSpacing: "-0.02em",
        }}
      >
        fund admin wallet
      </h1>
      <p
        style={{
          color: "var(--fg-2)",
          marginTop: 0,
          marginBottom: 32,
          fontSize: 13,
        }}
      >
        one-shot transfer SOL → brix admin so we can upgrade the program on
        devnet. uses your privy-embedded wallet to sign.
      </p>
      {children}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--fg-3)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 13,
          alignItems: "baseline",
          flexWrap: "wrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const mono: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: 12,
  color: "var(--fg-1)",
  wordBreak: "break-all",
};

const btnStyle: React.CSSProperties = {
  background: "var(--teal)",
  color: "var(--bg-0)",
  border: 0,
  borderRadius: 6,
  padding: "10px 18px",
  fontWeight: 500,
  fontSize: 14,
  cursor: "pointer",
};
