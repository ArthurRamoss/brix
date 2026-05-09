// /api/agency/clients
//
// Property owners cadastrados pela imobiliária.
//
// GET   ?email=...                → AgencyClient or null (single)
// GET   (no filter)               → AgencyClient[] (all)
// POST  body: { ...AgencyClient } → upsert row (rowId = slug of email)

import { Query } from "node-appwrite";
import {
  DATABASE_ID,
  DEFAULT_AGENCY_EMAIL,
  Tables,
  badRequest,
  json,
  rowToData,
  serverError,
  tablesDB,
} from "../../../../lib/server/appwrite";

function slugifyEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

function pickRows(result: unknown): { $id: string; [k: string]: unknown }[] {
  const r = result as { rows?: unknown[]; documents?: unknown[] };
  const list = r.rows ?? r.documents ?? [];
  return list as { $id: string; [k: string]: unknown }[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  try {
    if (email) {
      const result = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: Tables.Clients,
        queries: [Query.equal("email", email), Query.limit(1)],
      });
      const rows = pickRows(result);
      return json(rows.length === 0 ? null : rowToData(rows[0]));
    }

    // No filter — list all (capped). MVP demo doesn't need pagination.
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: Tables.Clients,
      queries: [Query.limit(100), Query.orderDesc("createdAt")],
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

  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  if (!email || !name) return badRequest("name and email required");

  // rowId is derived from email + a short suffix to allow re-cadastros if
  // ever needed (idempotent: same email overwrites same row).
  const id =
    typeof body.id === "string" && body.id.trim()
      ? body.id.trim()
      : slugifyEmail(email);

  const data = {
    name,
    email,
    cpf: body.cpf ? String(body.cpf) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    pixKey: body.pixKey ? String(body.pixKey) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
    agencyEmail: String(body.agencyEmail ?? DEFAULT_AGENCY_EMAIL),
    createdAt:
      typeof body.createdAt === "number" ? body.createdAt : Date.now(),
  };

  try {
    const row = await tablesDB.upsertRow({
      databaseId: DATABASE_ID,
      tableId: Tables.Clients,
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
