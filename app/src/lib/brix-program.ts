import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { connection } from "./connection";
import IDL from "./brix-idl.json";

const PROGRAM_ID_DEFAULT = "6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94";
// Mainnet BRZ mint — fallback "compila" só pra não quebrar build/SSR.
// Demo real PRECISA de NEXT_PUBLIC_BRZ_MINT apontando pro devnet test mint
// criado pelo scripts/seed-demo.ts.
const BRZ_MINT_DEFAULT = "FtgGSFADXBtroxq8VCausXRr2of47QBf5AS1NtZCu4GD";

function parsePubkey(
  raw: string | undefined,
  fallback: string,
  label: string,
): PublicKey {
  const value = (raw ?? "").trim();
  const isPlaceholder =
    !value ||
    value.includes("replace_") ||
    value.includes("your_") ||
    value.includes("${");
  if (isPlaceholder) return new PublicKey(fallback);
  try {
    return new PublicKey(value);
  } catch {
    if (typeof window !== "undefined") {
      console.warn(
        `[brix-program] ${label} não é base58 válido ("${value}"). Usando fallback ${fallback}. Ajuste o .env.local pra silenciar.`,
      );
    }
    return new PublicKey(fallback);
  }
}

export const PROGRAM_ID = parsePubkey(
  process.env.NEXT_PUBLIC_BRIX_PROGRAM_ID,
  PROGRAM_ID_DEFAULT,
  "NEXT_PUBLIC_BRIX_PROGRAM_ID",
);

export const BRZ_MINT = parsePubkey(
  process.env.NEXT_PUBLIC_BRZ_MINT,
  BRZ_MINT_DEFAULT,
  "NEXT_PUBLIC_BRZ_MINT",
);

// O "admin" do vault em devnet é a wallet do Arthur (EFQuU2...).
// No MVP, o vault PDA é derivado dessa chave.
export const VAULT_ADMIN = new PublicKey(
  "EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs",
);

// Interface mínima de wallet que o Anchor Provider precisa.
// Privy nos dá um objeto parecido mas não idêntico — adaptamos aqui.
export interface AnchorWalletAdapter {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]>;
}

// Retorna o Program<Brix> tipado pelo IDL.
// Analogia: é como criar uma instância do seu ORM/SDK apontando pro endpoint certo.
export function getBrixProgram(wallet: AnchorWalletAdapter) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  // No Anchor 0.30+ com o novo formato de IDL, o Program ID é lido
  // diretamente do campo "address" no brix-idl.json — não precisa passar separado.
  return new Program(IDL as Idl, provider);
}

// Deriva o PDA do vault a partir do admin.
// PDA = endereço determinístico sem private key. Analogia:
// é como PRIMARY KEY calculada: hash("vault" + admin_pubkey) = sempre o mesmo endereço.
export function deriveVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), VAULT_ADMIN.toBuffer()],
    PROGRAM_ID,
  );
}
