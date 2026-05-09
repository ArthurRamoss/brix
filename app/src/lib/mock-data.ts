// Display utilities used across the app. The proto/mock arrays that used to
// live here (MOCK_RECEIVABLES, RECEIVABLES, INVESTORS, TVL_SERIES) were
// removed when the app moved to real Appwrite + on-chain data sources.
// Only formatting helpers + a contract-id encoder remain.

// Converts a slug like "BRX-2026-0001" or any string into a [u8; 32] byte
// array suitable for the `register_receivable` instruction. Pads with zeros.
export function contractIdBytes(id: string): number[] {
  const bytes = new TextEncoder().encode(id);
  const result = new Uint8Array(32);
  result.set(bytes.slice(0, 32));
  return Array.from(result);
}

// Annual rate in human-readable percentage from basis points.
export function formatRate(rateBps: number): string {
  return `${(rateBps / 100).toFixed(0)}% a.a.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────────────────────────────────────

export function fmtBRZ(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "BRZ 0";
  return "BRZ " + Math.round(n).toLocaleString("pt-BR");
}

export function fmtBRZShort(n: number): string {
  if (n >= 1_000_000)
    return "BRZ " + (n / 1_000_000).toFixed(2).replace(".", ",") + "M";
  if (n >= 1_000) return "BRZ " + (n / 1_000).toFixed(1).replace(".", ",") + "k";
  return fmtBRZ(n);
}

export function fmtPct(n: number): string {
  return (n * 100).toFixed(1).replace(".", ",") + "%";
}

export function shortAddr(a: string | null | undefined): string {
  return a ? a.slice(0, 4) + "…" + a.slice(-4) : "";
}
