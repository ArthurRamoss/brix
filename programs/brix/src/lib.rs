pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94");

#[program]
pub mod brix {
    use super::*;

    /// Create the singleton vault PDA for an admin + the vault's BRZ ATA.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        instructions::initialize_vault::handler(ctx)
    }

    /// Agency registers a rental receivable on behalf of a landlord.
    /// `repayment` is fixed at registration (immutable rate guarantee).
    pub fn register_receivable(
        ctx: Context<RegisterReceivable>,
        contract_id: [u8; CONTRACT_ID_LEN],
        principal: u64,
        repayment: u64,
        rate_bps: u16,
        duration_days: u32,
    ) -> Result<()> {
        instructions::register_receivable::handler(
            ctx,
            contract_id,
            principal,
            repayment,
            rate_bps,
            duration_days,
        )
    }

    /// Investor deposits BRZ into the vault and receives pro-rata shares.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    /// Vault fronts the principal to the landlord's ATA. Agency-signed.
    pub fn fund_landlord(
        ctx: Context<FundLandlord>,
        contract_id: [u8; CONTRACT_ID_LEN],
    ) -> Result<()> {
        instructions::fund_landlord::handler(ctx, contract_id)
    }

    /// Repay (partial or full) towards a funded receivable.
    /// Accepts installments; status flips to Repaid when total reaches repayment.
    pub fn repay(
        ctx: Context<Repay>,
        contract_id: [u8; CONTRACT_ID_LEN],
        amount: u64,
    ) -> Result<()> {
        instructions::repay::handler(ctx, contract_id, amount)
    }

    /// Investor burns shares for pro-rata BRZ (principal + accrued interest).
    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, shares)
    }

    /// Admin-only: forcibly close a Receivable PDA and write off any
    /// unreleased principal from `vault.total_deployed`. Used for bad-debt
    /// cleanup and demo resets — see admin_close_receivable.rs for the full
    /// rationale.
    pub fn admin_close_receivable(
        ctx: Context<AdminCloseReceivable>,
        contract_id: [u8; CONTRACT_ID_LEN],
    ) -> Result<()> {
        instructions::admin_close_receivable::handler(ctx, contract_id)
    }

    /// Admin-only: forcibly close an InvestorPosition PDA and burn its
    /// shares from `vault.total_shares`. Demo cleanup helper.
    pub fn admin_close_position(ctx: Context<AdminClosePosition>) -> Result<()> {
        instructions::admin_close_position::handler(ctx)
    }
}
