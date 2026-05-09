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
//   - APR calculation (from fund + repay deltas — future)
//
// GET   ?email=...   → VaultEvent[] for that user (sorted desc by createdAt)
// GET   (no filter)  → VaultEvent[] global (sorted asc by createdAt — TVL chart)
// POST  body: { ...VaultEvent }  → create row

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

  if (!investorEmail || !investorPubkey) {
    return badRequest("investorEmail and investorPubkey required");
  }
  if (!["deposit", "withdraw", "fund", "repay"].includes(kind)) {
    return badRequest("kind must be deposit | withdraw | fund | repay");
  }
  if (!Number.isFinite(amountBrz)) {
    return badRequest("amountBrz must be a number");
  }

  const data = {
    investorEmail,
    investorPubkey,
    kind,
    amountBrz,
    txSignature: body.txSignature ? String(body.txSignature) : undefined,
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
