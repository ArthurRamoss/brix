// /api/admin/backfill
//
// One-shot backfill of vault_events from on-chain history. Useful for
// populating the per-user "minha posição" history when deposits/withdraws
// happened before the recordVaultEvent wire-up shipped (or after a Appwrite
// reset).
//
// POST body: { pubkey: string, email: string }
//
// Strategy:
//   1. getSignaturesForAddress(pubkey) — recent txs involving the wallet
//   2. For each sig, getTransaction (versioned)
//   3. Keep only txs that hit the Brix program (logs reference programId)
//   4. Diff the BRZ token balance of the wallet pre/post
//      - negative diff (BRZ left wallet) → "deposit"
//      - positive diff (BRZ entered wallet) → "withdraw"
//   5. Skip sigs that already have an event row (idempotent re-runs)
//   6. Insert into vault_events with the on-chain blockTime as createdAt
//
// Limitations: only catches deposit/withdraw (investor side). fund/repay
// events from the agency are still produced by the live recordVaultEvent
// wire-up — those write events at the moment the tx is signed.

import { Connection, PublicKey } from "@solana/web3.js";
import { ID, Query } from "node-appwrite";
import {
  DATABASE_ID,
  Tables,
  badRequest,
  json,
  serverError,
  tablesDB,
} from "../../../../lib/server/appwrite";

const PROGRAM_ID_STR = "6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94";
const BRZ_MINT_STR =
  process.env.NEXT_PUBLIC_BRZ_MINT ??
  "12fpfju1pfJEVkNqiucWqiUpmZzCjPgDCARRFvK2M6A7";
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

type ScanResult = {
  signature: string;
  kind: "deposit" | "withdraw" | null;
  amountBrz: number;
  blockTime: number;
  reason?: string;
};

async function alreadyRecorded(sig: string): Promise<boolean> {
  try {
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: Tables.VaultEvents,
      queries: [Query.equal("txSignature", sig), Query.limit(1)],
    });
    const r = result as { rows?: unknown[]; documents?: unknown[] };
    const list = r.rows ?? r.documents ?? [];
    return list.length > 0;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("invalid JSON body");
  }

  const pubkeyStr = String(body.pubkey ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const limit = Math.min(
    Math.max(Number(body.limit ?? 100), 1),
    1000,
  );

  if (!pubkeyStr || !email) {
    return badRequest("pubkey and email required");
  }

  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(pubkeyStr);
  } catch {
    return badRequest("pubkey is not a valid base58 Solana address");
  }

  const connection = new Connection(RPC_URL, "confirmed");

  let sigs;
  try {
    sigs = await connection.getSignaturesForAddress(pubkey, { limit });
  } catch (err) {
    return serverError(err);
  }

  const scanned: ScanResult[] = [];
  const inserted: ScanResult[] = [];
  const skipped: ScanResult[] = [];

  for (const sigInfo of sigs) {
    const sig = sigInfo.signature;

    // Skip txs that already have an event row.
    if (await alreadyRecorded(sig)) {
      skipped.push({
        signature: sig,
        kind: null,
        amountBrz: 0,
        blockTime: sigInfo.blockTime ?? 0,
        reason: "already recorded",
      });
      continue;
    }

    let tx;
    try {
      tx = await connection.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
    } catch {
      continue;
    }
    if (!tx || tx.meta?.err) {
      scanned.push({
        signature: sig,
        kind: null,
        amountBrz: 0,
        blockTime: sigInfo.blockTime ?? 0,
        reason: "tx not found or failed",
      });
      continue;
    }

    // Only consider txs that involve the Brix program (logs mention it).
    const logs = tx.meta?.logMessages ?? [];
    const hasBrix = logs.some((l) => l.includes(PROGRAM_ID_STR));
    if (!hasBrix) {
      scanned.push({
        signature: sig,
        kind: null,
        amountBrz: 0,
        blockTime: sigInfo.blockTime ?? 0,
        reason: "not a Brix program tx",
      });
      continue;
    }

    // Diff BRZ token balance for our pubkey.
    const pre = (tx.meta?.preTokenBalances ?? []).find(
      (b) => b.owner === pubkeyStr && b.mint === BRZ_MINT_STR,
    );
    const post = (tx.meta?.postTokenBalances ?? []).find(
      (b) => b.owner === pubkeyStr && b.mint === BRZ_MINT_STR,
    );
    if (!pre || !post) {
      scanned.push({
        signature: sig,
        kind: null,
        amountBrz: 0,
        blockTime: sigInfo.blockTime ?? 0,
        reason: "no BRZ balance change for this wallet",
      });
      continue;
    }

    const preAmt = BigInt(pre.uiTokenAmount.amount);
    const postAmt = BigInt(post.uiTokenAmount.amount);
    const diff = postAmt - preAmt;
    if (diff === 0n) {
      scanned.push({
        signature: sig,
        kind: null,
        amountBrz: 0,
        blockTime: sigInfo.blockTime ?? 0,
        reason: "zero diff",
      });
      continue;
    }

    const kind: "deposit" | "withdraw" = diff < 0n ? "deposit" : "withdraw";
    const absDiff = diff < 0n ? -diff : diff;
    const amountBrz = Number(absDiff) / 1_000_000;
    const blockTime = sigInfo.blockTime ?? Math.floor(Date.now() / 1000);

    try {
      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: Tables.VaultEvents,
        rowId: ID.unique(),
        data: {
          investorEmail: email,
          investorPubkey: pubkeyStr,
          kind,
          amountBrz,
          txSignature: sig,
          createdAt: blockTime * 1000,
        },
      });
      inserted.push({ signature: sig, kind, amountBrz, blockTime });
    } catch (err) {
      console.error("[backfill] failed to insert event:", err);
    }
  }

  return json({
    pubkey: pubkeyStr,
    email,
    totalSigsFound: sigs.length,
    inserted: inserted.length,
    skipped: skipped.length,
    scanned: scanned.length,
    insertedDetails: inserted,
  });
}
