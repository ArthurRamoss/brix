use anchor_lang::prelude::*;

use crate::{
    constants::{CONTRACT_ID_LEN, RECEIVABLE_SEED},
    error::BrixError,
    state::{Receivable, ReceivableStatus, Vault},
};

/// Admin-only: forcibly close a receivable PDA and adjust vault accounting
/// to drop any unreleased principal off the books.
///
/// Use cases:
///   - Bad-debt write-off: a receivable is in `Funded` status and the agency
///     can't recover the loan. Admin marks it as a loss; the vault's
///     `total_deployed` is decremented by the still-outstanding principal,
///     so investor share value reflects reality.
///   - Demo/test cleanup: reset orphaned receivables left over from prior
///     UI bugs.
///
/// What this DOES NOT do:
///   - Move BRZ around. No tokens are minted, burned, or transferred. The
///     vault's BRZ ATA balance is unchanged.
///   - Rebate investors. The principal that left the vault on `fund_landlord`
///     is gone from a token-flow perspective; this instruction only updates
///     bookkeeping.
///
/// Admin authority is enforced via `has_one = admin` on the vault: only the
/// signer that originally initialized the vault can call this. Same gate the
/// existing instructions rely on for vault-level operations.
#[derive(Accounts)]
#[instruction(contract_id: [u8; CONTRACT_ID_LEN])]
pub struct AdminCloseReceivable<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Vault whose accounting we're correcting. Admin authority is enforced
    /// by the `has_one` constraint — only the vault's stored admin pubkey
    /// can sign.
    #[account(
        mut,
        has_one = admin @ BrixError::Unauthorized,
    )]
    pub vault: Account<'info, Vault>,

    /// Receivable being closed. Lamports rent-refunded to admin via
    /// `close = admin`. Constraint also verifies it belongs to this vault.
    #[account(
        mut,
        seeds = [RECEIVABLE_SEED, contract_id.as_ref()],
        bump = receivable.bump,
        has_one = vault @ BrixError::VaultMismatch,
        close = admin,
    )]
    pub receivable: Account<'info, Receivable>,
}

pub fn handler(
    ctx: Context<AdminCloseReceivable>,
    _contract_id: [u8; CONTRACT_ID_LEN],
) -> Result<()> {
    let receivable = &ctx.accounts.receivable;

    // Only Funded receivables hold deployed principal. Registered (never
    // funded) and Repaid (already settled) don't move total_deployed when
    // closed — but we still want to allow closing them so admins can clean
    // up empty/orphan PDAs.
    if receivable.status == ReceivableStatus::Funded {
        // remaining_principal = principal - principal_released_so_far
        // (mirrors the math in repay::handler)
        let prior_principal_released = (receivable.total_repaid as u128)
            .checked_mul(receivable.principal as u128)
            .ok_or(BrixError::MathOverflow)?
            .checked_div(receivable.repayment as u128)
            .ok_or(BrixError::MathOverflow)?;
        let remaining_principal = (receivable.principal as u128)
            .checked_sub(prior_principal_released)
            .ok_or(BrixError::MathOverflow)?;
        let remaining_u64 =
            u64::try_from(remaining_principal).map_err(|_| BrixError::MathOverflow)?;

        let vault = &mut ctx.accounts.vault;
        vault.total_deployed = vault
            .total_deployed
            .checked_sub(remaining_u64)
            .ok_or(BrixError::MathOverflow)?;
    }

    msg!(
        "AdminCloseReceivable: contract_id={:?} status_was={:?} total_repaid={}/{} principal={}",
        receivable.contract_id,
        receivable.status,
        receivable.total_repaid,
        receivable.repayment,
        receivable.principal,
    );
    Ok(())
}
