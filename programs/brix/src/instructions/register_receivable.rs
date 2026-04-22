use anchor_lang::prelude::*;

use crate::{
    constants::{CONTRACT_ID_LEN, RECEIVABLE_SEED},
    error::BrixError,
    state::{Receivable, ReceivableStatus, Vault},
};

#[derive(Accounts)]
#[instruction(contract_id: [u8; CONTRACT_ID_LEN])]
pub struct RegisterReceivable<'info> {
    /// Agency (e.g. Selectimob) pays for account creation and is recorded
    /// as the registering authority.
    #[account(mut)]
    pub agency: Signer<'info>,

    /// The target vault. Readonly — we only reference it.
    pub vault: Account<'info, Vault>,

    /// CHECK: the landlord never signs; we simply store the pubkey so
    /// `fund_landlord` can later validate the destination ATA belongs to it.
    pub landlord: UncheckedAccount<'info>,

    /// The new Receivable PDA. Initialization fails if the contract_id was
    /// already used (desired — contract IDs must be unique per protocol).
    #[account(
        init,
        payer = agency,
        seeds = [RECEIVABLE_SEED, contract_id.as_ref()],
        bump,
        space = 8 + Receivable::INIT_SPACE,
    )]
    pub receivable: Account<'info, Receivable>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterReceivable>,
    contract_id: [u8; CONTRACT_ID_LEN],
    principal: u64,
    repayment: u64,
    rate_bps: u16,
    duration_days: u32,
) -> Result<()> {
    // Validation
    require!(principal > 0, BrixError::InvalidAmount);
    require!(repayment > principal, BrixError::InvalidRepayment);
    require!(rate_bps > 0, BrixError::InvalidRate);
    require!(duration_days > 0, BrixError::InvalidDuration);

    let clock = Clock::get()?;
    let receivable = &mut ctx.accounts.receivable;

    receivable.vault = ctx.accounts.vault.key();
    receivable.agency = ctx.accounts.agency.key();
    receivable.landlord = ctx.accounts.landlord.key();
    receivable.contract_id = contract_id;
    receivable.principal = principal;
    receivable.repayment = repayment;
    receivable.total_repaid = 0;
    receivable.rate_bps = rate_bps;
    receivable.duration_days = duration_days;
    receivable.registered_at = clock.unix_timestamp;
    receivable.funded_at = 0;
    receivable.status = ReceivableStatus::Registered;
    receivable.bump = ctx.bumps.receivable;

    msg!(
        "Receivable registered: principal={}, repayment={}, agency={}, landlord={}",
        principal,
        repayment,
        receivable.agency,
        receivable.landlord
    );
    Ok(())
}
