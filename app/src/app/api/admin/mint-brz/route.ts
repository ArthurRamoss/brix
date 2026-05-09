// /api/admin/mint-brz
//
// Devnet test-BRZ faucet. Mints BRZ from the test mint to a recipient's
// associated token account. Server-side because the mint authority keypair
// (= the brix admin keypair) sits on disk; we don't ship it to the browser.
//
// POST body: { recipient: string (base58 pubkey), amount?: number (BRZ, default 50000) }
//
// Gating: this route is intentionally devnet-only. It refuses to run if:
//   - NODE_ENV === "production" (defense in depth — won't accidentally
//     ship to a hosted env that has prod state)
//   - The configured RPC isn't pointed at devnet
// Even with those, the mint is a TEST mint with no value, so the worst case
// of accidental exposure is "user has free play money on devnet" — fine.
//
// In real production BRZ is minted by Transfero (the issuer). We don't have
// authority. This whole file gets deleted before any non-devnet deploy.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";
import { badRequest, json, serverError } from "../../../../lib/server/appwrite";

const VAULT_ADMIN = "EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs";
const RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const BRZ_MINT_STR =
  process.env.NEXT_PUBLIC_BRZ_MINT ??
  "12fpfju1pfJEVkNqiucWqiUpmZzCjPgDCARRFvK2M6A7";
const DEFAULT_AMOUNT_BRZ = 50_000;
const MAX_AMOUNT_BRZ = 1_000_000;
const BRZ_DECIMALS = 6;

function loadAdminKeypair(): Keypair {
  const inputPath =
    process.env.BRIX_ADMIN_KEYPAIR ??
    process.env.ANCHOR_WALLET ??
    path.join(os.homedir(), ".config", "solana", "id.json");
  const expanded = inputPath.startsWith("~/")
    ? path.join(os.homedir(), inputPath.slice(2))
    : inputPath;
  const raw = fs.readFileSync(expanded, "utf8");
  const parsed = JSON.parse(raw) as number[] | { secretKey?: number[] };
  const secret = Array.isArray(parsed) ? parsed : parsed.secretKey;
  if (!secret) throw new Error(`Bad keypair file: ${expanded}`);
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

export async function POST(req: Request) {
  // Only safety gate that matters: refuse if the RPC isn't devnet. The
  // admin keypair is the test mint authority on devnet only — on mainnet,
  // BRZ is minted by Transfero and any signature attempt with our key
  // would be rejected by the SPL Token program anyway. Belt-and-
  // suspenders: this check catches misconfig before we even sign.
  // (Previous NODE_ENV guard was over-conservative — it broke the demo
  // running on Appwrite Sites where NODE_ENV=production but the RPC is
  // still devnet. Removed.)
  if (!RPC.includes("devnet")) {
    return badRequest("test-BRZ faucet only works against devnet RPCs");
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("invalid JSON body");
  }

  const recipientStr = String(body.recipient ?? "").trim();
  const amountBrz = Math.min(
    MAX_AMOUNT_BRZ,
    Math.max(0, Number(body.amount ?? DEFAULT_AMOUNT_BRZ)),
  );
  if (!recipientStr) return badRequest("recipient required");
  if (amountBrz <= 0) return badRequest("amount must be > 0");

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientStr);
  } catch {
    return badRequest("recipient is not a valid base58 pubkey");
  }

  let admin: Keypair;
  try {
    admin = loadAdminKeypair();
  } catch (err) {
    return serverError(
      err instanceof Error
        ? `${err.message} (set BRIX_ADMIN_KEYPAIR env var if the keypair is elsewhere)`
        : err,
    );
  }
  if (admin.publicKey.toBase58() !== VAULT_ADMIN) {
    return serverError(
      `loaded keypair ${admin.publicKey.toBase58()} doesn't match expected admin ${VAULT_ADMIN}`,
    );
  }

  const mint = new PublicKey(BRZ_MINT_STR);
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient);
  const amountLamports = BigInt(Math.floor(amountBrz * 10 ** BRZ_DECIMALS));

  const connection = new Connection(RPC, "confirmed");

  // Build the tx: create the recipient ATA if missing, then mint.
  // Using the idempotent variant means we don't need to query first.
  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      admin.publicKey, // payer
      recipientAta,
      recipient,
      mint,
    ),
  );
  tx.add(
    createMintToInstruction(
      mint,
      recipientAta,
      admin.publicKey, // mint authority
      amountLamports,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  try {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = admin.publicKey;
    tx.sign(admin);
    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    return json({
      ok: true,
      signature: sig,
      recipient: recipientStr,
      ata: recipientAta.toBase58(),
      amountBrz,
      explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    });
  } catch (err) {
    return serverError(err);
  }
}
