// Single source of truth for Brix protocol economics. Both the agency
// (when pricing a receivable) and the investor (when reading the vault APR)
// reference these constants so the math is consistent across views.
//
// Eventually this fee moves on-chain as `vault.protocolFeeBps` and gets
// split inside the `repay` instruction. Until then, it's an off-chain
// display constant.

/** Brix protocol fee in basis points. 200 bps = 2% per year. */
export const BRIX_PROTOCOL_FEE_BPS = 200;

/** Helper: same fee in percent (used in UIs that talk in %). */
export const BRIX_PROTOCOL_FEE_PCT = BRIX_PROTOCOL_FEE_BPS / 100;
