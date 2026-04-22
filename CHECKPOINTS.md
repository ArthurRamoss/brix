# Brix — Checkpoints

> **Regra**: este arquivo é o estado do projeto. Abra toda sessão. Atualize toda sessão.
> Tag cada conclusão com `git tag cpN-done` para bookmarks rápidos.

**Hoje**: 2026-04-22 · **Submission Frontier**: 2026-05-11 · **Solo founder**.

> **Ideias/features pós-MVP** → `ROADMAP.md`. Nada fora-de-escopo se perde.

---

## Precondição 0 — Toolchain ✅ CONCLUÍDO (22 abr)

Versões validadas em WSL2 Ubuntu 24.04 (user `ramos`):

| Tool | Versão | Notas |
|---|---|---|
| Rust | 1.95.0 | via rustup, profile minimal |
| Solana CLI | **3.1.14 (Agave)** | via `release.anza.xyz/stable/install` — Solana virou Agave/Anza; numeração resetou (ex-Solana 1.18.x agora é Agave 3.x) |
| Anchor | **1.0.1** | via `avm install latest` — Anchor jumped 0.31→1.0 |
| Node | 20.20.2 | via nvm (default alias) |
| pnpm | 10.33.1 | via corepack |
| protobuf-compiler | apt | necessário pra alguns deps do Anchor |

**Keypair devnet**: `EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs` — seed phrase salva pelo Arthur (gerenciador seguro).
**Validação**: `anchor init` + `anchor build` produziu `.so` + IDL com sucesso.

### Pendências não-bloqueantes
- [ ] Airdrop devnet (faucet rate-limited hoje; pegar 2 SOL em https://faucet.solana.com/ quando necessário)
- [x] Conta Helius criada, API key em `.env.local` (free tier, validada com `getHealth` → ok)
- [x] Conta Privy criada — App ID `cmoa0jx8500v30cl78buc8dop`
- [ ] Commit tag: `precond0-done`

---

## Precondição 1 — Arquivos de contexto ✅ CONCLUÍDO (22 abr)

- [x] `brix.md` reescrito (Apr 18)
- [x] `research/deep-dive-brix-2026-04-18.md` criado
- [x] `.agents/AGENT_BRAIN.md` criado + atualizado com versões reais (22 abr)
- [x] `CHECKPOINTS.md` (este) criado + atualizado (22 abr)
- [x] `README.md` root criado + atualizado com toolchain correto (22 abr)
- [x] `.env.local.example` criado (Helius, Privy, Colosseum Copilot, Brix program ID, BRZ mint)
- [x] `.gitignore` completo (env, keypairs, target/, .anchor/, node_modules/, build artifacts)
- [ ] Commit tag: `precond1-done`

---

## CHECKPOINT 1 — Anchor Core (Sem 1: 18–27 abr)

**Objetivo**: programa Anchor funcional em devnet com escrow + vault único + taxa imutável + deposit/withdraw.

**Skill primária**: `build-defi-protocol`

### Tasks

- [x] `scaffold-project` skill executado (Anchor 1.0.1 + Next.js 16 + Tailwind 4, monorepo pnpm)
- [x] `anchor build` passa → `.so`, IDL (`target/idl/brix.json`), TS types (`target/types/brix.ts`)
- [x] `pnpm --filter app build` passa → Next build limpo em 14s
- [x] Privy + Solana SDKs instalados (`@privy-io/react-auth`, `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/spl-token`)
- [x] Program ID placeholder: `6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94` (será re-confirmado no primeiro `anchor deploy`)
- [x] `programs/brix/src/state.rs` com contas: `Vault`, `Receivable`, `InvestorPosition`, `ReceivableStatus` enum
- [x] `programs/brix/src/error.rs` com `BrixError` enum (13 variants)
- [x] `programs/brix/src/constants.rs` com seeds + `BPS_DENOMINATOR` + `CONTRACT_ID_LEN`
- [x] Instruction `initialize_vault`
- [x] Instruction `register_receivable` (agência)
- [x] Instruction `deposit` (investidor → vault, BRZ SPL, shares LP-like)
- [x] Instruction `fund_landlord` (vault → landlord, PDA-signed CPI)
- [x] Instruction `repay` (com suporte a parcelas — rounding drift absorvida pela última parcela)
- [x] Instruction `withdraw` (investidor queima shares → principal + juros pro-rata)
- [x] `cargo test` via LiteSVM passa (1 unit + 2 integration: `full_cycle_single_repay` + `partial_repay_three_installments`)
- [x] 2.5 SOL devnet disponíveis pra deploy
- [x] Deploy devnet: `anchor deploy --provider.cluster devnet` concluído
- [x] Program ID final: `6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94` (mesmo do scaffold — salvo em `Anchor.toml` `[programs.devnet]`)
- [ ] Arthur sabe explicar (próprias palavras) PDA, SPL, instruction, CPI
- [ ] Commit tag: `cp1-done`

### Just-in-time reading (quando relevante)
- Anchor Book: https://www.anchor-lang.com/ (Book + 101)
- Solana Cookbook → PDA section
- `.agents/data/solana-knowledge/` (6 partes)

### Fallback se travar
- Se `fund_landlord` ficar complexo → mover lógica pra cliente admin script, program só escreve status.
- Se repayment partial estiver dando merda → suportar só full repay no MVP.

---

## CHECKPOINT 2 — Frontend + Auth (Sem 2: 28 abr–3 mai)

**Objetivo**: Next.js com Privy + fluxos landlord e investor clicáveis conectados ao program devnet.

**Skill primária**: `build-with-claude` + `frontend-design-guidelines`

### Tasks

- [ ] Privy App ID + Helius key em `.env.local`
- [ ] Privy Provider montado no layout
- [ ] Landing page simples (hero + CTA login)
- [ ] Rota `/landlord` — listagem de recebíveis (mock Selectimob JSON)
- [ ] Botão "Antecipar" → chama `register_receivable` + `fund_landlord`
- [ ] UI mostra "✓ R$ X recebidos via PIX" após `fund_landlord` (mock)
- [ ] Rota `/invest` — vault stats (TVL, APR) + deposit form
- [ ] Botão "Depositar" → chama `deposit`
- [ ] Botão "Withdraw" → chama `withdraw`
- [ ] Tx links pro Solana Explorer devnet
- [ ] Toasts de sucesso/erro
- [ ] Deploy Vercel preview (opcional mas recomendado)
- [ ] Commit tag: `cp2-done`

### Fallback
- Se Privy der atrito → Unified Wallet Adapter (Phantom). Menos UX mas funcional.
- Se tempo apertar → cortar `/invest` flow, admin script deposita em nome do investor pra demo.

---

## CHECKPOINT 3 — Demo Data + Polish (Sem 3: 4–8 mai)

**Objetivo**: 1-3 ciclos E2E com dados Selectimob anonimizados, polish pro pitch.

**Skill primária**: `build-with-claude` + `product-review`

### Tasks

- [ ] 1-3 contratos Selectimob anonimizados em `scripts/demo-data.json`
- [ ] Script admin que popula on-chain (`scripts/seed-demo.ts`)
- [ ] Ciclo completo simulado: register → deposit → fund → repay → withdraw
- [ ] Dashboard histórico de txs com links solscan
- [ ] Polish visual (tipografia, cores, spacing, loading states)
- [ ] Marca aplicada (brand-design skill se precisar)
- [ ] README root com quickstart funcional
- [ ] Regressão: `anchor test` continua passando
- [ ] Commit tag: `cp3-done`

### Fallback
- Se polish demorar → priorizar: loading states > tipografia > cores. Mínimo demonstrável.

---

## CHECKPOINT 4 — SAGRADA: Vídeo + Submission (5–11 mai)

**Regra**: a partir do dia 5 mai nada de código novo, só bug fixes bloqueantes.

**Skills**: `create-pitch-deck`, `marketing-video`, `submit-to-hackathon`

### Tasks

- [ ] Roteiro final do pitch (3min) escrito
- [ ] Gravação screen-demo (OBS, 2-3min)
- [ ] Edição pitch video (Remotion ou CapCut/DaVinci)
- [ ] Pitch publicado (YouTube unlisted)
- [ ] Demo video publicado
- [ ] Colosseum submission preenchida: headline capital-inefficiency, tags `rwa tokenization, lending, stablecoin payments, oracle`
- [ ] Review com `submit-to-hackathon` skill
- [ ] **SUBMIT antes de 10 mai (buffer de 1 dia)**
- [ ] Commit tag: `cp4-submitted`

### Conteúdo do pitch (estrutura do brix.md seção "Pitch video")
1. Hook história da mãe (15s) — APÓS estabelecer macro
2. Capital inefficiency macro (30s) — LEAD com isso, não transparency
3. Por que quebra on-chain também (20s) — Goldfinch
4. Solução (30s) — immutable rate + seguro fiança + off-ramp
5. Demo (60s) — ciclo E2E
6. Por que Solana (10s)
7. Traction + next (15s) — Selectimob pilot

---

## Notas de sessão (append-only)

Adicionar entradas cronológicas do tipo:

```
### 2026-04-18 (Fri) — PC home
- Rodei scaffold-project → create-solana-dapp clonado
- Program compila em devnet, program ID abcd...
- PRÓXIMO: escrever register_receivable + seed discovery
```

Últimas entradas aqui embaixo (mais novas no topo):

### 2026-04-22 (qua) — PC home (sessão noite) — **CP1 CORE PROGRAM ✅ em devnet**
- `build-defi-protocol` skill executada completamente.
- Escrito: `state.rs` (Vault / Receivable / InvestorPosition / ReceivableStatus), `error.rs` (13 variants), `constants.rs` (seeds + bps), 6 instructions em módulos separados, `lib.rs` com 6 entrypoints.
- Modelo de contabilidade: `total_assets = vault_ata.amount + total_deployed`; shares LP-like `shares = amount * total_shares / total_assets` (round down); `fund_landlord` conserva total_assets; `repay` cresce total_assets pelo juros_part; withdraw queima shares pro-rata.
- **Partial repay** implementado: agência pode repassar em parcelas mensais (use-case real Selectimob). Algoritmo rounding-safe — última parcela absorve drift pra fechar `total_deployed = 0` exatamente.
- Testes LiteSVM (2) passando: `full_cycle_single_repay` valida E2E + invariants; `partial_repay_three_installments` valida que 3×3k fecha total_deployed=0.
- Bugs consertados durante CP1:
  - Anchor 1.0 mudou `CpiContext::new` pra receber `Pubkey` (via `.key()`), não `AccountInfo` — 4 call sites ajustados.
  - Borrow conflict no `fund_landlord`/`withdraw` (vault.to_account_info() depois de `&mut ctx.accounts.vault`) — capturado `AccountInfo` antes da mut borrow.
  - `spl_associated_token_account::ID` virou `::program::ID` no Anchor 1.0 / anchor-spl 1.0.1.
  - LiteSVM rejeita txs duplicadas (`AlreadyProcessed`) — usar `svm.expire_blockhash()` entre repetições de ix idênticas.
  - `ReceivableStatus` precisa de `#[derive(Debug)]` pra `msg!("{:?}")`.
- Deploy devnet: `6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94` (authority `EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs`, 2.1 SOL locked in program data).
- **PRÓXIMO**: Arthur salvar program ID em `.env.local` + commit `cp1-done` tag → CP2 (Privy Provider + landing + `/landlord` + `/invest` flows).

### 2026-04-22 (qua) — PC home (sessão tarde)
- Helius free tier ativado, API key validada via `getHealth → ok`.
- **Scaffold executado** via skill `scaffold-project`:
  - `anchor init brix-scaffold` em `/tmp` → renomeado pra `brix` → merge no repo root.
  - `create-next-app` em `app/` (Next 16.2.4, React 19, Tailwind 4, TS, App Router, `src/` layout, pnpm).
  - Instalados `@privy-io/react-auth`, `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/spl-token`.
  - Workspace pnpm unificado no root (`pnpm-workspace.yaml` → `['app']`).
  - `package.json` root com scripts `program:build`, `program:test`, `app:dev`, `app:build`.
- **Validação E2E**: `anchor build` OK (4m31s em /mnt/c) → `.so` + IDL + TS types. `pnpm --filter app build` OK (14s).
- Program ID scaffold: `6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94` (substituído no primeiro deploy real).
- Escrito `.superstack/build-context.md` como handoff pro `build-defi-protocol` skill.
- ⚠️ **Nota de performance**: repo em `/mnt/c/` → anchor builds ~5x mais lentos que em ext4 nativo. Aceito no MVP; migrar pra `~/brix/` só se for bloqueante.
- **PRÓXIMO**: Arthur pega 2 SOL devnet via web faucet → skill `build-defi-protocol` escreve state.rs + instructions de CP1.

### 2026-04-22 (qua) — PC home (sessão manhã)
- **Toolchain resolvido**: WSL2 Ubuntu 24.04 instalado; BIOS virtualization habilitada. Rust 1.95.0, Agave 3.1.14, Anchor 1.0.1, Node 20.20.2, pnpm 10.33.1.
- Anchor jumped 0.30→1.x (ecossistema) — todas as refs de versão atualizadas em `README.md`, `AGENT_BRAIN.md`, `CHECKPOINTS.md`.
- Keypair devnet: `EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs`. Airdrop caiu em rate limit; usar web faucet depois.
- Privy App ID criado: `cmoa0jx8500v30cl78buc8dop` (salvo na memória persistente).
- Scripts de setup reutilizáveis em `.agents/setup-*.sh`.

### 2026-04-18 (sáb) — PC home
- Deep dive Copilot Apr 18 concluído (18 JSON em `research/copilot-deep-dive-2026-04-18/`)
- `brix.md` reescrito com winning frame (capital inefficiency, RWA lending, BRZ, não BRLA)
- Arquivos-cérebro criados: `.agents/AGENT_BRAIN.md`, `CHECKPOINTS.md` (este), `README.md`, `.env.local.example`, `.gitignore` ampliado
- **Blocker WSL**: VM Platform não habilitado, BIOS virtualization provavelmente off. Instruções na Precondição 0 acima.
- PRÓXIMO: Arthur resolve VM Platform + BIOS virtualization → volta aqui → `scaffold-project` → CP1
