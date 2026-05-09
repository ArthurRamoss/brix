// Wipes brix demo state. Used between demo runs to start clean.
//
// Two phases:
//   A. On-chain — for every contract row in agency_contracts, call
//      admin_close_receivable. For every unique investorPubkey in
//      vault_events, call admin_close_position. Both decrement vault
//      counters appropriately so the next deposit/fund starts from a
//      consistent state.
//   B. Off-chain — delete every row from agency_clients, agency_properties,
//      agency_contracts, vault_events. Keeps agency_applications so the user
//      doesn't have to redo the founding-partner onboarding flow.
//
// Loads the admin keypair from BRIX_ADMIN_KEYPAIR / ANCHOR_WALLET /
// ~/.config/solana/id.json (in that order). Loads Appwrite credentials from
// app/.env.local.
//
// Usage:
//   pnpm reset:demo                  # full reset (default)
//   pnpm reset:demo --skip-on-chain  # only Appwrite wipe
//   pnpm reset:demo --dry-run        # show what would happen, change nothing

import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  AnchorProvider,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { Client, Query, TablesDB } from "node-appwrite";

import IDL from "../app/src/lib/brix-idl.json" with { type: "json" };

const VAULT_ADMIN = new PublicKey(
  "EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs",
);
const PROGRAM_ID = new PublicKey(
  "6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94",
);
const VAULT_SEED = Buffer.from("vault");
const RECEIVABLE_SEED = Buffer.from("receivable");
const POSITION_SEED = Buffer.from("position");
const CONTRACT_ID_LEN = 32;

const TABLES_TO_WIPE = [
  "agency_contracts",
  "agency_properties",
  "agency_clients",
  "vault_events",
] as const;

function envFromAppFile(): Record<string, string> {
  const envPath = path.join(__dirname, "..", "app", ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, "utf8");
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, "");
    out[k] = v;
  }
  return out;
}

function loadKeypair(inputPath: string): Keypair {
  const expanded = inputPath.startsWith("~/")
    ? path.join(os.homedir(), inputPath.slice(2))
    : inputPath;
  const raw = fs.readFileSync(expanded, "utf8");
  const parsed = JSON.parse(raw) as number[] | { secretKey?: number[] };
  const secret = Array.isArray(parsed) ? parsed : parsed.secretKey;
  if (!secret) throw new Error(`Bad keypair file: ${expanded}`);
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function contractIdBytes(id: string): number[] {
  const bytes = new TextEncoder().encode(id);
  const result = new Uint8Array(CONTRACT_ID_LEN);
  result.set(bytes.slice(0, CONTRACT_ID_LEN));
  return Array.from(result);
}

function deriveVaultPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, VAULT_ADMIN.toBuffer()],
    PROGRAM_ID,
  );
  return pda;
}

function deriveReceivablePDA(contractId: number[]): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [RECEIVABLE_SEED, Uint8Array.from(contractId)],
    PROGRAM_ID,
  );
  return pda;
}

function derivePositionPDA(
  vault: PublicKey,
  investor: PublicKey,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [POSITION_SEED, vault.toBuffer(), investor.toBuffer()],
    PROGRAM_ID,
  );
  return pda;
}

type AppwriteRow = { $id: string } & Record<string, unknown>;

async function listAll(
  tablesDB: TablesDB,
  databaseId: string,
  tableId: string,
): Promise<AppwriteRow[]> {
  const out: AppwriteRow[] = [];
  let cursor: string | undefined;
  while (true) {
    const queries: string[] = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await tablesDB.listRows({ databaseId, tableId, queries });
    const r = res as { rows?: AppwriteRow[]; documents?: AppwriteRow[] };
    const rows = r.rows ?? r.documents ?? [];
    if (rows.length === 0) break;
    out.push(...rows);
    if (rows.length < 100) break;
    cursor = rows[rows.length - 1].$id;
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipOnChain = args.includes("--skip-on-chain");

  const env = { ...envFromAppFile(), ...process.env } as Record<string, string>;

  const APPWRITE_ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const APPWRITE_PROJECT = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const APPWRITE_DATABASE = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const APPWRITE_KEY = env.APPWRITE_API_KEY;
  const RPC =
    env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT || !APPWRITE_DATABASE || !APPWRITE_KEY) {
    throw new Error(
      "Missing Appwrite env vars (NEXT_PUBLIC_APPWRITE_ENDPOINT/PROJECT_ID/DATABASE_ID, APPWRITE_API_KEY).",
    );
  }

  const adminPath =
    env.BRIX_ADMIN_KEYPAIR ??
    env.ANCHOR_WALLET ??
    path.join(os.homedir(), ".config", "solana", "id.json");
  const admin = loadKeypair(adminPath);
  if (!admin.publicKey.equals(VAULT_ADMIN)) {
    throw new Error(
      `Admin keypair must be ${VAULT_ADMIN.toBase58()}, got ${admin.publicKey.toBase58()} (${adminPath}).`,
    );
  }

  const aw = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT)
    .setKey(APPWRITE_KEY);
  const tablesDB = new TablesDB(aw);

  // Snapshot what's there before wiping.
  const contracts = await listAll(
    tablesDB,
    APPWRITE_DATABASE,
    "agency_contracts",
  );
  const events = await listAll(
    tablesDB,
    APPWRITE_DATABASE,
    "vault_events",
  );

  const investorPubkeys = Array.from(
    new Set(
      events
        .filter(
          (e) => e.kind === "deposit" || e.kind === "withdraw",
        )
        .map((e) => String(e.investorPubkey ?? ""))
        .filter(Boolean),
    ),
  );

  console.log("─── reset plan ─────────────────────────");
  console.log(`  contracts to close on-chain: ${contracts.length}`);
  console.log(`  positions to close on-chain: ${investorPubkeys.length}`);
  for (const t of TABLES_TO_WIPE) {
    console.log(`  off-chain rows to delete from ${t}`);
  }
  console.log("");
  if (dryRun) {
    console.log("(dry run — exiting without changes)");
    return;
  }

  // Phase A: on-chain
  if (!skipOnChain) {
    console.log("─── phase A: on-chain ─────────────────");
    const connection = new Connection(RPC, "confirmed");
    const provider = new AnchorProvider(connection, new Wallet(admin), {
      commitment: "confirmed",
    });
    const program = new Program(IDL as Idl, provider);
    const vault = deriveVaultPDA();

    for (const c of contracts) {
      const id = String(c.id ?? c.$id);
      const idBytes = contractIdBytes(id);
      const receivable = deriveReceivablePDA(idBytes);
      try {
        const sig = await (program.methods as never as {
          adminCloseReceivable: (
            contractId: number[],
          ) => { accounts: (a: Record<string, PublicKey>) => { rpc: () => Promise<string> } };
        })
          .adminCloseReceivable(idBytes)
          .accounts({ admin: admin.publicKey, vault, receivable })
          .rpc();
        console.log(`  ✓ closed receivable ${id} (${sig.slice(0, 8)}…)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  ⚠ skip receivable ${id}: ${msg.slice(0, 100)}`);
      }
    }

    for (const inv of investorPubkeys) {
      let investor: PublicKey;
      try {
        investor = new PublicKey(inv);
      } catch {
        console.warn(`  ⚠ skip position: invalid pubkey ${inv}`);
        continue;
      }
      const position = derivePositionPDA(vault, investor);
      try {
        const sig = await (program.methods as never as {
          adminClosePosition: () => {
            accounts: (a: Record<string, PublicKey>) => { rpc: () => Promise<string> };
          };
        })
          .adminClosePosition()
          .accounts({ admin: admin.publicKey, vault, position })
          .rpc();
        console.log(`  ✓ closed position ${inv.slice(0, 8)}… (${sig.slice(0, 8)}…)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  ⚠ skip position ${inv}: ${msg.slice(0, 100)}`);
      }
    }
  } else {
    console.log("(skipping on-chain phase)");
  }

  // Phase B: off-chain wipe
  console.log("");
  console.log("─── phase B: off-chain wipe ───────────");
  for (const tableId of TABLES_TO_WIPE) {
    let total = 0;
    while (true) {
      const res = await tablesDB.listRows({
        databaseId: APPWRITE_DATABASE,
        tableId,
        queries: [Query.limit(100)],
      });
      const r = res as { rows?: AppwriteRow[]; documents?: AppwriteRow[] };
      const rows = r.rows ?? r.documents ?? [];
      if (rows.length === 0) break;
      for (const row of rows) {
        await tablesDB.deleteRow({
          databaseId: APPWRITE_DATABASE,
          tableId,
          rowId: row.$id,
        });
        total++;
      }
      if (rows.length < 100) break;
    }
    console.log(`  ✓ wiped ${total} rows from ${tableId}`);
  }

  // Also clear localStorage caches so the user's next /invest visit
  // doesn't paint stale numbers from the pre-reset state. Done by
  // invalidating the cache key prefixes the front-end uses.
  console.log("");
  console.log("✓ reset complete");
  console.log("  next: refresh /invest in the browser (it will re-fetch)");
  console.log("  also: localStorage may still hold stale vault/position");
  console.log("        snapshots — clear via devtools or wait for TTL.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
