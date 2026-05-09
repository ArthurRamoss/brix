// /api/agency/properties
//
// Imóveis vinculados a clientes. Um cliente pode ter N imóveis.
//
// GET   ?clientId=...            → AgencyProperty[] (filtered)
// GET   ?id=...                  → AgencyProperty or null
// GET   (no filter)              → AgencyProperty[] (all, capped)
// POST  body: { ...AgencyProperty } → create new row (rowId auto)

import { ID, Query } from "node-appwrite";
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const id = searchParams.get("id");

  try {
    if (id) {
      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: Tables.Properties,
          rowId: id,
        });
        return json(rowToData(row as { $id: string; [k: string]: unknown }));
      } catch (err) {
        if (isAppwriteNotFound(err)) return json(null);
        throw err;
      }
    }

    const queries = [Query.limit(200), Query.orderDesc("createdAt")];
    if (clientId) queries.unshift(Query.equal("clientId", clientId));

    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: Tables.Properties,
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

  const clientId = String(body.clientId ?? "").trim();
  const address = String(body.address ?? "").trim();
  const monthlyRentBrz = Number(body.monthlyRentBrz);
  if (!clientId || !address || !Number.isFinite(monthlyRentBrz)) {
    return badRequest("clientId, address, and monthlyRentBrz required");
  }

  const data = {
    clientId,
    address,
    monthlyRentBrz,
    propertyType:
      typeof body.propertyType === "string" ? body.propertyType : "apartment",
    notes: body.notes ? String(body.notes) : undefined,
    createdAt:
      typeof body.createdAt === "number" ? body.createdAt : Date.now(),
  };

  const rowId =
    typeof body.id === "string" && body.id.trim()
      ? body.id.trim()
      : ID.unique();

  try {
    const row = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: Tables.Properties,
      rowId,
      data,
    });
    return json(rowToData(row as { $id: string; [k: string]: unknown }), {
      status: 201,
    });
  } catch (err) {
    return serverError(err);
  }
}
