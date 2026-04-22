//! End-to-end integration test for the Brix protocol.
//!
//! Covers the full lifecycle:
//!   initialize_vault -> register_receivable -> deposit -> fund_landlord
//!     -> repay (full) -> withdraw
//!
//! Also verifies accounting invariants at each step:
//!   - total_assets conserved across fund_landlord
//!   - investor recovers principal + interest on withdraw (vault drained)

use anchor_lang::{
    prelude::Pubkey,
    solana_program::{instruction::Instruction, program_pack::Pack, system_instruction},
    AccountDeserialize, InstructionData, ToAccountMetas,
};
use anchor_spl::{
    associated_token::{
        get_associated_token_address, spl_associated_token_account,
    },
    token::spl_token::{self, state::Mint as SplMint},
};
use litesvm::LiteSVM;
use solana_keypair::Keypair;
use solana_message::{Message, VersionedMessage};
use solana_signer::Signer;
use solana_transaction::versioned::VersionedTransaction;

const MINT_DECIMALS: u8 = 6;

// ========================================================================
// Test context + helpers
// ========================================================================

struct Ctx {
    svm: LiteSVM,
    payer: Keypair,
    admin: Keypair,
    agency: Keypair,
    landlord: Keypair,
    investor: Keypair,
    brz_mint: Pubkey,
    vault: Pubkey,
    vault_ata: Pubkey,
    agency_ata: Pubkey,
    landlord_ata: Pubkey,
    investor_ata: Pubkey,
}

fn setup() -> Ctx {
    let mut svm = LiteSVM::new();
    let program_id = brix::id();
    let program_bytes = include_bytes!("../../../target/deploy/brix.so");
    svm.add_program(program_id, program_bytes);

    let payer = Keypair::new();
    let admin = Keypair::new();
    let agency = Keypair::new();
    let landlord = Keypair::new();
    let investor = Keypair::new();

    for kp in [&payer, &admin, &agency, &landlord, &investor] {
        svm.airdrop(&kp.pubkey(), 10_000_000_000).unwrap();
    }

    // -- Create BRZ mint --
    let brz_mint_kp = Keypair::new();
    let rent_mint = svm.minimum_balance_for_rent_exemption(SplMint::LEN);
    let create_mint_ix = system_instruction::create_account(
        &payer.pubkey(),
        &brz_mint_kp.pubkey(),
        rent_mint,
        SplMint::LEN as u64,
        &spl_token::ID,
    );
    let init_mint_ix = spl_token::instruction::initialize_mint(
        &spl_token::ID,
        &brz_mint_kp.pubkey(),
        &admin.pubkey(),
        None,
        MINT_DECIMALS,
    )
    .unwrap();
    send_tx(
        &mut svm,
        &[create_mint_ix, init_mint_ix],
        &[&payer, &brz_mint_kp],
    );

    let brz_mint = brz_mint_kp.pubkey();

    // -- Create ATAs for agency, landlord, investor --
    let agency_ata = create_ata(&mut svm, &payer, &agency.pubkey(), &brz_mint);
    let landlord_ata = create_ata(&mut svm, &payer, &landlord.pubkey(), &brz_mint);
    let investor_ata = create_ata(&mut svm, &payer, &investor.pubkey(), &brz_mint);

    // -- Mint 100k BRZ to investor (funds deposits) --
    mint_to(&mut svm, &admin, &brz_mint, &investor_ata, 100_000 * 10u64.pow(MINT_DECIMALS as u32));
    // -- Mint 50k BRZ to agency (funds repayment on behalf of tenant for MVP) --
    mint_to(&mut svm, &admin, &brz_mint, &agency_ata, 50_000 * 10u64.pow(MINT_DECIMALS as u32));

    // -- Derive vault PDA + its ATA --
    let (vault, _) = Pubkey::find_program_address(
        &[brix::constants::VAULT_SEED, admin.pubkey().as_ref()],
        &program_id,
    );
    let vault_ata = get_associated_token_address(&vault, &brz_mint);

    Ctx {
        svm, payer, admin, agency, landlord, investor,
        brz_mint, vault, vault_ata, agency_ata, landlord_ata, investor_ata,
    }
}

fn send_tx(svm: &mut LiteSVM, ixs: &[Instruction], signers: &[&Keypair]) {
    let payer_key = signers[0].pubkey();
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(ixs, Some(&payer_key), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers).unwrap();
    let res = svm.send_transaction(tx);
    if let Err(e) = res {
        panic!("tx failed: {:?}", e);
    }
}

fn create_ata(svm: &mut LiteSVM, payer: &Keypair, owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    let ata = get_associated_token_address(owner, mint);
    let ix = spl_associated_token_account::instruction::create_associated_token_account(
        &payer.pubkey(),
        owner,
        mint,
        &spl_token::ID,
    );
    send_tx(svm, &[ix], &[payer]);
    ata
}

fn mint_to(svm: &mut LiteSVM, authority: &Keypair, mint: &Pubkey, dest: &Pubkey, amount: u64) {
    let ix = spl_token::instruction::mint_to(
        &spl_token::ID,
        mint,
        dest,
        &authority.pubkey(),
        &[],
        amount,
    )
    .unwrap();
    // authority signs; airdrop pays
    send_tx(svm, &[ix], &[authority]);
}

fn token_balance(svm: &LiteSVM, ata: &Pubkey) -> u64 {
    let acc = svm.get_account(ata).expect("ATA not found");
    let token_acc = spl_token::state::Account::unpack(&acc.data).expect("decode ATA");
    token_acc.amount
}

fn fetch<T: AccountDeserialize>(svm: &LiteSVM, addr: &Pubkey) -> T {
    let acc = svm.get_account(addr).expect("account missing");
    T::try_deserialize(&mut acc.data.as_slice()).expect("deserialize")
}

// ========================================================================
// THE TEST — full happy-path cycle, single-installment repayment
// ========================================================================

#[test]
fn full_cycle_single_repay() {
    let mut ctx = setup();
    let program_id = brix::id();

    // Amounts (BRZ has 6 decimals).
    let decimals = 10u64.pow(MINT_DECIMALS as u32);
    let deposit_amount: u64 = 10_000 * decimals;       // investor deposits 10k BRZ
    let principal: u64       = 8_500 * decimals;       // landlord gets 8.5k BRZ
    let repayment: u64       = 9_000 * decimals;       // tenant repays 9k total (juros = 500)
    let rate_bps: u16        = 588;                    // ~5.88% on that tenor
    let duration_days: u32   = 30;

    // ------------------------------------------------------------------
    // 1) initialize_vault
    // ------------------------------------------------------------------
    let ix = Instruction {
        program_id,
        accounts: brix::accounts::InitializeVault {
            admin: ctx.admin.pubkey(),
            vault: ctx.vault,
            brz_mint: ctx.brz_mint,
            vault_ata: ctx.vault_ata,
            token_program: spl_token::ID,
            associated_token_program: spl_associated_token_account::program::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::InitializeVault {}.data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.admin]);

    let vault_state: brix::state::Vault = fetch(&ctx.svm, &ctx.vault);
    assert_eq!(vault_state.admin, ctx.admin.pubkey());
    assert_eq!(vault_state.total_shares, 0);

    // ------------------------------------------------------------------
    // 2) register_receivable
    // ------------------------------------------------------------------
    let mut contract_id = [0u8; brix::constants::CONTRACT_ID_LEN];
    contract_id[..11].copy_from_slice(b"contract-42");

    let (receivable_pda, _) = Pubkey::find_program_address(
        &[brix::constants::RECEIVABLE_SEED, &contract_id],
        &program_id,
    );

    let ix = Instruction {
        program_id,
        accounts: brix::accounts::RegisterReceivable {
            agency: ctx.agency.pubkey(),
            vault: ctx.vault,
            landlord: ctx.landlord.pubkey(),
            receivable: receivable_pda,
            system_program: anchor_lang::solana_program::system_program::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::RegisterReceivable {
            contract_id,
            principal,
            repayment,
            rate_bps,
            duration_days,
        }
        .data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.agency]);

    let r: brix::state::Receivable = fetch(&ctx.svm, &receivable_pda);
    assert_eq!(r.principal, principal);
    assert_eq!(r.repayment, repayment);
    assert_eq!(r.status, brix::state::ReceivableStatus::Registered);

    // ------------------------------------------------------------------
    // 3) deposit (investor -> vault)
    // ------------------------------------------------------------------
    let (position_pda, _) = Pubkey::find_program_address(
        &[
            brix::constants::POSITION_SEED,
            ctx.vault.as_ref(),
            ctx.investor.pubkey().as_ref(),
        ],
        &program_id,
    );

    let ix = Instruction {
        program_id,
        accounts: brix::accounts::Deposit {
            investor: ctx.investor.pubkey(),
            vault: ctx.vault,
            brz_mint: ctx.brz_mint,
            vault_ata: ctx.vault_ata,
            investor_brz_ata: ctx.investor_ata,
            position: position_pda,
            token_program: spl_token::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::Deposit { amount: deposit_amount }.data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.investor]);

    assert_eq!(token_balance(&ctx.svm, &ctx.vault_ata), deposit_amount);
    let pos: brix::state::InvestorPosition = fetch(&ctx.svm, &position_pda);
    assert_eq!(pos.shares, deposit_amount, "1:1 shares on first deposit");

    // ------------------------------------------------------------------
    // 4) fund_landlord (vault -> landlord)
    // ------------------------------------------------------------------
    let ix = Instruction {
        program_id,
        accounts: brix::accounts::FundLandlord {
            agency: ctx.agency.pubkey(),
            vault: ctx.vault,
            vault_ata: ctx.vault_ata,
            receivable: receivable_pda,
            landlord: ctx.landlord.pubkey(),
            landlord_brz_ata: ctx.landlord_ata,
            token_program: spl_token::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::FundLandlord { contract_id }.data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.agency]);

    assert_eq!(token_balance(&ctx.svm, &ctx.landlord_ata), principal);
    assert_eq!(token_balance(&ctx.svm, &ctx.vault_ata), deposit_amount - principal);

    let v: brix::state::Vault = fetch(&ctx.svm, &ctx.vault);
    assert_eq!(v.total_deployed, principal);

    let r: brix::state::Receivable = fetch(&ctx.svm, &receivable_pda);
    assert_eq!(r.status, brix::state::ReceivableStatus::Funded);

    // ------------------------------------------------------------------
    // 5) repay (agency pays full on behalf of tenant)
    // ------------------------------------------------------------------
    let ix = Instruction {
        program_id,
        accounts: brix::accounts::Repay {
            repayer: ctx.agency.pubkey(),
            vault: ctx.vault,
            vault_ata: ctx.vault_ata,
            receivable: receivable_pda,
            repayer_brz_ata: ctx.agency_ata,
            token_program: spl_token::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::Repay {
            contract_id,
            amount: repayment,
        }
        .data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.agency]);

    // Vault ATA now holds: (deposit - principal) + repayment
    //                    = (10_000 - 8_500) + 9_000 = 10_500 BRZ
    let expected_vault = deposit_amount - principal + repayment;
    assert_eq!(token_balance(&ctx.svm, &ctx.vault_ata), expected_vault);

    let v: brix::state::Vault = fetch(&ctx.svm, &ctx.vault);
    assert_eq!(v.total_deployed, 0, "all principal back in vault");

    let r: brix::state::Receivable = fetch(&ctx.svm, &receivable_pda);
    assert_eq!(r.status, brix::state::ReceivableStatus::Repaid);
    assert_eq!(r.total_repaid, repayment);

    // ------------------------------------------------------------------
    // 6) withdraw (investor burns all shares, gets principal + juros)
    // ------------------------------------------------------------------
    let pos: brix::state::InvestorPosition = fetch(&ctx.svm, &position_pda);
    let all_shares = pos.shares;

    let ix = Instruction {
        program_id,
        accounts: brix::accounts::Withdraw {
            investor: ctx.investor.pubkey(),
            vault: ctx.vault,
            vault_ata: ctx.vault_ata,
            position: position_pda,
            investor_brz_ata: ctx.investor_ata,
            token_program: spl_token::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::Withdraw { shares: all_shares }.data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.investor]);

    // Investor had 100k BRZ initial, deposited 10k, now recovers 10.5k.
    // Final balance = 100_000 - 10_000 + 10_500 = 100_500 BRZ
    let final_investor = token_balance(&ctx.svm, &ctx.investor_ata);
    let initial_balance = 100_000u64 * decimals;
    assert_eq!(final_investor, initial_balance - deposit_amount + expected_vault);

    // Vault ATA drained.
    assert_eq!(token_balance(&ctx.svm, &ctx.vault_ata), 0);

    let v: brix::state::Vault = fetch(&ctx.svm, &ctx.vault);
    assert_eq!(v.total_shares, 0);

    // Investor profit check: got 500 BRZ more than they started with.
    // Start: initial_balance. End: final_investor. Profit = end - start.
    let profit = final_investor.saturating_sub(initial_balance);
    let expected_profit = 500 * decimals;
    assert_eq!(profit, expected_profit, "investor yield should equal the receivable's interest");
}

// ========================================================================
// Partial repay test — proves 3-installment rounding closes exactly.
// ========================================================================

#[test]
fn partial_repay_three_installments() {
    let mut ctx = setup();
    let program_id = brix::id();

    let decimals = 10u64.pow(MINT_DECIMALS as u32);
    let deposit_amount: u64 = 10_000 * decimals;
    let principal: u64       = 8_500 * decimals;
    let repayment: u64       = 9_000 * decimals;
    let rate_bps: u16        = 588;
    let duration_days: u32   = 30;

    // init + register + deposit + fund (compressed setup)
    init_vault(&mut ctx);
    let mut contract_id = [0u8; brix::constants::CONTRACT_ID_LEN];
    contract_id[..11].copy_from_slice(b"contract-99");
    let receivable_pda = register(
        &mut ctx, &contract_id, principal, repayment, rate_bps, duration_days,
    );
    deposit(&mut ctx, deposit_amount);
    fund(&mut ctx, &contract_id, receivable_pda);

    // Split repayment into 3 installments: 3000, 3000, 3000 BRZ.
    // `expire_blockhash()` forces a fresh blockhash between otherwise-identical
    // transactions so LiteSVM doesn't flag them as `AlreadyProcessed` duplicates.
    let installment: u64 = 3_000 * decimals;
    repay_amount(&mut ctx, &contract_id, receivable_pda, installment);
    let r: brix::state::Receivable = fetch(&ctx.svm, &receivable_pda);
    assert_eq!(r.total_repaid, installment);
    assert_eq!(r.status, brix::state::ReceivableStatus::Funded, "still funded mid-installments");

    ctx.svm.expire_blockhash();
    repay_amount(&mut ctx, &contract_id, receivable_pda, installment);
    let r: brix::state::Receivable = fetch(&ctx.svm, &receivable_pda);
    assert_eq!(r.total_repaid, 2 * installment);
    assert_eq!(r.status, brix::state::ReceivableStatus::Funded);

    ctx.svm.expire_blockhash();
    repay_amount(&mut ctx, &contract_id, receivable_pda, installment);
    let r: brix::state::Receivable = fetch(&ctx.svm, &receivable_pda);
    assert_eq!(r.total_repaid, repayment);
    assert_eq!(r.status, brix::state::ReceivableStatus::Repaid);

    // CRITICAL: total_deployed must close to exactly 0 after final installment.
    let v: brix::state::Vault = fetch(&ctx.svm, &ctx.vault);
    assert_eq!(v.total_deployed, 0, "rounding drift must be absorbed by final installment");
    assert_eq!(v.total_repaid, repayment);
}

// ---- Reusable ix builders for the second test ----

fn init_vault(ctx: &mut Ctx) {
    let program_id = brix::id();
    let ix = Instruction {
        program_id,
        accounts: brix::accounts::InitializeVault {
            admin: ctx.admin.pubkey(),
            vault: ctx.vault,
            brz_mint: ctx.brz_mint,
            vault_ata: ctx.vault_ata,
            token_program: spl_token::ID,
            associated_token_program: spl_associated_token_account::program::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::InitializeVault {}.data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.admin]);
}

fn register(
    ctx: &mut Ctx,
    contract_id: &[u8; brix::constants::CONTRACT_ID_LEN],
    principal: u64,
    repayment: u64,
    rate_bps: u16,
    duration_days: u32,
) -> Pubkey {
    let program_id = brix::id();
    let (receivable_pda, _) = Pubkey::find_program_address(
        &[brix::constants::RECEIVABLE_SEED, contract_id],
        &program_id,
    );
    let ix = Instruction {
        program_id,
        accounts: brix::accounts::RegisterReceivable {
            agency: ctx.agency.pubkey(),
            vault: ctx.vault,
            landlord: ctx.landlord.pubkey(),
            receivable: receivable_pda,
            system_program: anchor_lang::solana_program::system_program::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::RegisterReceivable {
            contract_id: *contract_id,
            principal,
            repayment,
            rate_bps,
            duration_days,
        }
        .data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.agency]);
    receivable_pda
}

fn deposit(ctx: &mut Ctx, amount: u64) {
    let program_id = brix::id();
    let (position_pda, _) = Pubkey::find_program_address(
        &[
            brix::constants::POSITION_SEED,
            ctx.vault.as_ref(),
            ctx.investor.pubkey().as_ref(),
        ],
        &program_id,
    );
    let ix = Instruction {
        program_id,
        accounts: brix::accounts::Deposit {
            investor: ctx.investor.pubkey(),
            vault: ctx.vault,
            brz_mint: ctx.brz_mint,
            vault_ata: ctx.vault_ata,
            investor_brz_ata: ctx.investor_ata,
            position: position_pda,
            token_program: spl_token::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::Deposit { amount }.data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.investor]);
}

fn fund(
    ctx: &mut Ctx,
    contract_id: &[u8; brix::constants::CONTRACT_ID_LEN],
    receivable_pda: Pubkey,
) {
    let program_id = brix::id();
    let ix = Instruction {
        program_id,
        accounts: brix::accounts::FundLandlord {
            agency: ctx.agency.pubkey(),
            vault: ctx.vault,
            vault_ata: ctx.vault_ata,
            receivable: receivable_pda,
            landlord: ctx.landlord.pubkey(),
            landlord_brz_ata: ctx.landlord_ata,
            token_program: spl_token::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::FundLandlord {
            contract_id: *contract_id,
        }
        .data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.agency]);
}

fn repay_amount(
    ctx: &mut Ctx,
    contract_id: &[u8; brix::constants::CONTRACT_ID_LEN],
    receivable_pda: Pubkey,
    amount: u64,
) {
    let program_id = brix::id();
    let ix = Instruction {
        program_id,
        accounts: brix::accounts::Repay {
            repayer: ctx.agency.pubkey(),
            vault: ctx.vault,
            vault_ata: ctx.vault_ata,
            receivable: receivable_pda,
            repayer_brz_ata: ctx.agency_ata,
            token_program: spl_token::ID,
        }
        .to_account_metas(None),
        data: brix::instruction::Repay {
            contract_id: *contract_id,
            amount,
        }
        .data(),
    };
    send_tx(&mut ctx.svm, &[ix], &[&ctx.agency]);
}
