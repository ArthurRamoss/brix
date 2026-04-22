use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{
    constants::POSITION_SEED,
    error::BrixError,
    state::{InvestorPosition, Vault},
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    /// Investor (Privy-managed or external Solana wallet) signing the deposit.
    #[account(mut)]
    pub investor: Signer<'info>,

    /// Target vault. Must match the mint and ATA of the token accounts below.
    #[account(
        mut,
        has_one = brz_mint @ BrixError::MintMismatch,
        has_one = vault_ata @ BrixError::MintMismatch,
    )]
    pub vault: Account<'info, Vault>,

    pub brz_mint: Account<'info, Mint>,

    /// Vault's own ATA (destination of the transfer).
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,

    /// Investor's BRZ ATA (source of the transfer).
    #[account(
        mut,
        token::mint = brz_mint,
        token::authority = investor,
    )]
    pub investor_brz_ata: Account<'info, TokenAccount>,

    /// Per-investor share ledger. Created on first deposit, updated on
    /// subsequent deposits.
    #[account(
        init_if_needed,
        payer = investor,
        seeds = [POSITION_SEED, vault.key().as_ref(), investor.key().as_ref()],
        bump,
        space = 8 + InvestorPosition::INIT_SPACE,
    )]
    pub position: Account<'info, InvestorPosition>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(!ctx.accounts.vault.paused, BrixError::Paused);
    require!(amount > 0, BrixError::InvalidAmount);

    // --- Calculate shares to mint (BEFORE any state mutation) ---
    // total_assets = idle BRZ in vault ATA + BRZ currently deployed to landlords
    let liquid = ctx.accounts.vault_ata.amount;
    let vault_snapshot = &ctx.accounts.vault;
    let total_assets = liquid
        .checked_add(vault_snapshot.total_deployed)
        .ok_or(BrixError::MathOverflow)?;

    let shares_to_mint: u64 = if vault_snapshot.total_shares == 0 || total_assets == 0 {
        // First deposit ever (or vault was drained and total_shares is 0):
        // bootstrap exchange rate at 1 BRZ = 1 share.
        amount
    } else {
        // shares = amount * total_shares / total_assets (round down against user)
        let scaled = (amount as u128)
            .checked_mul(vault_snapshot.total_shares as u128)
            .ok_or(BrixError::MathOverflow)?
            .checked_div(total_assets as u128)
            .ok_or(BrixError::MathOverflow)?;
        u64::try_from(scaled).map_err(|_| BrixError::MathOverflow)?
    };
    require!(shares_to_mint > 0, BrixError::InvalidAmount);

    // --- EFFECT: update state before CPI (checks-effects-interactions) ---
    let investor_key = ctx.accounts.investor.key();
    let vault_key = ctx.accounts.vault.key();
    let position_bump = ctx.bumps.position;

    // Initialize position fields if newly created.
    // For a fresh PDA all bytes are zero, so investor==Pubkey::default() works
    // as a freshness sentinel.
    let position = &mut ctx.accounts.position;
    if position.investor == Pubkey::default() {
        position.investor = investor_key;
        position.vault = vault_key;
        position.shares = 0;
        position.total_deposited = 0;
        position.total_withdrawn = 0;
        position.bump = position_bump;
    }
    position.shares = position
        .shares
        .checked_add(shares_to_mint)
        .ok_or(BrixError::MathOverflow)?;
    position.total_deposited = position
        .total_deposited
        .checked_add(amount)
        .ok_or(BrixError::MathOverflow)?;

    let vault = &mut ctx.accounts.vault;
    vault.total_shares = vault
        .total_shares
        .checked_add(shares_to_mint)
        .ok_or(BrixError::MathOverflow)?;
    vault.total_deposits = vault
        .total_deposits
        .checked_add(amount)
        .ok_or(BrixError::MathOverflow)?;

    // --- INTERACTION: CPI transfer investor_ata -> vault_ata ---
    let cpi_accounts = Transfer {
        from: ctx.accounts.investor_brz_ata.to_account_info(),
        to: ctx.accounts.vault_ata.to_account_info(),
        authority: ctx.accounts.investor.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.key();
    token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

    msg!(
        "Deposit: investor={} amount={} shares_minted={} total_shares={}",
        investor_key,
        amount,
        shares_to_mint,
        vault.total_shares
    );
    Ok(())
}
