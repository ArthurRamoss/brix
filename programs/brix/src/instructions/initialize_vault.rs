use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::{constants::VAULT_SEED, state::Vault};

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    /// Admin pays for the vault account + ATA creation and becomes the
    /// governance authority (pause etc. in v2).
    #[account(mut)]
    pub admin: Signer<'info>,

    /// The singleton Vault PDA for this admin.
    #[account(
        init,
        payer = admin,
        seeds = [VAULT_SEED, admin.key().as_ref()],
        bump,
        space = 8 + Vault::INIT_SPACE,
    )]
    pub vault: Account<'info, Vault>,

    /// BRZ mint (or any SPL-Token classic stablecoin for localnet/devnet tests).
    pub brz_mint: Account<'info, Mint>,

    /// ATA owned by the vault PDA. This is where deposited BRZ sits before
    /// being funded out to landlords.
    #[account(
        init,
        payer = admin,
        associated_token::mint = brz_mint,
        associated_token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.admin = ctx.accounts.admin.key();
    vault.brz_mint = ctx.accounts.brz_mint.key();
    vault.vault_ata = ctx.accounts.vault_ata.key();
    vault.total_shares = 0;
    vault.total_deployed = 0;
    vault.total_deposits = 0;
    vault.total_repaid = 0;
    vault.paused = false;
    vault.bump = ctx.bumps.vault;

    msg!(
        "Vault initialized: admin={}, mint={}, ata={}",
        vault.admin,
        vault.brz_mint,
        vault.vault_ata
    );
    Ok(())
}
