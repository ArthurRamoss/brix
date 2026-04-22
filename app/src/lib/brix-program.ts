import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { connection } from "./connection";
import IDL from "./brix-idl.json";

// O Program ID vem do .env.local.
// Analogia: é o "endereço do servidor" — qual contrato queremos chamar.
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_BRIX_PROGRAM_ID ||
    "6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94",
);

// BRZ mint em devnet (você mesmo vai criar com seed-demo.ts no CP3).
// Por enquanto, lê do .env.local. Se não tiver, usa placeholder.
export const BRZ_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_BRZ_MINT ||
    "FtgGSFADXBtroxq8VCausXRr2of47QBf5AS1NtZCu4GD", // mainnet mint — substitua pela devnet test mint
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
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(IDL as any, provider);
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
