use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{
    constants::{CONTRACT_ID_LEN, RECEIVABLE_SEED, VAULT_SEED},
    error::BrixError,
    state::{Receivable, ReceivableStatus, Vault},
};

#[derive(Accounts)]
#[instruction(contract_id: [u8; CONTRACT_ID_LEN])]
pub struct FundLandlord<'info> {
    /// Agency that registered the receivable. Only the same agency can fund.
    #[account(mut)]
    pub agency: Signer<'info>,

    /// Vault that will front the BRZ. Re-derived here so we can sign as it.
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.admin.as_ref()],
        bump = vault.bump,
        has_one = vault_ata @ BrixError::MintMismatch,
    )]
    pub vault: Account<'info, Vault>,

    /// Source: vault's BRZ ATA.
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,

    /// Receivable being funded. Must belong to this vault, be registered
    /// by this agency, and reference the landlord below.
    #[account(
        mut,
        seeds = [RECEIVABLE_SEED, contract_id.as_ref()],
        bump = receivable.bump,
        has_one = vault @ BrixError::VaultMismatch,
        has_one = agency @ BrixError::Unauthorized,
        has_one = landlord,
    )]
    pub receivable: Account<'info, Receivable>,

    /// CHECK: landlord pubkey is validated by `has_one = landlord` above.
    pub landlord: UncheckedAccount<'info>,

    /// Destination: landlord's BRZ ATA.
    #[account(
        mut,
        token::mint = vault.brz_mint,
        token::authority = landlord,
    )]
    pub landlord_brz_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<FundLandlord>,
    _contract_id: [u8; CONTRACT_ID_LEN],
) -> Result<()> {
    require!(!ctx.accounts.vault.paused, BrixError::Paused);
    require!(
        ctx.accounts.receivable.status == ReceivableStatus::Registered,
        BrixError::InvalidReceivableStatus
    );

    let principal = ctx.accounts.receivable.principal;
    require!(
        ctx.accounts.vault_ata.amount >= principal,
        BrixError::InsufficientLiquidity
    );

    let clock = Clock::get()?;
    let admin_key = ctx.accounts.vault.admin;
    let vault_bump = ctx.accounts.vault.bump;

    // Take the AccountInfo for the vault PDA BEFORE the mutable borrow,
    // otherwise the immutable `.to_account_info()` call in the CPI
    // accounts below conflicts with the `&mut ctx.accounts.vault` borrow.
    let vault_authority_ai = ctx.accounts.vault.to_account_info();

    // --- EFFECT ---
    let vault = &mut ctx.accounts.vault;
    vault.total_deployed = vault
        .total_deployed
        .checked_add(principal)
        .ok_or(BrixError::MathOverflow)?;

    let receivable = &mut ctx.accounts.receivable;
    receivable.status = ReceivableStatus::Funded;
    receivable.funded_at = clock.unix_timestamp;

    // --- INTERACTION: vault PDA signs transfer vault_ata -> landlord_ata ---
    let signer_seeds: &[&[&[u8]]] = &[&[VAULT_SEED, admin_key.as_ref(), &[vault_bump]]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_ata.to_account_info(),
        to: ctx.accounts.landlord_brz_ata.to_account_info(),
        authority: vault_authority_ai,
    };
    let cpi_program = ctx.accounts.token_program.key();
    token::transfer(
        CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds),
        principal,
    )?;

    msg!(
        "Funded: landlord={} principal={} total_deployed={}",
        ctx.accounts.landlord.key(),
        principal,
        vault.total_deployed
    );
    Ok(())
}
