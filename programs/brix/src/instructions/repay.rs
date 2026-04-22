use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{
    constants::{CONTRACT_ID_LEN, RECEIVABLE_SEED},
    error::BrixError,
    state::{Receivable, ReceivableStatus, Vault},
};

#[derive(Accounts)]
#[instruction(contract_id: [u8; CONTRACT_ID_LEN])]
pub struct Repay<'info> {
    /// Anyone can call repay — the tenant, the agency on their behalf, or
    /// an admin script. Ownership of source ATA is what matters.
    #[account(mut)]
    pub repayer: Signer<'info>,

    /// Vault receiving the repayment.
    #[account(
        mut,
        has_one = vault_ata @ BrixError::MintMismatch,
    )]
    pub vault: Account<'info, Vault>,

    /// Destination: vault's BRZ ATA.
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,

    /// Receivable being repaid. Must be Funded (not Registered, not Repaid).
    #[account(
        mut,
        seeds = [RECEIVABLE_SEED, contract_id.as_ref()],
        bump = receivable.bump,
        has_one = vault @ BrixError::VaultMismatch,
    )]
    pub receivable: Account<'info, Receivable>,

    /// Source: repayer's BRZ ATA.
    #[account(
        mut,
        token::mint = vault.brz_mint,
        token::authority = repayer,
    )]
    pub repayer_brz_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<Repay>,
    _contract_id: [u8; CONTRACT_ID_LEN],
    amount: u64,
) -> Result<()> {
    require!(amount > 0, BrixError::InvalidAmount);
    require!(
        ctx.accounts.receivable.status == ReceivableStatus::Funded,
        BrixError::InvalidReceivableStatus
    );

    // --- Compute the split principal / interest for THIS installment ---
    // Invariant: after N installments summing to `repayment`, the total
    // `principal_part` released must equal `receivable.principal` exactly.
    // To avoid integer-division drift, the FINAL installment releases all
    // remaining deployed principal (repayment - prior_total_repaid ->
    // principal - prior_principal_released).
    let receivable_snapshot = &ctx.accounts.receivable;
    let prior_total_repaid = receivable_snapshot.total_repaid;
    let principal = receivable_snapshot.principal;
    let repayment = receivable_snapshot.repayment;

    let new_total_repaid = prior_total_repaid
        .checked_add(amount)
        .ok_or(BrixError::MathOverflow)?;
    require!(new_total_repaid <= repayment, BrixError::RepayAmountMismatch);

    let is_final_installment = new_total_repaid == repayment;

    // principal_released_so_far = prior_total_repaid * principal / repayment
    let prior_principal_released = (prior_total_repaid as u128)
        .checked_mul(principal as u128)
        .ok_or(BrixError::MathOverflow)?
        .checked_div(repayment as u128)
        .ok_or(BrixError::MathOverflow)?;

    // principal_part for this installment
    let principal_part: u64 = if is_final_installment {
        // Final: release everything that remains so `total_deployed` closes
        // exactly — rounding drift absorbed here.
        let remaining = (principal as u128)
            .checked_sub(prior_principal_released)
            .ok_or(BrixError::MathOverflow)?;
        u64::try_from(remaining).map_err(|_| BrixError::MathOverflow)?
    } else {
        // new_total_repaid * principal / repayment - prior_principal_released
        let new_principal_released = (new_total_repaid as u128)
            .checked_mul(principal as u128)
            .ok_or(BrixError::MathOverflow)?
            .checked_div(repayment as u128)
            .ok_or(BrixError::MathOverflow)?;
        let delta = new_principal_released
            .checked_sub(prior_principal_released)
            .ok_or(BrixError::MathOverflow)?;
        u64::try_from(delta).map_err(|_| BrixError::MathOverflow)?
    };

    // --- EFFECT ---
    let vault = &mut ctx.accounts.vault;
    vault.total_deployed = vault
        .total_deployed
        .checked_sub(principal_part)
        .ok_or(BrixError::MathOverflow)?;
    vault.total_repaid = vault
        .total_repaid
        .checked_add(amount)
        .ok_or(BrixError::MathOverflow)?;

    let receivable = &mut ctx.accounts.receivable;
    receivable.total_repaid = new_total_repaid;
    if is_final_installment {
        receivable.status = ReceivableStatus::Repaid;
    }

    // --- INTERACTION: repayer_ata -> vault_ata ---
    let cpi_accounts = Transfer {
        from: ctx.accounts.repayer_brz_ata.to_account_info(),
        to: ctx.accounts.vault_ata.to_account_info(),
        authority: ctx.accounts.repayer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.key();
    token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

    msg!(
        "Repay: amount={} principal_released={} total_repaid={}/{} status={:?}",
        amount,
        principal_part,
        new_total_repaid,
        repayment,
        receivable.status
    );
    Ok(())
}
