use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{
    constants::{POSITION_SEED, VAULT_SEED},
    error::BrixError,
    state::{InvestorPosition, Vault},
};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.admin.as_ref()],
        bump = vault.bump,
        has_one = vault_ata @ BrixError::MintMismatch,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,

    /// Investor's position ledger. `has_one` enforces ownership.
    #[account(
        mut,
        seeds = [POSITION_SEED, vault.key().as_ref(), investor.key().as_ref()],
        bump = position.bump,
        has_one = investor @ BrixError::Unauthorized,
        has_one = vault @ BrixError::VaultMismatch,
    )]
    pub position: Account<'info, InvestorPosition>,

    #[account(
        mut,
        token::mint = vault.brz_mint,
        token::authority = investor,
    )]
    pub investor_brz_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
    // NOTE: `withdraw` is explicitly NOT gated by `vault.paused`. Users
    // can always exit. Only `deposit` / `fund_landlord` are paused.
    require!(shares > 0, BrixError::InvalidAmount);
    require!(
        shares <= ctx.accounts.position.shares,
        BrixError::InsufficientShares
    );
    require!(ctx.accounts.vault.total_shares > 0, BrixError::InsufficientShares);

    // --- Price shares against current total assets ---
    let liquid = ctx.accounts.vault_ata.amount;
    let vault_snapshot = &ctx.accounts.vault;
    let total_assets = liquid
        .checked_add(vault_snapshot.total_deployed)
        .ok_or(BrixError::MathOverflow)?;

    // amount_out = shares * total_assets / total_shares (round down)
    let scaled = (shares as u128)
        .checked_mul(total_assets as u128)
        .ok_or(BrixError::MathOverflow)?
        .checked_div(vault_snapshot.total_shares as u128)
        .ok_or(BrixError::MathOverflow)?;
    let amount_out = u64::try_from(scaled).map_err(|_| BrixError::MathOverflow)?;

    require!(amount_out > 0, BrixError::InsufficientLiquidity);
    // Can't withdraw beyond idle BRZ — deployed capital is locked until repay.
    require!(amount_out <= liquid, BrixError::InsufficientLiquidity);

    let admin_key = vault_snapshot.admin;
    let vault_bump = vault_snapshot.bump;

    // Take the AccountInfo for the vault PDA BEFORE the mutable borrow —
    // the CPI below uses it as `authority`, and that immutable borrow
    // would otherwise clash with `&mut ctx.accounts.vault`.
    let vault_authority_ai = ctx.accounts.vault.to_account_info();

    // --- EFFECT ---
    let vault = &mut ctx.accounts.vault;
    vault.total_shares = vault
        .total_shares
        .checked_sub(shares)
        .ok_or(BrixError::MathOverflow)?;

    let position = &mut ctx.accounts.position;
    position.shares = position
        .shares
        .checked_sub(shares)
        .ok_or(BrixError::MathOverflow)?;
    position.total_withdrawn = position
        .total_withdrawn
        .checked_add(amount_out)
        .ok_or(BrixError::MathOverflow)?;

    // --- INTERACTION: vault PDA signs transfer vault_ata -> investor_ata ---
    let signer_seeds: &[&[&[u8]]] = &[&[VAULT_SEED, admin_key.as_ref(), &[vault_bump]]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_ata.to_account_info(),
        to: ctx.accounts.investor_brz_ata.to_account_info(),
        authority: vault_authority_ai,
    };
    let cpi_program = ctx.accounts.token_program.key();
    token::transfer(
        CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds),
        amount_out,
    )?;

    msg!(
        "Withdraw: investor={} shares_burned={} amount_out={} total_shares={}",
        ctx.accounts.investor.key(),
        shares,
        amount_out,
        vault.total_shares
    );
    Ok(())
}
