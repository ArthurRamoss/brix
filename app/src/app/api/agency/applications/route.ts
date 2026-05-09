// /api/agency/applications
//
// One row per agency (keyed by email). Holds the onboard form data + status
// (none/pending/approved). Replaces the old `brix_agency_application_v2` and
// `brix_agency_status_v2` localStorage keys.
//
// GET   ?email=...                  → application or null
// POST  body: { ...AgencyApplication } → upsert row (rowId = slug of email)
// PATCH ?email=...  body: { status, decidedAt? } → update status only

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

function slugifyEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  if (!email) return badRequest("email query param required");

  try {
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: Tables.Applications,
      queries: [Query.equal("email", email), Query.limit(1)],
    });
    const rows = (result as { rows?: unknown[]; documents?: unknown[] }).rows
      ?? (result as { documents?: unknown[] }).documents
      ?? [];
    if (rows.length === 0) return json(null);
    return json(rowToData(rows[0] as { $id: string; [k: string]: unknown }));
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
  if (!email) return badRequest("email required");

  const data = {
    companyName: String(body.companyName ?? ""),
    contactName: String(body.contactName ?? ""),
    email,
    website: body.website ? String(body.website) : undefined,
    city: body.city ? String(body.city) : undefined,
    contractsUnderManagement:
      typeof body.contractsUnderManagement === "number"
        ? body.contractsUnderManagement
        : undefined,
    status: typeof body.status === "string" ? body.status : "pending",
    appliedAt:
      typeof body.appliedAt === "number" ? body.appliedAt : Date.now(),
  };

  try {
    const row = await tablesDB.upsertRow({
      databaseId: DATABASE_ID,
      tableId: Tables.Applications,
      rowId: slugifyEmail(email),
      data,
    });
    return json(rowToData(row as { $id: string; [k: string]: unknown }), {
      status: 201,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  if (!email) return badRequest("email query param required");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("invalid JSON body");
  }

  const status = body.status as string | undefined;
  if (!status || !["none", "pending", "approved"].includes(status)) {
    return badRequest("status must be one of: none, pending, approved");
  }

  try {
    // Find existing row by email (rowId is slug of email).
    const rowId = slugifyEmail(email);
    const data: Record<string, unknown> = { status };
    if (status === "approved" || status === "none") {
      data.decidedAt = Date.now();
    }
    const updated = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: Tables.Applications,
      rowId,
      data,
    });
    return json(rowToData(updated as { $id: string; [k: string]: unknown }));
  } catch (err) {
    if (isAppwriteNotFound(err)) {
      return json({ error: "application not found" }, { status: 404 });
    }
    return serverError(err);
  }
}
