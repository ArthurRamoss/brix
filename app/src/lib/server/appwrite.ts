// Server-only Appwrite admin client. ONLY imported by app/src/app/api/**/route.ts
// handlers. API key (APPWRITE_API_KEY) is read from process.env which Next does
// NOT expose to the client bundle — only NEXT_PUBLIC_* makes it client-side.
// Importing this file from a "use client" component is a bug; if you need a
// guard, install the optional `server-only` package and import it here.
//
// Touch this file when:
// - adding a new table (update Tables const + bootstrap script)
// - changing the default agency email (MVP: single agency)
// - adjusting the row-to-data shape (rowToData)

import { Client, TablesDB, Permission, Role } from "node-appwrite";

// Read server-only env vars without the NEXT_PUBLIC_ prefix — these never
// need to enter the client bundle. Fallback to the legacy NEXT_PUBLIC_
// names so existing local .env.local files keep working during transition.
const ENDPOINT =
  process.env.APPWRITE_ENDPOINT ??
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ??
  "";
const PROJECT_ID =
  process.env.APPWRITE_PROJECT_ID ??
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ??
  "";
const API_KEY = process.env.APPWRITE_API_KEY ?? "";

export const DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID ??
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ??
  "brix_main";

// Table IDs — kept in sync with scripts/appwrite-bootstrap.ts.
export const Tables = {
  Applications: "agency_applications",
  Clients: "agency_clients",
  Properties: "agency_properties",
  Contracts: "agency_contracts",
  VaultEvents: "vault_events",
} as const;

// MVP demo: a single agency operates the platform. v2 will derive this
// from the authenticated agency session.
export const DEFAULT_AGENCY_EMAIL = "demo@selectimob.brix";

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.warn(
    "[appwrite/server] Missing one of NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY. API routes will fail at request time.",
  );
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

export const tablesDB = new TablesDB(client);
export { Permission, Role };

// Detect Appwrite 404. Used to translate to API 404s without leaking SDK shape.
export function isAppwriteNotFound(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: number; type?: string };
  return (
    e.code === 404 ||
    e.type === "document_not_found" ||
    e.type === "row_not_found"
  );
}

// Appwrite returns rows with $-prefixed system fields. Strip them and
// promote $id -> id so the client side keeps the same shape it had with
// localStorage.
type AppwriteRow = {
  $id: string;
  [k: string]: unknown;
};

export function rowToData<T>(row: AppwriteRow): T {
  const out: Record<string, unknown> = { id: row.$id };
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("$")) continue;
    out[key] = value;
  }
  return out as T;
}

// Helpers to standardize JSON responses across handlers.
export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function serverError(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[api] server error:", err);
  return Response.json({ error: message }, { status: 500 });
}
