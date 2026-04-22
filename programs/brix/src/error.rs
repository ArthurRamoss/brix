use anchor_lang::prelude::*;

#[error_code]
pub enum BrixError {
    #[msg("Protocol is paused")]
    Paused,

    #[msg("Unauthorized signer for this instruction")]
    Unauthorized,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("Repayment must be strictly greater than principal")]
    InvalidRepayment,

    #[msg("Rate must be greater than zero")]
    InvalidRate,

    #[msg("Duration must be greater than zero")]
    InvalidDuration,

    #[msg("Receivable is not in the expected status for this action")]
    InvalidReceivableStatus,

    #[msg("Repay amount must equal the receivable's repayment value (MVP: full repay only)")]
    RepayAmountMismatch,

    #[msg("Investor does not have enough shares to burn")]
    InsufficientShares,

    #[msg("Vault does not hold enough liquid BRZ for this withdrawal")]
    InsufficientLiquidity,

    #[msg("Arithmetic overflow")]
    MathOverflow,

    #[msg("Mint of the provided token account does not match the vault's BRZ mint")]
    MintMismatch,

    #[msg("Receivable does not belong to the provided vault")]
    VaultMismatch,
}
