use anchor_lang::prelude::*;

use crate::constants::CONTRACT_ID_LEN;

/// Singleton vault per admin. Custodies BRZ on behalf of investors and lends it
/// out against registered rental receivables.
///
/// PDA seeds: [b"vault", admin.key()]
#[account]
#[derive(InitSpace)]
pub struct Vault {
    /// Authority that initialized the vault and can pause/unpause it.
    pub admin: Pubkey,

    /// SPL mint of the stablecoin the vault accepts (BRZ on mainnet,
    /// test mint on devnet/localnet).
    pub brz_mint: Pubkey,

    /// Associated token account owned by this PDA. Holds all idle BRZ
    /// (total_assets = vault_ata.amount + total_deployed).
    pub vault_ata: Pubkey,

    /// Total LP-like shares outstanding across all InvestorPositions.
    /// Denominates pro-rata ownership of total_assets.
    pub total_shares: u64,

    /// BRZ currently lent out (sum of principal for all Receivables in
    /// `Funded` status). Returns to the ATA on repay.
    pub total_deployed: u64,

    /// Cumulative principal ever deposited by investors. Informational;
    /// not used in math.
    pub total_deposits: u64,

    /// Cumulative BRZ returned via repay (principal + interest).
    /// Informational.
    pub total_repaid: u64,

    /// When true, `deposit` and `fund_landlord` are blocked.
    /// `withdraw` and `repay` remain open so users can always exit.
    pub paused: bool,

    /// Canonical bump for the vault PDA. Stored so we don't re-derive each ix.
    pub bump: u8,
}

/// A single rental receivable registered by an agency on behalf of a landlord.
/// The `repayment` value is fixed at registration and is the binding amount
/// the tenant must ultimately pay back.
///
/// PDA seeds: [b"receivable", contract_id]
#[account]
#[derive(InitSpace)]
pub struct Receivable {
    /// Parent vault that will fund this receivable.
    pub vault: Pubkey,

    /// Agency (e.g. Selectimob) that registered the receivable.
    pub agency: Pubkey,

    /// Landlord that will receive the BRZ advance on `fund_landlord`.
    pub landlord: Pubkey,

    /// Unique identifier (typically hash of the off-chain contract).
    pub contract_id: [u8; CONTRACT_ID_LEN],

    /// BRZ amount the landlord receives upfront.
    pub principal: u64,

    /// Total BRZ that must come back to the vault. IMMUTABLE after
    /// registration. Interest = repayment - principal.
    pub repayment: u64,

    /// Cumulative BRZ returned so far via `repay` for this receivable.
    /// Supports partial/installment repayments. Final installment must
    /// bring this value to exactly `repayment`.
    pub total_repaid: u64,

    /// Informational annualized rate in basis points (10_000 = 100 %).
    /// The binding number is `repayment`; this is kept for UX/audit only.
    pub rate_bps: u16,

    /// Contract tenor in days (e.g. 30 for monthly).
    pub duration_days: u32,

    /// Unix timestamp when the receivable was registered.
    pub registered_at: i64,

    /// Unix timestamp when the landlord was funded. 0 until `fund_landlord`.
    pub funded_at: i64,

    /// Lifecycle state of the receivable.
    pub status: ReceivableStatus,

    /// Canonical bump for this PDA.
    pub bump: u8,
}

/// Per-investor share ledger. One PDA per (vault, investor) pair.
///
/// PDA seeds: [b"position", vault.key(), investor.key()]
#[account]
#[derive(InitSpace)]
pub struct InvestorPosition {
    /// The investor wallet (Privy-managed or external) that owns this position.
    pub investor: Pubkey,

    /// Parent vault.
    pub vault: Pubkey,

    /// LP-like shares the investor currently holds.
    pub shares: u64,

    /// Cumulative BRZ ever deposited. Informational (for UI "your deposits").
    pub total_deposited: u64,

    /// Cumulative BRZ ever withdrawn. Informational.
    pub total_withdrawn: u64,

    /// Canonical bump.
    pub bump: u8,
}

/// Lifecycle of a Receivable. Transitions are strictly:
///   Registered -> Funded -> Repaid
/// `Defaulted` is reserved for v2 (admin-triggered).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum ReceivableStatus {
    Registered,
    Funded,
    Repaid,
    Defaulted,
}
