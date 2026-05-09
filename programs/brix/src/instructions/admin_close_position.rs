use anchor_lang::prelude::*;

use crate::{
    constants::POSITION_SEED,
    error::BrixError,
    state::{InvestorPosition, Vault},
};

/// Admin-only: forcibly close an InvestorPosition PDA and decrement
/// `vault.total_shares` by whatever shares the position held. Useful for
/// resetting demo state — in production this would only be invoked to
/// clean up positions that have already drained to zero through normal
/// withdrawals.
///
/// What this DOES NOT do:
///   - Pay the investor anything. Any unrealized share value is forfeited
///     when admin closes the position. In a real scenario the admin would
///     first ensure the investor withdraws, then close.
///   - Touch the vault's BRZ ATA.
///
/// Lamports from the closed PDA's rent are refunded to admin (not the
/// investor) — keeps things simple for demo cleanup.
#[derive(Accounts)]
pub struct AdminClosePosition<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Vault whose share counter we're decrementing.
    #[account(
        mut,
        has_one = admin @ BrixError::Unauthorized,
    )]
    pub vault: Account<'info, Vault>,

    /// Position being closed. Constraint enforces it belongs to this vault.
    #[account(
        mut,
        seeds = [POSITION_SEED, vault.key().as_ref(), position.investor.as_ref()],
        bump = position.bump,
        has_one = vault @ BrixError::VaultMismatch,
        close = admin,
    )]
    pub position: Account<'info, InvestorPosition>,
}

pub fn handler(ctx: Context<AdminClosePosition>) -> Result<()> {
    let position = &ctx.accounts.position;
    let vault = &mut ctx.accounts.vault;

    // Saturating sub: if shares accounting somehow drifted (shouldn't, but
    // defense in depth) we don't want a panic to brick the cleanup path.
    vault.total_shares = vault.total_shares.saturating_sub(position.shares);

    msg!(
        "AdminClosePosition: investor={} shares_burned={} total_shares_now={}",
        position.investor,
        position.shares,
        vault.total_shares,
    );
    Ok(())
}
