# Context Dump — 2026-04-22 (fim de sessão CP1)

> **Pra que serve**: primeiro arquivo pra ler na próxima sessão Claude Code. Resume onde paramos sem precisar revisitar logs inteiros.
>
> **Ordem de leitura recomendada na nova sessão**:
> 1. Este arquivo
> 2. `.agents/AGENT_BRAIN.md` (convenções + glossário atualizado)
> 3. `CHECKPOINTS.md` (estado de cada checkpoint)
> 4. `ROADMAP.md` (o que ficou pra v2/v3)
> 5. `brix.md` (só se precisar revisitar pitch/produto)

---

## TL;DR

**CP1 (Anchor Core) está COMPLETO e deployado em devnet.** Próximo é CP2 (frontend Next.js + Privy + páginas `/landlord` e `/invest`).

- Commit: `a4a14c2 feat(cp1): implement brix anchor program + deploy to devnet`
- Tag: `cp1-done` (pushed)
- Branch: `main` (pushed)

---

## Estado do repo

### On-chain (devnet)
| Item | Valor |
|---|---|
| Program ID | `6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94` |
| Upgrade authority | `EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs` (wallet do Arthur) |
| Cluster | `devnet` |
| ProgramData Address | `5gnLDC8Q7x7EWVivmnn5kH9vMRiFE536qKH11Y2MKXQb` |
| Saldo wallet após deploy | ~0.4 SOL (começou com 2.5, ~2.1 trancado no program data como rent) |
| Verificar | `solana program show 6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94 --url devnet` |

### Código escrito (todos em `programs/brix/`)
```
src/
  constants.rs       — seeds (VAULT, RECEIVABLE, POSITION) + BPS + CONTRACT_ID_LEN=32
  error.rs           — BrixError (13 variants)
  state.rs           — Vault, Receivable, InvestorPosition, ReceivableStatus
  lib.rs             — 6 entrypoints + declare_id!
  instructions.rs    — barrel (glob re-exports)
  instructions/
    initialize_vault.rs
    register_receivable.rs
    deposit.rs
    fund_landlord.rs
    repay.rs
    withdraw.rs
tests/
  test_e2e_cycle.rs  — 2 testes integration (full + 3-parcelas)
```

### Testes (todos passando)
```
test test_id                               ... ok   (unit)
test full_cycle_single_repay               ... ok   (integration)
test partial_repay_three_installments      ... ok   (integration)
```

Rodar: `cd /mnt/c/Users/Ramos/Desktop/brix && cargo test --manifest-path programs/brix/Cargo.toml`
(via WSL — não rodar no Git Bash Windows)

---

## Modelo de contabilidade (IMPORTANTE não esquecer)

### Invariants do Vault
- `total_assets = vault_ata.amount + total_deployed`
- `fund_landlord` conserva `total_assets` (só move entre os dois termos).
- `repay` cresce `total_assets` pelo `juros_part` (principal_part volta pro ATA, juros é novo valor).
- Share price sobe à medida que juros entram → cotistas antigos lucram sem precisar "distribuir" manualmente.

### Share math (LP-like, tipo Uniswap v2 liquidity)
```
Primeiro deposit:  shares = amount                            (1:1 bootstrap)
Depois:            shares = amount * total_shares / total_assets   (round down)
Withdraw:          amount_out = shares * total_assets / total_shares  (round down)
```

### Partial repay — rounding drift safety
Parcelas quebram `principal/repayment` em razão não-inteira → divisão inteira acumula erro.
**Solução implementada**: na ÚLTIMA parcela (quando `new_total_repaid == repayment`), libera todo o saldo restante explicitamente: `principal_part = principal - prior_principal_released`. Fecha `total_deployed = 0` exatamente.

---

## Autorização por instruction

| Instruction | Quem assina | Por quê |
|---|---|---|
| `initialize_vault` | admin | Singleton config |
| `register_receivable` | agency (imobiliária) | Só quem tem contrato on-file pode cadastrar |
| `deposit` | investor | Dono do BRZ de origem |
| `fund_landlord` | agency | Mesma imobiliária que registrou libera o advance |
| `repay` | repayer (qualquer um) | Tenant, agência, script admin — dono do ATA de origem |
| `withdraw` | investor | Dono da position |

---

## Bugs que dei durante CP1 (pra não repetir)

1. **Anchor 1.0 `CpiContext::new`** — recebe `Pubkey`, não `AccountInfo`. Usa `token_program.key()` no primeiro arg.
2. **`#[derive(Debug)]`** — qualquer enum usado em `msg!("{:?}")` precisa dele.
3. **Borrow checker vault mut + `to_account_info()`** — captura o `AccountInfo` ANTES do `&mut ctx.accounts.vault`.
4. **`spl_associated_token_account::ID`** — virou `::program::ID` no anchor-spl 1.0.1.
5. **`AlreadyProcessed` em testes LiteSVM** — chamar `svm.expire_blockhash()` entre txs idênticas.
6. **Glob re-exports `pub use deposit::*` etc** — NECESSÁRIO (macro `#[program]` precisa dos `__client_accounts_*` no crate root). O warning "ambiguous glob re-exports for `handler`" é harmless, ignorar.

---

## Decisões de produto feitas nesta sessão

- **Partial repay implementado** (parcelas mensais). Use-case real: Selectimob repassa aluguel mensalmente, não full repay no fim.
- **Slippage protection NÃO implementado** — diferido pra v2 (ver `ROADMAP.md`). MVP scale não precisa.
- **Fluxo de signers "como em prod"** — agency assina register/fund, investor assina deposit/withdraw, qualquer um assina repay. Sem shortcuts.
- **Admin script pra seed de demo** será necessário em CP3 pra dar BRZ fake ao investor/agency no devnet.

---

## Toolchain (não mudar sem discussão)

| Tool | Versão |
|---|---|
| Rust | 1.95.0 |
| Agave (Solana CLI) | 3.1.14 |
| Anchor | 1.0.1 |
| Node | 20.20.2 |
| pnpm | 10.33.1 |

Rodar anchor/cargo SEMPRE via WSL (`wsl -e bash -lc "cd /mnt/c/Users/Ramos/Desktop/brix && ..."`). Git Bash Windows não tem anchor no PATH.

Build time: ~5min em `/mnt/c/` (aceito; não migrar pra ext4 nativo).

---

## Próximo checkpoint: CP2 (frontend)

**Objetivo**: Next.js App Router com Privy login + páginas clicáveis conectadas ao program devnet.

**Skill primária**: `build-with-claude` + `frontend-design-guidelines`

### O que falta (de `CHECKPOINTS.md`)
- [ ] Privy Provider montado no layout (App ID `cmoa0jx8500v30cl78buc8dop` já em `.env.local.example`)
- [ ] Landing page (hero + CTA login)
- [ ] Rota `/landlord` — listagem de recebíveis (mock Selectimob JSON) + botão "Antecipar" que chama `register_receivable` + `fund_landlord`
- [ ] Rota `/invest` — vault stats (TVL, APR) + deposit/withdraw
- [ ] Tx links pro Solana Explorer devnet
- [ ] Toasts de sucesso/erro

### O que Arthur precisa fazer antes de CP2
1. Abrir nova sessão Claude Code na raiz do repo
2. Colar: "lê `.agents/CONTEXT_DUMP_2026-04-22.md`, depois `.agents/AGENT_BRAIN.md`, `CHECKPOINTS.md` e `brix.md`. Depois invoca a skill `build-with-claude` pra começar CP2. Eu sou estagiário fullstack, explica conceitos Solana/Anchor em analogias web2 quando aparecerem."
3. Checar `.env.local` tá preenchido com `NEXT_PUBLIC_SOLANA_RPC_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_BRIX_PROGRAM_ID=6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94`.

### Blockers conhecidos
- BRZ mainnet mint não existe em devnet → precisará criar **test mint** no devnet e mintar BRZ fake pros wallets de teste (já feito no teste LiteSVM, replicar em `scripts/seed-demo.ts`).
- Helius free tier tem rate limit — se bater, fallback `https://api.devnet.solana.com`.

---

## Contexto pessoal do Arthur (pra nova sessão lembrar)

- **Estagiário fullstack** — sabe web2 bem (React/Next/TS/backend), Solana/Rust junior. Explicar conceitos on-chain em analogia web2.
- **Modo gerente**: Arthur delega housekeeping (checkpoints, context files, memória). Só surface decisions e blockers.
- **Toda ideia deferida** → `ROADMAP.md` com tier (v2/v3/eventually) + por quê diferido + quando subir prioridade. Nada se perde.
- **Timeline**: Colosseum Frontier submission **11 mai 2026**. Hoje 2026-04-22. Faltam ~19 dias.
- **Escopo único**: Colosseum Frontier. Base Batches FORA. Agentic Engineering Grant JÁ conquistado.

---

## Como verificar que tudo tá são na nova sessão

```bash
# 1. Git
cd brix
git pull --rebase origin main
git log --oneline -3     # deve mostrar a4a14c2 no topo
git tag | grep cp1-done  # deve retornar cp1-done

# 2. Build still works
wsl -e bash -lc "cd /mnt/c/Users/Ramos/Desktop/brix && anchor build 2>&1 | tail -5"
# esperado: "Finished `release` profile ... target(s) in Xs"

# 3. Program ainda em devnet
wsl -e bash -lc "solana program show 6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94 --url devnet"
# esperado: Authority EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs
```

Se algum dos 3 falhar → investigar antes de começar CP2.
