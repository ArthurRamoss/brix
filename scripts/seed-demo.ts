import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  AnchorProvider,
  BN,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const DEFAULT_PROGRAM_ID = "6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94";
const VAULT_ADMIN = new PublicKey(
  "EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs",
);
const BRZ_DECIMALS = 6;
const BRZ_UNIT = 1_000_000n;
const DEMO_BALANCE_TARGET = 100_000n * BRZ_UNIT;

type CliArgs = {
  demoWallet?: string;
  adminKeypair?: string;
  mint?: string;
  rpcUrl?: string;
  programId?: string;
  skipAirdrop: boolean;
};

type RawVault = {
  admin: PublicKey;
  brzMint: PublicKey;
  vaultAta: PublicKey;
};

type VaultAccountClient = {
  fetch(address: PublicKey): Promise<RawVault>;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { skipAirdrop: false };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    const next = argv[i + 1];
    if (current === "--demo-wallet" && next) {
      args.demoWallet = next;
      i += 1;
    } else if (current === "--admin-keypair" && next) {
      args.adminKeypair = next;
      i += 1;
    } else if (current === "--mint" && next) {
      args.mint = next;
      i += 1;
    } else if (current === "--rpc" && next) {
      args.rpcUrl = next;
      i += 1;
    } else if (current === "--program-id" && next) {
      args.programId = next;
      i += 1;
    } else if (current === "--skip-airdrop") {
      args.skipAirdrop = true;
    } else if (current === "-h" || current === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${current}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  pnpm demo:seed -- --demo-wallet <PUBKEY>

Options:
  --demo-wallet <PUBKEY>     Wallet that will receive fake BRZ on devnet.
  --admin-keypair <PATH>     Admin keypair. Defaults to BRIX_ADMIN_KEYPAIR,
                             ANCHOR_WALLET, or ~/.config/solana/id.json.
  --mint <PUBKEY>            Existing devnet BRZ test mint. If omitted, the
                             script uses NEXT_PUBLIC_BRZ_MINT or creates one.
  --rpc <URL>                Devnet RPC URL. Defaults to NEXT_PUBLIC_SOLANA_RPC_URL
                             or https://api.devnet.solana.com.
  --program-id <PUBKEY>      Brix program ID. Defaults to NEXT_PUBLIC_BRIX_PROGRAM_ID.
  --skip-airdrop             Do not request devnet SOL for the admin wallet.
`);
}

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

  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === "string") merged[key] = expandEnv(value, merged);
  }
  return merged;
}

function expandEnv(value: string, env: Record<string, string | undefined>) {
  return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, key: string) => {
    return env[key] ?? "";
  });
}

function isPlaceholder(value: string | undefined) {
  if (!value) return true;
  return (
    value.includes("replace_") ||
    value.includes("${") ||
    value.includes("your_key") ||
    value.includes("your_app_id")
  );
}

function optionalPubkey(value: string | undefined): PublicKey | null {
  if (isPlaceholder(value)) return null;
  try {
    return value ? new PublicKey(value) : null;
  } catch {
    return null;
  }
}

function expandHome(inputPath: string) {
  if (inputPath === "~") return os.homedir();
  if (inputPath.startsWith("~/") || inputPath.startsWith("~\\")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

function loadKeypair(inputPath: string): Keypair {
  const resolved = path.resolve(expandHome(inputPath));
  if (!fs.existsSync(resolved)) {
    throw new Error(`Admin keypair not found: ${resolved}`);
  }

  const parsed = JSON.parse(fs.readFileSync(resolved, "utf8")) as
    | number[]
    | { secretKey?: number[] };
  const secret = Array.isArray(parsed) ? parsed : parsed.secretKey;
  if (!secret || !Array.isArray(secret)) {
    throw new Error(`Invalid keypair JSON: ${resolved}`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function maybeAirdrop(connection: Connection, admin: PublicKey) {
  const balance = await connection.getBalance(admin, "confirmed");
  if (balance >= 0.2 * LAMPORTS_PER_SOL) return;

  console.log("Admin SOL balance is low; requesting a devnet airdrop...");
  try {
    const signature = await connection.requestAirdrop(admin, LAMPORTS_PER_SOL);
    const latest = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction(
      { signature, ...latest },
      "confirmed",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Airdrop failed; continuing anyway: ${message}`);
  }
}

function deriveVaultPda(programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), VAULT_ADMIN.toBuffer()],
    programId,
  );
}

async function createProgram(
  connection: Connection,
  admin: Keypair,
  programId: PublicKey,
) {
  const idlPath = path.join(process.cwd(), "app", "src", "lib", "brix-idl.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as Idl & {
    address?: string;
  };
  idl.address = programId.toBase58();

  const provider = new AnchorProvider(connection, new Wallet(admin), {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  return new Program(idl, provider);
}

function vaultAccount(program: Program<Idl>) {
  return (program.account as unknown as { vault: VaultAccountClient }).vault;
}

async function ensureMint(
  connection: Connection,
  admin: Keypair,
  configuredMint: PublicKey | null,
) {
  if (!configuredMint) {
    const created = await createMint(
      connection,
      admin,
      admin.publicKey,
      null,
      BRZ_DECIMALS,
    );
    console.log(`Created devnet BRZ test mint: ${created.toBase58()}`);
    return { mint: created, created: true };
  }

  const info = await getMint(connection, configuredMint, "confirmed");
  if (info.decimals !== BRZ_DECIMALS) {
    throw new Error(
      `Configured mint has ${info.decimals} decimals; Brix demo expects ${BRZ_DECIMALS}.`,
    );
  }
  if (!info.mintAuthority?.equals(admin.publicKey)) {
    throw new Error(
      "Configured mint is not controlled by the admin keypair, so the script cannot mint fake BRZ.",
    );
  }
  return { mint: configuredMint, created: false };
}

async function ensureVault(
  program: Program<Idl>,
  programId: PublicKey,
  mint: PublicKey,
  admin: Keypair,
) {
  const [vaultPda] = deriveVaultPda(programId);
  const vaultAta = getAssociatedTokenAddressSync(mint, vaultPda, true);

  try {
    const existing = await vaultAccount(program).fetch(vaultPda);
    if (!new PublicKey(existing.admin).equals(admin.publicKey)) {
      throw new Error("Vault exists but is owned by a different admin.");
    }
    if (!new PublicKey(existing.brzMint).equals(mint)) {
      throw new Error(
        `Vault exists for mint ${existing.brzMint.toBase58()}, not ${mint.toBase58()}.`,
      );
    }
    return { vaultPda, vaultAta: new PublicKey(existing.vaultAta), created: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      !message.includes("Account does not exist") &&
      !message.includes("could not find account") &&
      !message.includes("AccountNotFound")
    ) {
      throw err;
    }
  }

  const signature = await program.methods
    .initializeVault()
    .accounts({
      admin: admin.publicKey,
      vault: vaultPda,
      brzMint: mint,
      vaultAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log(`Initialized vault: ${explorerTx(signature)}`);
  return { vaultPda, vaultAta, created: true };
}

// Bootstrap liquidity: admin deposits BRZ into the vault so subsequent
// fund_landlord calls have something to release. Without this, the first
// agency advance fails with InsufficientLiquidity (vault ATA == 0).
//
// Why the admin? It's the only keypair we have control of in this script.
// Conceptually it acts as a "synthetic LP" until a real investor deposits.
// The admin gets shares it never withdraws — fine for MVP demo.
//
// Idempotent: skips if the admin already has a Position account with shares.
const BOOTSTRAP_LIQUIDITY_AMOUNT = 50_000n * BRZ_UNIT;
const POSITION_SEED = Buffer.from("position");

async function ensureBootstrapLiquidity(
  connection: Connection,
  admin: Keypair,
  program: Program<Idl>,
  programId: PublicKey,
  mint: PublicKey,
  vaultPda: PublicKey,
) {
  const [positionPda] = PublicKey.findProgramAddressSync(
    [POSITION_SEED, vaultPda.toBuffer(), admin.publicKey.toBuffer()],
    programId,
  );

  // If admin's position already exists, the vault has been bootstrapped.
  try {
    const positionAccount = (
      program.account as unknown as {
        investorPosition: {
          fetch(address: PublicKey): Promise<{ shares: BN }>;
        };
      }
    ).investorPosition;
    const existing = await positionAccount.fetch(positionPda);
    if (existing.shares && existing.shares.toString() !== "0") {
      console.log(
        `Bootstrap liquidity already in place (admin position has ${existing.shares.toString()} shares); skipping`,
      );
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      !message.includes("Account does not exist") &&
      !message.includes("could not find account") &&
      !message.includes("AccountNotFound")
    ) {
      throw err;
    }
  }

  // Mint BRZ to admin's ATA so it has something to deposit.
  const adminAta = await getOrCreateAssociatedTokenAccount(
    connection,
    admin,
    mint,
    admin.publicKey,
    false,
    "confirmed",
  );
  const account = await getAccount(connection, adminAta.address, "confirmed");
  if (account.amount < BOOTSTRAP_LIQUIDITY_AMOUNT) {
    const delta = BOOTSTRAP_LIQUIDITY_AMOUNT - account.amount;
    await mintTo(
      connection,
      admin,
      mint,
      adminAta.address,
      admin,
      delta,
      [],
      { commitment: "confirmed" },
    );
  }

  // Deposit into the vault.
  const vaultAta = getAssociatedTokenAddressSync(mint, vaultPda, true);
  const sig = await program.methods
    .deposit(new BN(BOOTSTRAP_LIQUIDITY_AMOUNT.toString()))
    .accounts({
      investor: admin.publicKey,
      vault: vaultPda,
      brzMint: mint,
      vaultAta,
      investorBrzAta: adminAta.address,
      position: positionPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log(
    `Bootstrap liquidity: ${formatBrz(BOOTSTRAP_LIQUIDITY_AMOUNT)} → vault: ${explorerTx(sig)}`,
  );
}

async function ensureDemoBalance(
  connection: Connection,
  admin: Keypair,
  mint: PublicKey,
  demoWallet: PublicKey,
) {
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    admin,
    mint,
    demoWallet,
    false,
    "confirmed",
  );

  const account = await getAccount(connection, ata.address, "confirmed");
  const current = account.amount;
  if (current >= DEMO_BALANCE_TARGET) {
    return { ata: ata.address, minted: 0n, balance: current };
  }

  const delta = DEMO_BALANCE_TARGET - current;
  const signature = await mintTo(
    connection,
    admin,
    mint,
    ata.address,
    admin,
    delta,
    [],
    { commitment: "confirmed" },
  );

  console.log(`Minted demo BRZ: ${explorerTx(signature)}`);
  return { ata: ata.address, minted: delta, balance: DEMO_BALANCE_TARGET };
}

function explorerTx(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

function formatBrz(amount: bigint) {
  return `${Number(amount / BRZ_UNIT).toLocaleString("en-US")} BRZ`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnv();

  const rpcUrl =
    args.rpcUrl ??
    (isPlaceholder(env.NEXT_PUBLIC_SOLANA_RPC_URL)
      ? DEFAULT_RPC_URL
      : env.NEXT_PUBLIC_SOLANA_RPC_URL) ??
    DEFAULT_RPC_URL;
  const programId =
    optionalPubkey(args.programId) ??
    optionalPubkey(env.NEXT_PUBLIC_BRIX_PROGRAM_ID) ??
    new PublicKey(DEFAULT_PROGRAM_ID);
  const demoWallet =
    optionalPubkey(args.demoWallet) ?? optionalPubkey(env.DEMO_WALLET);

  if (!demoWallet) {
    throw new Error(
      "Missing demo wallet. Pass --demo-wallet <PUBKEY> or set DEMO_WALLET.",
    );
  }

  const adminPath =
    args.adminKeypair ??
    env.BRIX_ADMIN_KEYPAIR ??
    env.ANCHOR_WALLET ??
    "~/.config/solana/id.json";
  const admin = loadKeypair(adminPath);
  if (!admin.publicKey.equals(VAULT_ADMIN)) {
    throw new Error(
      `BRIX_ADMIN_KEYPAIR must be ${VAULT_ADMIN.toBase58()}, got ${admin.publicKey.toBase58()}.`,
    );
  }

  const connection = new Connection(rpcUrl, "confirmed");
  if (!args.skipAirdrop) await maybeAirdrop(connection, admin.publicKey);

  const configuredMint =
    optionalPubkey(args.mint) ?? optionalPubkey(env.NEXT_PUBLIC_BRZ_MINT);
  const { mint, created: mintCreated } = await ensureMint(
    connection,
    admin,
    configuredMint,
  );
  const program = await createProgram(connection, admin, programId);
  const vault = await ensureVault(program, programId, mint, admin);
  // NOTE: ensureBootstrapLiquidity is defined above but NOT called here.
  // For the demo we want a real investor flow (separate Privy email logs in
  // as `invest`, deposits BRZ via /invest UI). The bootstrap path remains
  // available if a future script needs synthetic liquidity.
  const demo = await ensureDemoBalance(connection, admin, mint, demoWallet);

  const summary = {
    cluster: "devnet",
    rpcUrl,
    programId: programId.toBase58(),
    admin: admin.publicKey.toBase58(),
    brzMint: mint.toBase58(),
    brzMintCreated: mintCreated,
    vault: vault.vaultPda.toBase58(),
    vaultAta: vault.vaultAta.toBase58(),
    vaultCreated: vault.created,
    demoWallet: demoWallet.toBase58(),
    demoWalletAta: demo.ata.toBase58(),
    demoBalance: formatBrz(demo.balance),
    mintedThisRun: formatBrz(demo.minted),
    nextPublicEnv: {
      NEXT_PUBLIC_SOLANA_RPC_URL: rpcUrl,
      NEXT_PUBLIC_BRIX_PROGRAM_ID: programId.toBase58(),
      NEXT_PUBLIC_BRZ_MINT: mint.toBase58(),
    },
    updatedAt: new Date().toISOString(),
  };

  const statePath = path.join(process.cwd(), "scripts", "demo-state.json");
  fs.writeFileSync(statePath, `${JSON.stringify(summary, null, 2)}\n`);

  console.log("\nCP3 demo seed complete:");
  console.log(JSON.stringify(summary, null, 2));
  if (mintCreated) {
    console.log(
      "\nUpdate .env.local and Vercel with NEXT_PUBLIC_BRZ_MINT before recording the demo.",
    );
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`seed-demo failed: ${message}`);
  process.exit(1);
});
