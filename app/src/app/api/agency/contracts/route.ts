// /api/agency/contracts
//
// Contratos on-chain (mirror off-chain pra UI). 1 contract → 1 client + 1 property.
//
// GET    ?clientId=...   → AgencyContract[] filtered by clientId
// GET    ?email=...      → AgencyContract[] filtered by client email
// GET    ?nextId=true    → string (próximo ID human-readable, BRX-2026-NNNN)
// GET    (no filter)     → AgencyContract[] (all, capped)
// POST   body: { ...AgencyContract } → upsert row (rowId = body.id)
// DELETE ?id=...         → delete row (idempotent: 204 even if missing)

import { Query } from "node-appwrite";
import {
  DATABASE_ID,
  Tables,
  badRequest,
  isAppwriteNotFound,
  json,
  rowToData,
  serverError,
  tablesDB,
} from "../../../../lib/server/appwrite";

function pickRows(result: unknown): { $id: string; [k: string]: unknown }[] {
  const r = result as { rows?: unknown[]; documents?: unknown[] };
  const list = r.rows ?? r.documents ?? [];
  return list as { $id: string; [k: string]: unknown }[];
}

function pickTotal(result: unknown): number {
  const r = result as { total?: number };
  return typeof r.total === "number" ? r.total : 0;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const email = searchParams.get("email")?.trim().toLowerCase();
  const nextId = searchParams.get("nextId");

  try {
    if (nextId === "true") {
      const result = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: Tables.Contracts,
        queries: [Query.limit(1)],
        total: true,
      });
      const total = pickTotal(result);
      // 4-char random suffix avoids collisions with orphan on-chain PDAs
      // (a previous register_receivable tx may have created the PDA but a
      // failed fund_landlord left no off-chain row, so the sequence number
      // alone could re-derive the same PDA → "already in use" error). The
      // suffix keeps the ID under 32 bytes (BRX-2026-NNNN-XXXX = 18 chars).
      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const id = `BRX-2026-${String(total + 1).padStart(4, "0")}-${suffix}`;
      return json(id);
    }

    if (email) {
      // Resolve email → clientId via Clients table, then filter contracts.
      const clientResult = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: Tables.Clients,
        queries: [Query.equal("email", email), Query.limit(1)],
      });
      const clientRows = pickRows(clientResult);
      if (clientRows.length === 0) return json([]);
      const cid = clientRows[0].$id;

      const result = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: Tables.Contracts,
        queries: [
          Query.equal("clientId", cid),
          Query.limit(200),
          Query.orderDesc("registeredAt"),
        ],
      });
      return json(pickRows(result).map((r) => rowToData(r)));
    }

    const queries = [Query.limit(200), Query.orderDesc("registeredAt")];
    if (clientId) queries.unshift(Query.equal("clientId", clientId));

    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: Tables.Contracts,
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

  const id = String(body.id ?? "").trim();
  const clientId = String(body.clientId ?? "").trim();
  const propertyId = String(body.propertyId ?? "").trim();
  if (!id || !clientId || !propertyId) {
    return badRequest("id, clientId, propertyId required");
  }

  const data = {
    clientId,
    propertyId,
    landlordName: String(body.landlordName ?? ""),
    propertyAddress: String(body.propertyAddress ?? ""),
    principalBrz: Number(body.principalBrz ?? 0),
    repaymentBrz: Number(body.repaymentBrz ?? 0),
    rateBps: Number(body.rateBps ?? 0),
    durationDays: Number(body.durationDays ?? 0),
    installmentsTotal: Number(body.installmentsTotal ?? 1),
    installmentsPaid: Number(body.installmentsPaid ?? 0),
    status:
      typeof body.status === "string" ? body.status : "pending",
    hasInsurance: Boolean(body.hasInsurance ?? false),
    insurer: body.insurer ? String(body.insurer) : undefined,
    registerSig: body.registerSig ? String(body.registerSig) : undefined,
    fundSig: body.fundSig ? String(body.fundSig) : undefined,
    registeredAt:
      typeof body.registeredAt === "number" ? body.registeredAt : Date.now(),
    fundedAt:
      typeof body.fundedAt === "number" ? body.fundedAt : undefined,
  };

  try {
    const row = await tablesDB.upsertRow({
      databaseId: DATABASE_ID,
      tableId: Tables.Contracts,
      rowId: id,
      data,
    });
    return json(rowToData(row as { $id: string; [k: string]: unknown }), {
      status: 201,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("id query param required");

  try {
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: Tables.Contracts,
      rowId: id,
    });
    return new Response(null, { status: 204 });
  } catch (err) {
    if (isAppwriteNotFound(err)) {
      // Idempotent: missing row is the same outcome as deleted.
      return new Response(null, { status: 204 });
    }
    return serverError(err);
  }
}
