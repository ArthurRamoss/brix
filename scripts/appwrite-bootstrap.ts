// scripts/appwrite-bootstrap.ts
//
// Idempotent: cria database `brix_main` + 4 tables (agency_applications,
// agency_clients, agency_properties, agency_contracts) com schema, columns,
// indexes e permissions MVP (read+write Role.any — devnet, zero PII).
//
// Roda: pnpm appwrite:bootstrap
//
// Lê do .env.local na raiz: NEXT_PUBLIC_APPWRITE_ENDPOINT,
// NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID,
// APPWRITE_API_KEY (server-only, gitignored).

import fs from "node:fs";
import path from "node:path";
import {
  Client,
  TablesDB,
  Permission,
  Role,
} from "node-appwrite";

// Index type as string literals — IndexType enum was removed from top-level
// exports in node-appwrite 24+. Values match what the API expects.
type IndexType = "key" | "unique" | "fulltext";

// ─── Env loader ─────────────────────────────────────────────────────────────
// Mesma estratégia do scripts/seed-demo.ts: parser inline, evita dep extra.

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadEnv(): Record<string, string | undefined> {
  const root = process.cwd();
  const merged: Record<string, string | undefined> = {};
  for (const name of [".env", ".env.local"]) {
    Object.assign(merged, parseEnvFile(path.join(root, name)));
  }
  Object.assign(merged, process.env);
  // Resolve ${VAR} references one level deep
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value !== "string") continue;
    merged[key] = value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, k) => merged[k] ?? "");
  }
  return merged;
}

const env = loadEnv();

// Prefer the non-public names; fall back to legacy NEXT_PUBLIC_ ones so
// existing .env.local files keep working during transition.
const ENDPOINT =
  env.APPWRITE_ENDPOINT || env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID =
  env.APPWRITE_PROJECT_ID || env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const DATABASE_ID =
  env.APPWRITE_DATABASE_ID ||
  env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
  "brix_main";
const API_KEY = env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error(
    "Missing Appwrite env vars in .env.local. Need APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY (legacy NEXT_PUBLIC_* names also accepted).",
  );
  process.exit(1);
}

// ─── Client ─────────────────────────────────────────────────────────────────

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const tablesDB = new TablesDB(client);

// ─── ACL ────────────────────────────────────────────────────────────────────
// MVP devnet: qualquer um lê/escreve. Zero PII real, zero dinheiro real.
// Produção: tighten pra Role.user(...) por row e/ou backend signing.

const PUBLIC_RW = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

// ─── Schema definitions ─────────────────────────────────────────────────────

type ColumnDef =
  | { kind: "string"; key: string; size: number; required: boolean; default?: string }
  | { kind: "integer"; key: string; required: boolean; default?: number; min?: number; max?: number }
  | { kind: "float"; key: string; required: boolean; default?: number }
  | { kind: "boolean"; key: string; required: boolean; default?: boolean }
  | { kind: "enum"; key: string; elements: string[]; required: boolean; default?: string };

type IndexDef = {
  key: string;
  type: IndexType;
  attributes: string[];
};

type TableSpec = {
  id: string;
  name: string;
  columns: ColumnDef[];
  indexes: IndexDef[];
};

const SPECS: TableSpec[] = [
  {
    id: "agency_applications",
    name: "Agency Applications",
    columns: [
      { kind: "string", key: "companyName", size: 255, required: true },
      { kind: "string", key: "contactName", size: 255, required: true },
      { kind: "string", key: "email", size: 255, required: true },
      { kind: "string", key: "website", size: 500, required: false },
      { kind: "string", key: "city", size: 100, required: false },
      { kind: "integer", key: "contractsUnderManagement", required: false },
      { kind: "enum", key: "status", elements: ["none", "pending", "approved"], required: true, default: "pending" },
      { kind: "integer", key: "appliedAt", required: true },
      { kind: "integer", key: "decidedAt", required: false },
    ],
    indexes: [
      { key: "email_idx", type: "unique" as IndexType, attributes: ["email"] },
    ],
  },
  {
    id: "agency_clients",
    name: "Agency Clients",
    columns: [
      { kind: "string", key: "name", size: 255, required: true },
      { kind: "string", key: "email", size: 255, required: true },
      { kind: "string", key: "cpf", size: 20, required: false },
      { kind: "string", key: "phone", size: 50, required: false },
      { kind: "string", key: "pixKey", size: 255, required: false },
      { kind: "string", key: "notes", size: 2000, required: false },
      { kind: "string", key: "agencyEmail", size: 255, required: true },
      { kind: "integer", key: "createdAt", required: true },
    ],
    indexes: [
      { key: "email_idx", type: "key" as IndexType, attributes: ["email"] },
      { key: "agency_idx", type: "key" as IndexType, attributes: ["agencyEmail"] },
    ],
  },
  {
    id: "agency_properties",
    name: "Agency Properties",
    columns: [
      { kind: "string", key: "clientId", size: 50, required: true },
      { kind: "string", key: "address", size: 500, required: true },
      { kind: "float", key: "monthlyRentBrz", required: true },
      { kind: "enum", key: "propertyType", elements: ["apartment", "house", "commercial", "other"], required: false, default: "apartment" },
      { kind: "string", key: "notes", size: 2000, required: false },
      { kind: "integer", key: "createdAt", required: true },
    ],
    indexes: [
      { key: "client_idx", type: "key" as IndexType, attributes: ["clientId"] },
    ],
  },
  {
    id: "vault_events",
    name: "Vault Events",
    columns: [
      // Who did it. email is what UI filters on (per-user history).
      { kind: "string", key: "investorEmail", size: 255, required: true },
      { kind: "string", key: "investorPubkey", size: 50, required: true },
      // What happened.
      {
        kind: "enum",
        key: "kind",
        elements: ["deposit", "withdraw", "fund", "repay"],
        required: true,
      },
      // Off-chain mirror values (the program is the source of truth on-chain;
      // this just powers UI charts and the user's personal history).
      { kind: "float", key: "amountBrz", required: true },
      { kind: "string", key: "txSignature", size: 150, required: false },
      // Optional contract context (only for fund/repay events).
      { kind: "string", key: "contractId", size: 50, required: false },
      // Snapshot of vault TVL right after the event — powers the TVL chart
      // without needing a separate aggregation query.
      { kind: "float", key: "vaultTvlBrzAfter", required: false },
      { kind: "integer", key: "createdAt", required: true },
    ],
    indexes: [
      { key: "email_idx", type: "key" as IndexType, attributes: ["investorEmail"] },
      { key: "kind_idx", type: "key" as IndexType, attributes: ["kind"] },
      { key: "created_idx", type: "key" as IndexType, attributes: ["createdAt"] },
    ],
  },
  {
    id: "agency_contracts",
    name: "Agency Contracts",
    columns: [
      { kind: "string", key: "clientId", size: 50, required: true },
      { kind: "string", key: "propertyId", size: 50, required: true },
      { kind: "string", key: "landlordName", size: 255, required: true },
      { kind: "string", key: "propertyAddress", size: 500, required: true },
      { kind: "float", key: "principalBrz", required: true },
      { kind: "float", key: "repaymentBrz", required: true },
      { kind: "integer", key: "rateBps", required: true },
      { kind: "integer", key: "durationDays", required: true },
      { kind: "integer", key: "installmentsTotal", required: true },
      { kind: "integer", key: "installmentsPaid", required: true, default: 0 },
      { kind: "enum", key: "status", elements: ["pending", "registered", "funded", "repaid", "defaulted"], required: true, default: "pending" },
      { kind: "boolean", key: "hasInsurance", required: true, default: false },
      { kind: "string", key: "insurer", size: 100, required: false },
      { kind: "string", key: "registerSig", size: 150, required: false },
      { kind: "string", key: "fundSig", size: 150, required: false },
      { kind: "integer", key: "registeredAt", required: true },
      { kind: "integer", key: "fundedAt", required: false },
    ],
    indexes: [
      { key: "client_idx", type: "key" as IndexType, attributes: ["clientId"] },
      { key: "property_idx", type: "key" as IndexType, attributes: ["propertyId"] },
      { key: "status_idx", type: "key" as IndexType, attributes: ["status"] },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function isNotFound(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: number; type?: string };
  return e.code === 404 || e.type === "database_not_found" || e.type === "table_not_found" || e.type === "collection_not_found";
}

async function ensureDatabase() {
  try {
    await tablesDB.get({ databaseId: DATABASE_ID });
    console.log(`✓ database '${DATABASE_ID}' already exists`);
  } catch (err) {
    if (!isNotFound(err)) throw err;
    await tablesDB.create({ databaseId: DATABASE_ID, name: "Brix Main" });
    console.log(`+ created database '${DATABASE_ID}'`);
  }
}

async function ensureColumn(tableId: string, col: ColumnDef) {
  // Each createXColumn returns/throws if exists. We try-catch on duplicate.
  try {
    const base = {
      databaseId: DATABASE_ID,
      tableId,
      key: col.key,
      required: col.required,
    };
    switch (col.kind) {
      case "string":
        await tablesDB.createStringColumn({
          ...base,
          size: col.size,
          ...(col.default !== undefined ? { default: col.default } : {}),
        });
        break;
      case "integer":
        await tablesDB.createIntegerColumn({
          ...base,
          ...(col.min !== undefined ? { min: col.min } : {}),
          ...(col.max !== undefined ? { max: col.max } : {}),
          ...(col.default !== undefined ? { default: col.default } : {}),
        });
        break;
      case "float":
        await tablesDB.createFloatColumn({
          ...base,
          ...(col.default !== undefined ? { default: col.default } : {}),
        });
        break;
      case "boolean":
        await tablesDB.createBooleanColumn({
          ...base,
          ...(col.default !== undefined ? { default: col.default } : {}),
        });
        break;
      case "enum":
        await tablesDB.createEnumColumn({
          ...base,
          elements: col.elements,
          ...(col.default !== undefined ? { default: col.default } : {}),
        });
        break;
    }
    console.log(`    + ${tableId}.${col.key} (${col.kind})`);
  } catch (err) {
    const e = err as { code?: number; type?: string; message?: string };
    if (e.code === 409 || e.type === "attribute_already_exists" || e.type === "column_already_exists") {
      console.log(`    · ${tableId}.${col.key} already exists`);
      return;
    }
    throw err;
  }
}

async function ensureIndex(tableId: string, idx: IndexDef) {
  try {
    // TablesDB renamed `attributes` → `columns` in the index creation API.
    await tablesDB.createIndex({
      databaseId: DATABASE_ID,
      tableId,
      key: idx.key,
      type: idx.type,
      columns: idx.attributes,
    } as Parameters<typeof tablesDB.createIndex>[0]);
    console.log(`    + ${tableId}.${idx.key} index (${idx.type} on ${idx.attributes.join(",")})`);
  } catch (err) {
    const e = err as { code?: number; type?: string };
    if (e.code === 409 || e.type === "index_already_exists") {
      console.log(`    · ${tableId}.${idx.key} index already exists`);
      return;
    }
    throw err;
  }
}

async function ensureTable(spec: TableSpec) {
  let tableExists = false;
  try {
    await tablesDB.getTable({ databaseId: DATABASE_ID, tableId: spec.id });
    tableExists = true;
    console.log(`✓ table '${spec.id}' already exists — checking columns/indexes`);
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }

  if (!tableExists) {
    await tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: spec.id,
      name: spec.name,
      permissions: PUBLIC_RW,
      rowSecurity: false,
    });
    console.log(`+ created table '${spec.id}'`);
  }

  for (const col of spec.columns) {
    await ensureColumn(spec.id, col);
  }

  // Appwrite needs columns to be available before index creation. New columns
  // process async — wait briefly to avoid "attribute not available" race.
  await new Promise((r) => setTimeout(r, 1500));

  for (const idx of spec.indexes) {
    await ensureIndex(spec.id, idx);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Bootstrap target: ${ENDPOINT}`);
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Database: ${DATABASE_ID}\n`);

  await ensureDatabase();
  console.log("");

  for (const spec of SPECS) {
    console.log(`── ${spec.id}`);
    await ensureTable(spec);
    console.log("");
  }

  console.log("✓ Bootstrap complete.\n");
  console.log("Next steps:");
  console.log(" 1. Confirm in console: https://cloud.appwrite.io/console/project-fra-" + PROJECT_ID);
  console.log(" 2. Migrate app/src/lib/agency-clients.ts to use the Appwrite SDK web client.");
}

main().catch((err: unknown) => {
  const e = err as { message?: string; response?: unknown; code?: number; type?: string };
  console.error("\n✗ Bootstrap failed.");
  console.error(`  message: ${e.message ?? String(err)}`);
  if (e.code) console.error(`  code:    ${e.code}`);
  if (e.type) console.error(`  type:    ${e.type}`);
  if (e.response) console.error(`  response: ${JSON.stringify(e.response, null, 2)}`);
  process.exit(1);
});
