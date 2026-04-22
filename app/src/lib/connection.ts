import { Connection } from "@solana/web3.js";

// Lê a URL do RPC do .env.local.
// Fallback pra devnet público se a env não estiver configurada.
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Singleton: uma Connection por tab do browser (não criar uma nova a cada render).
// Analogia web2: é como um pool de conexões com o banco — você cria uma vez e reutiliza.
export const connection = new Connection(RPC_URL, "confirmed");
