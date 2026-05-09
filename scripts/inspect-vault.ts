// One-shot inspector — prints the live vault state so we can see exactly
// what's left after a reset. Throwaway debug tool.

import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, type Idl } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import IDL from "../app/src/lib/brix-idl.json" with { type: "json" };

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const VAULT_ADMIN = new PublicKey("EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs");
const PROGRAM_ID = new PublicKey("6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94");

const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), VAULT_ADMIN.toBuffer()],
  PROGRAM_ID,
);

async function main() {
  const conn = new Connection(RPC, "confirmed");
  const provider = new AnchorProvider(conn, new Wallet(Keypair.generate()), {
    commitment: "confirmed",
  });
  const program = new Program(IDL as Idl, provider);

  const vault = await (program.account as never as {
    vault: { fetch(p: PublicKey): Promise<{
      vaultAta: PublicKey;
      totalShares: { toString(): string };
      totalDeployed: { toString(): string };
      totalDeposits: { toString(): string };
      totalRepaid: { toString(): string };
    }> };
  }).vault.fetch(vaultPDA);

  const ataInfo = await conn.getTokenAccountBalance(vault.vaultAta);
  const ataBrz = Number(ataInfo.value.amount) / 1_000_000;
  const totalDeployedBrz = Number(BigInt(vault.totalDeployed.toString())) / 1_000_000;
  const totalAssetsBrz = ataBrz + totalDeployedBrz;
  const totalShares = vault.totalShares.toString();

  console.log("vault PDA:        ", vaultPDA.toBase58());
  console.log("vault ATA:        ", vault.vaultAta.toBase58());
  console.log("");
  console.log("ata balance:      ", ataBrz.toFixed(2), "BRZ");
  console.log("total deployed:   ", totalDeployedBrz.toFixed(2), "BRZ");
  console.log("total assets:     ", totalAssetsBrz.toFixed(2), "BRZ  (ata + deployed)");
  console.log("total shares:     ", totalShares);
  console.log("total deposits:   ", (Number(BigInt(vault.totalDeposits.toString())) / 1_000_000).toFixed(2), "BRZ (cumulative)");
  console.log("total repaid:     ", (Number(BigInt(vault.totalRepaid.toString())) / 1_000_000).toFixed(2), "BRZ (cumulative)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
