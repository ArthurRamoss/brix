// /api/vault-events
//
// Off-chain mirror of vault activity (deposits, withdraws, fund_landlord, repay).
// Each event is recorded by the client right after the on-chain tx confirms,
// so we have a queryable history without indexing the chain.
//
// Powers:
//   - /invest TVL chart (timeline of vaultTvlBrzAfter)
//   - /invest "minha posição" history (filtered by investorEmail)
//   - /invest 24h delta KPI
//
// GET   ?email=...   → VaultEvent[] for that user (sorted desc by createdAt)
// GET   (no filter)  → VaultEvent[] global (sorted asc by createdAt — TVL chart)
// POST  body: { ...VaultEvent }  → create row (server validates txSignature on-chain)

import { Connection, PublicKey } from "@solana/web3.js";
import { ID, Query } from "node-appwrite";
import {
  DATABASE_ID,
  Tables,
  badRequest,
  json,
  rowToData,
  serverError,
  tablesDB,
} from "../../../lib/server/appwrite";

const RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const PROGRAM_ID = "6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94";

const SIG_REGEX = /^[1-9A-HJ-NP-Za-km-z]{86,90}$/;

function pickRows(result: unknown): { $id: string; [k: string]: unknown }[] {
  const r = result as { rows?: unknown[]; documents?: unknown[] };
  const list = r.rows ?? r.documents ?? [];
  return list as { $id: string; [k: string]: unknown }[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "200", 10) || 200, 1),
    500,
  );

  try {
    const queries = email
      ? [
          Query.equal("investorEmail", email),
          Query.orderDesc("createdAt"),
          Query.limit(limit),
        ]
      : [Query.orderAsc("createdAt"), Query.limit(limit)];

    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: Tables.VaultEvents,
      queries,
    });
    return json(pickRows(result).map((r) => rowToData(r)));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("invalid JSON body");
  }

  const investorEmail = String(body.investorEmail ?? "").trim().toLowerCase();
  const investorPubkey = String(body.investorPubkey ?? "").trim();
  const kind = String(body.kind ?? "");
  const amountBrz = Number(body.amountBrz);
  const txSignature = body.txSignature ? String(body.txSignature) : "";

  // ─── Validation ─────────────────────────────────────────────────────────
  // We require a real on-chain tx to back every event row. Without this, the
  // route is open for anyone with curl to forge events (the off-chain feed
  // drives the TVL chart and per-user history — high-impact target).
  if (!investorEmail || !investorPubkey) {
    return badRequest("investorEmail and investorPubkey required");
  }
  if (!["deposit", "withdraw", "fund", "repay"].includes(kind)) {
    return badRequest("kind must be deposit | withdraw | fund | repay");
  }
  if (!Number.isFinite(amountBrz) || amountBrz <= 0 || amountBrz > 10_000_000) {
    return badRequest("amountBrz must be a positive number under 10M");
  }
  try {
    new PublicKey(investorPubkey);
  } catch {
    return badRequest("investorPubkey is not a valid base58 Solana address");
  }
  if (!txSignature || !SIG_REGEX.test(txSignature)) {
    return badRequest("txSignature is required and must be a valid base58 signature");
  }

  // Server-side proof: the tx must exist on-chain AND have invoked the Brix
  // program. This means a forged event-creation request has to first pay for
  // a real Solana transaction that touches our program — economically
  // hostile to spam, even on devnet.
  try {
    const connection = new Connection(RPC, "confirmed");
    const tx = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) {
      return badRequest("txSignature not found on-chain");
    }
    if (tx.meta?.err) {
      return badRequest("txSignature is from a failed transaction");
    }
    const logs = tx.meta?.logMessages ?? [];
    const touchedBrix = logs.some((l) => l.includes(PROGRAM_ID));
    if (!touchedBrix) {
      return badRequest("txSignature did not interact with the Brix program");
    }
  } catch (err) {
    return serverError(err);
  }

  // Idempotency: if a row already exists with this txSignature, return it
  // instead of creating a duplicate. Belt-and-suspenders for client retries.
  try {
    const existing = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: Tables.VaultEvents,
      queries: [Query.equal("txSignature", txSignature), Query.limit(1)],
    });
    const rows = pickRows(existing);
    if (rows.length > 0) {
      return json(rowToData(rows[0]), { status: 200 });
    }
  } catch {
    // Non-fatal — fall through to create.
  }

  const data = {
    investorEmail,
    investorPubkey,
    kind,
    amountBrz,
    txSignature,
    contractId: body.contractId ? String(body.contractId) : undefined,
    vaultTvlBrzAfter:
      typeof body.vaultTvlBrzAfter === "number"
        ? body.vaultTvlBrzAfter
        : undefined,
    createdAt:
      typeof body.createdAt === "number" ? body.createdAt : Date.now(),
  };

  try {
    const row = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: Tables.VaultEvents,
      rowId: ID.unique(),
      data,
    });
    return json(rowToData(row as { $id: string; [k: string]: unknown }), {
      status: 201,
    });
  } catch (err) {
    return serverError(err);
  }
}
