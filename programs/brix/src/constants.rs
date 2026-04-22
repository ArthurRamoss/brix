use anchor_lang::prelude::*;

/// PDA seed for the singleton Vault account per admin.
/// Address = PDA([b"vault", admin.key()], program_id).
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

/// PDA seed for a Receivable account keyed by contract_id.
/// Address = PDA([b"receivable", contract_id], program_id).
pub const RECEIVABLE_SEED: &[u8] = b"receivable";

/// PDA seed for an InvestorPosition keyed by (vault, investor).
/// Address = PDA([b"position", vault.key(), investor.key()], program_id).
pub const POSITION_SEED: &[u8] = b"position";

/// Basis-points denominator. 10_000 bps = 100 %.
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Fixed width of the off-chain contract identifier we store on-chain.
/// Callers typically pass a 32-byte hash (e.g. SHA-256 of the legal contract PDF).
pub const CONTRACT_ID_LEN: usize = 32;
