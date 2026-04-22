pub mod deposit;
pub mod fund_landlord;
pub mod initialize_vault;
pub mod register_receivable;
pub mod repay;
pub mod withdraw;

// Glob re-exports are required here: the `#[program]` macro in `lib.rs`
// expects the Anchor-generated `__client_accounts_*` modules to be
// reachable at the crate root, which only happens via `pub use module::*;`.
// The ambiguous `handler` re-export is a harmless warning — all call
// sites use the fully-qualified path `instructions::<ix>::handler(...)`.
pub use deposit::*;
pub use fund_landlord::*;
pub use initialize_vault::*;
pub use register_receivable::*;
pub use repay::*;
pub use withdraw::*;
