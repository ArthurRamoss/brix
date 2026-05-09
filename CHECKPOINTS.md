# Brix — Checkpoints

> **Regra**: este arquivo é o estado do projeto. Abra toda sessão. Atualize toda sessão.
> Tag cada conclusão com `git tag cpN-done` para bookmarks rápidos.

**Hoje**: 2026-05-05 · **Submission Frontier**: 2026-05-11 (6 dias) · **Solo founder**.

> ⚠️ **Semana 4 começou** (5–11 mai = SAGRADA: vídeo + submission). A regra do AGENT_BRAIN
> é "só bug fixes bloqueantes". CP3 ainda tem trabalho residual (rodar seed-demo, gravar
> ciclo E2E, README quickstart) — fazer o mínimo absoluto e migrar pra CP4.

> **Ideias/features pós-MVP** → `ROADMAP.md`. Nada fora-de-escopo se perde.

---

## Precondição 0 — Toolchain ✅ CONCLUÍDO (22 abr)

Versões validadas em WSL2 Ubuntu 24.04 (user `ramos`):

| Tool              | Versão             | Notas                                                                                                                   |
| ----------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Rust              | 1.95.0             | via rustup, profile minimal                                                                                             |
| Solana CLI        | **3.1.14 (Agave)** | via `release.anza.xyz/stable/install` — Solana virou Agave/Anza; numeração resetou (ex-Solana 1.18.x agora é Agave 3.x) |
| Anchor            | **1.0.1**          | via `avm install latest` — Anchor jumped 0.31→1.0                                                                       |
| Node              | 20.20.2            | via nvm (default alias)                                                                                                 |
| pnpm              | 10.33.1            | via corepack                                                                                                            |
| protobuf-compiler | apt                | necessário pra alguns deps do Anchor                                                                                    |

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

- [x] Privy App ID + Helius key em `.env.local` (Helius já configurado; Privy App ID `cmoa0jx8500v30cl78buc8dop` em `.env.local`)
- [x] Privy Provider montado no layout (`app/src/providers/privy-provider.tsx`, Privy v3 API)
- [x] Landing page simples (hero + CTA login) (`app/src/app/page.tsx`)
- [x] Rota `/landlord` — listagem de recebíveis (mock Selectimob JSON em `app/src/lib/mock-data.ts`)
- [x] Botão "Antecipar" → chama `register_receivable` + `fund_landlord` (wired; sign placeholder até seed-demo)
- [x] UI mostra "✓ R$ X recebidos via PIX" após `fund_landlord` (mock com fallback visual)
- [x] Rota `/invest` — vault stats (TVL, APR) + deposit form
- [x] Botão "Depositar" → chama `deposit` (wired ao program via useBrix hook)
- [x] Botão "Withdraw" → chama `withdraw` (wired ao program via useBrix hook)
- [x] Tx links pro Solana Explorer devnet (em todos os toasts de sucesso)
- [x] Toasts de sucesso/erro (sonner)
- [x] **Sign real com Privy embedded Solana wallet** — wired em `use-brix.ts` + `use-agency.ts` via `useSignTransaction` do `@privy-io/react-auth/solana` (commit d3ffe82)
- [x] **Persona system** (commit d3ffe82): `/login` com seleção landlord/invest/agency, `app/src/lib/persona.ts` + `getPersona()` em todas as rotas privadas
- [x] **Rotas públicas** `/pub/{landlord,invest,agency}` (showcase pre-login)
- [x] **i18n PT/EN** completo (`app/src/lib/i18n.tsx`, 914 linhas) + `LangSwitch`
- [x] **Brand + design system** (commit d3ffe82): Logo, Wordmark, Icons, Card/Field/KPI/Pill/TVLChart primitives, AppShell + nav/footer
- [ ] Deploy Vercel preview — **pendente: Arthur faz `vercel deploy` da branch main**
- [ ] Commit tag: `cp2-done` (marcar quando vercel preview rodar com seed-demo aplicado)

### Fallback

- Se Privy der atrito → Unified Wallet Adapter (Phantom). Menos UX mas funcional.
- Se tempo apertar → cortar `/invest` flow, admin script deposita em nome do investor pra demo.

---

## CHECKPOINT 3 — Demo Data + Polish (Sem 3: 4–8 mai)

**Objetivo**: 1-3 ciclos E2E com dados Selectimob anonimizados, polish pro pitch.

**Skill primária**: `build-with-claude` + `product-review`

### Tasks

- [x] 1-3 contratos Selectimob anonimizados em `scripts/demo-data.json` (3 contratos: SEL-2026-001/002/003)
- [x] Script admin que popula on-chain (`scripts/seed-demo.ts`) — cria mint BRZ devnet, init vault, mint demo BRZ pra wallet de teste
- [x] Polish visual (tipografia, cores, spacing, loading states) — primitives + shell aplicados em todas as rotas
- [x] Marca aplicada — Logo/Wordmark/Icons portados do protótipo (commit d3ffe82)
- [x] **Build defensivo** — `brix-program.ts` não crasha mais com `NEXT_PUBLIC_BRZ_MINT` placeholder/inválido (commit pendente, sessão 5 mai)
- [ ] **Rodar `pnpm demo:seed -- --demo-wallet <pubkey>` em devnet** — popular vault + mintar BRZ pra demo wallet
- [ ] Atualizar `app/.env.local` e `.env.local` root com `NEXT_PUBLIC_BRZ_MINT` gerado
- [ ] **Validar ciclo E2E em browser**: login → invest → deposit → agency → register/fund → repay → invest withdraw (golden path da gravação)
- [ ] Dashboard histórico de txs com links solscan — **deferido pra v2 se apertar**, basta os toasts de tx atual
- [ ] README root com quickstart funcional — em progresso (sessão 5 mai)
- [ ] Regressão: `anchor test` continua passando — **última verificação foi CP1 (22 abr); precisa rerun antes do submit**
- [ ] Commit tag: `cp3-done`

### Decisões pendentes (CP3 → CP4)

- **Demo wallet única vs split**: hoje `register/fund` usa `landlord ?? anchorWallet.publicKey`. Pra demo de 3min, **uma wallet única faz tudo** (login persona invest → deposit; logout → login persona agency → register/fund/repay; volta pra invest → withdraw). Split com `NEXT_PUBLIC_DEMO_LANDLORD_WALLET` só se a narrativa do vídeo precisar — não é blocker.

### Fallback

- Se polish demorar → priorizar: loading states > tipografia > cores. Mínimo demonstrável.
- Se Privy embedded Solana sign der atrito → admin script local roda o ciclo, gravamos a UI mostrando o resultado on-chain (Solana Explorer aberto).

---

## CHECKPOINT 4 — SAGRADA: Vídeo + Submission (5–11 mai)

**Regra**: a partir do dia 5 mai nada de código novo, só bug fixes bloqueantes.

**Skills**: `create-pitch-deck`, `marketing-video`, `submit-to-hackathon`

### Tasks

- [x] **Roteiro draft do pitch (3min)** — `pitch-script.md` na raiz (sessão 5 mai). EN principal + opção PT-BR pra hook. Inclui checklist técnico pré-gravação.
- [ ] Roteiro final revisado (após Arthur ler em voz alta + cronometrar)
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

### 2026-05-08 (sex) — worktree `upbeat-dirac-3901d7` — **dia 4 SAGRADA · 3 dias pro Frontier**

Sessão de continuidade: vim do PC Windows (Git Bash + WSL Ubuntu juntos no mesmo PC).
Working dir: `/c/Users/Ramos/Desktop/brix/.claude/worktrees/upbeat-dirac-3901d7`.
Branch: `claude/upbeat-dirac-3901d7` · 2 commits à frente do que o handoff anterior descrevia (`c1c199c`, `f80cc75` — polish Selectimob brand na landing).

**Mudanças aplicadas nesta sessão (3 arquivos, ainda não commitadas)**:

- [app/src/app/layout.tsx](app/src/app/layout.tsx): `<body suppressHydrationWarning>` — silencia warnings causados por extensões (Bitdefender `bis_*`, Grammarly `__processed_*`) injetando atributos no DOM antes do React hidratar. Fix recomendado pelo Next docs pra esse caso, não esconde bugs reais.
- [app/src/lib/persona.ts](app/src/lib/persona.ts): adicionou `getEmailPersona()` + `setEmailPersona()` usando key `brix_user_persona::<email>` (separada de `brix_persona`). Header explica dual-key (session vs lock).
- [app/src/app/login/page.tsx](app/src/app/login/page.tsx): useEffect de auto-routing agora tem 3 caminhos: (1) email é cliente → /landlord (já existia), (2) **email já tem persona registrada → reusa** (novo), (3) fallback → picker. `onChoose` salva mapping email→persona pra travar futuras escolhas. Implementa "1 email = 1 persona": uma vez que o email escolheu agency/invest, não pode trocar nos próximos logins.

**Estado de ambiente confirmado**:

- WSL Ubuntu ativo neste PC: solana-cli 3.1.14 (Agave), anchor-cli 1.0.1, keypair admin `EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs` em `/home/ramos/.config/solana/id.json`. Saldo devnet **0.392 SOL** (suficiente).
- Plano descoberto: rodar comandos do Windows Git Bash usando `--admin-keypair "//wsl.localhost/Ubuntu/home/ramos/.config/solana/id.json"` (UNC path lê o keypair do WSL sem copiar).
- `pnpm install` rodado no Windows (5m20s, 945 packages, peer deps OK com warnings benignos sobre swc/sharp/keccak ignored build scripts).
- `pnpm app:dev` em background (Next.js 16.2.4 + Turbopack, ready em 8.1s, http://localhost:3000). Hot reload pegou as 3 edições.
- `.env.local` (worktree) copiado do main repo + bloco APPWRITE adicionado.
- `app/.env.local` (worktree) criado espelhando NEXT_PUBLIC_* da raiz.

**Bloqueios atuais (pendentes pra próxima sessão)**:

1. **Privy embedded Solana wallet não criada** pra `arthuur.ramoss@gmail.com`. Causa diagnosticada: o CSP `frame-ancestors` da Privy ainda lista só `brixprotocol.com` + `auth.privy.io`, **não inclui localhost:3000**. O iframe que a Privy usa pra inicializar a embedded wallet é bloqueado, e `createOnLogin: "all-users"` (já configurado em [privy-provider.tsx:47](app/src/providers/privy-provider.tsx:47)) falha silenciosamente. User chega em /agency, persona escolhida, tudo aparenta OK, mas `user.linkedAccounts` não tem entry com `chainType === "solana"` → badge da wallet em [AppShell.tsx:154](app/src/components/shell/AppShell.tsx:154) não renderiza.

   **Fix exato (sequência)**:
   1. https://dashboard.privy.io → app `cmoa0jx8500v30cl78buc8dop` → Settings → Domains/Allowed origins → adicionar `http://localhost:3000` (e idealmente `https://*.appwrite.network`) → save.
   2. Chrome devtools → Application → Storage → **Clear site data** (em localhost:3000).
   3. dashboard Privy → Users → procurar `arthuur.ramoss@gmail.com` → **delete** (pra forçar recriação completa).
   4. relogin no localhost (com lock email→persona já em vigor, primeira vez vai cair no picker → escolhe agency → daí frente travado).
   5. badge mono cinza tipo `ft5L…X9k` deve aparecer no header (entre PT/EN e ícone porta).

2. **Seed-demo não rodou** — depende da wallet (#1) pra ter pubkey pra `--demo-wallet`.

3. **Backend Appwrite em curso** — decisão tomada de migrar `agency-clients.ts` (hoje só localStorage) pra Appwrite Databases. Razão: localStorage isolado entre janelas/sessões impede que Maria (cliente) veja dados que a Selectimob (agency) cadastrou em outra janela. Argumento de produto: judges vão perguntar "isso é só localStorage?", queremos resposta crível. Stack consolidation: já tá usando Appwrite Sites, mesma conta + dashboard.

   - **Project ID**: `699dc0fd002b40801226` (em `.env.local` como `NEXT_PUBLIC_APPWRITE_PROJECT_ID`)
   - **Endpoint**: `https://nyc.cloud.appwrite.io/v1`
   - **API Key**: salvada em `.env.local` na raiz (worktree) como `APPWRITE_API_KEY=standard_...` — gitignored. **Rotacionar pós-bootstrap**.
   - **Plugin Claude Code Appwrite**: user adicionou via dashboard mas a sessão atual não recarregou (ToolSearch retornou zero `mcp__appwrite__*` tools). Próxima sessão: rodar `/reload-plugins` no chat pra ativar.
   - **Schema planejado** (4 collections em database `brix_main`):
     - `agency_applications`: companyName, contactName, email (unique idx), website, city, contractsUnderManagement, status (enum), appliedAt
     - `agency_clients`: name, email (unique idx), cpf, phone, pixKey, notes, agencyEmail, createdAt
     - `agency_properties`: clientId (idx), address, monthlyRentBrz, propertyType (enum), notes, createdAt
     - `agency_contracts`: clientId (idx), propertyId (idx), landlordName, propertyAddress, principalBrz, repaymentBrz, rateBps, durationDays, installmentsTotal, installmentsPaid, status (enum), hasInsurance, insurer, registerSig, fundSig, registeredAt, fundedAt
   - **Plano de implementação** (4-6h estimado):
     1. Tentar plugin Appwrite via `/reload-plugins`. Se OK, criar collections via tool calls.
     2. Senão, rodar `scripts/appwrite-bootstrap.ts` (a escrever) usando `node-appwrite` SDK + `APPWRITE_API_KEY`.
     3. Criar `app/src/lib/agency-store.ts` espelhando signatures de `agency-clients.ts` mas async.
     4. Migrar ~5 call sites: `/agency/page.tsx`, `/agency/onboard/page.tsx`, `/landlord/page.tsx`, `/login/page.tsx`, `use-agency.ts` — adicionar loading states.
     5. Apagar localStorage keys antigos (`brix_agency_*_v2`).
     6. Testar golden path E2E.

4. **Pitch-script (`pitch-script.md` seção 4) precisa update**: hoje fala em "três janelas anônimas pra simular três personas... cada uma com session Privy separada". Isso é **impossível** com a arquitetura atual (cookies Privy compartilham entre janelas anônimas da mesma sessão; isolamento total requer profiles diferentes que aí localStorage não compartilha tampouco). Solução real: **1 janela + logout entre personas** (Maria vê dados via match `getClientByEmail` no localStorage compartilhado da mesma sessão). DEPOIS do backend Appwrite, isso fica natural (dados centralizados, qualquer janela vê).

**Decisões em aberto pra próxima sessão**:

- Confirmar: vamos com "1 janela + logouts" no demo (resposta provável: sim) — atualizar pitch-script.md seção 4.
- Plugin Appwrite vs SDK Node: depende do `/reload-plugins`.

**Próximos comandos exatos (cópia direta)**:

```bash
# 1. Confirma worktree e estado
cd /c/Users/Ramos/Desktop/brix/.claude/worktrees/upbeat-dirac-3901d7
git status -sb

# 2. Confirma dev server (pode estar morto se reiniciou PC); se morto, sobe:
pnpm app:dev > /tmp/brix-dev.log 2>&1 &
# (em paralelo: tu loga no localhost depois do fix Privy)

# 3. Saldo admin devnet (deve ser ~0.39 SOL)
wsl.exe -- bash -c 'solana balance EFQuU2ii5HhG1r7nRCoMQNNA9YnSDnG2UGPvUZSG3dRs --url https://api.devnet.solana.com'

# 4. Após user logar e copiar pubkeys:
#    pubkey_invest = wallet do email_invest (persona invest)
#    pubkey_agency = wallet do email_agency (persona agency)
pnpm demo:seed -- --demo-wallet <pubkey_invest> --admin-keypair "//wsl.localhost/Ubuntu/home/ramos/.config/solana/id.json"
# segunda run reusa o mint criado, só minta BRZ pra agency wallet
pnpm demo:seed -- --demo-wallet <pubkey_agency> --admin-keypair "//wsl.localhost/Ubuntu/home/ramos/.config/solana/id.json" --skip-airdrop --mint <mint-do-1o-run>

# 5. Atualizar BRZ_MINT em 3 lugares:
#    .env.local (worktree)
#    app/.env.local (worktree)
#    .env.local (main repo /c/Users/Ramos/Desktop/brix/) — pra outras worktrees verem
#    + Appwrite Sites env vars (manualmente no console — última coisa antes de redeploy)
```

**Avisos de segurança pendentes**:

- API Key Appwrite (`standard_...`) e Helius API key estão em texto plano em `.env.local`. Pós-hackathon: rotacionar.
- Colosseum PAT também tá em `.env.local` (não usado em runtime do app — só pra research, dev-only).

### 2026-05-05 (ter) — worktree `flamboyant-kapitsa-80c31b` — **dia 1 da Semana SAGRADA**

- Sessões 4 mai trouxeram **muito mais do que o CHECKPOINTS refletia** (commits d3ffe82 + 5b38cf7):
  - Persona split real: `/login` com escolha landlord/invest/agency + `app/src/lib/persona.ts`.
  - i18n PT/EN inteiro (`app/src/lib/i18n.tsx` 914 linhas) + `LangSwitch`.
  - Rotas `/pub/{landlord,invest,agency}` (showcases pré-login).
  - Brand portado do protótipo (Logo, Wordmark, Icons).
  - Primitives: Card, Field, KPI, Pill, TVLChart.
  - Shell: AppShell, LandingNav, PublicNav, PublicFooter.
  - `use-agency.ts` hook completo (register + fund + repay) com Privy Solana sign real.
  - `scripts/demo-data.json` (3 contratos Selectimob) + `scripts/seed-demo.ts`.
- **Bug encontrado pelo codex**: `pnpm --filter app build` quebrava em `/agency` com `Non-base58 character` quando `app/.env.local` tem `NEXT_PUBLIC_BRZ_MINT` placeholder/inválido. Causa: top-level `new PublicKey(process.env...)` em `brix-program.ts`.
- **Fix aplicado nesta sessão**: `app/src/lib/brix-program.ts` agora tem `parsePubkey()` que detecta placeholder (`replace_`, `your_`, `${`) e cai pro fallback default; também faz try/catch pra base58 inválido com warning client-side. Build não quebra mais sem `.env.local` configurado.
- CP2 marcado como done de fato (sign real com Privy já estava wired desde d3ffe82).
- CP3: 5/9 tasks done; falta rodar seed-demo em devnet, validar ciclo E2E, atualizar README, regressão `anchor test`.
- **PRÓXIMO**: Arthur (1) `pnpm install` no main → (2) `pnpm --filter app build` deve passar agora → (3) `pnpm demo:seed -- --demo-wallet <pubkey-Privy>` em devnet → (4) atualiza `app/.env.local` com `NEXT_PUBLIC_BRZ_MINT` → (5) testa ciclo no browser → (6) tag `cp3-done` → CP4 (vídeo + submission).

### 2026-04-22 (qua) — PC home (sessão noite 2) — **CP2 FRONTEND ✅ build passando**

- `build-with-claude` skill executada completamente para CP2.
- Criados: `privy-provider.tsx` (Privy v3 + Buffer polyfill + Sonner), `layout.tsx` atualizado, landing page (`page.tsx`), `/landlord` page, `/invest` page, `use-brix.ts` hook, `brix-program.ts`, `connection.ts`, `mock-data.ts`.
- Bugs resolvidos durante CP2:
  - Privy v3: `useWallets()` é EVM-only; Solana wallet acessada via `user.linkedAccounts` (filter `type==="wallet" && chainType==="solana"`).
  - `@privy-io/react-auth/solana` subpath requer `@solana-program/memo` (não instalável facilmente no pnpm workspace Windows) — evitado completamente.
  - `embeddedWallets.createOnLogin` em Privy v3 precisa ser nested: `{ solana: { createOnLogin: "all-users" } }` — não top-level.
  - `solanaClusters` não existe em `PrivyClientConfig` v3 — removido.
  - `pnpm add` com permission failures no Windows — `@privy-io` resolvido com PowerShell junction.
  - BigInt literals → `tsconfig.json` `target` ES2017 → ES2020.
  - JSX em `.ts` file → substituído por strings nos `toast.description`.
  - `program.account.vault` TypeScript error → cast `(program.account as any).vault`.
  - Privy App ID prerender error (build sem `.env.local`) → guard `if (!PRIVY_APP_ID)` no Providers.
  - Next.js 16 Turbopack warning → adicionado `turbopack: {}` em `next.config.ts`.
- `pnpm --filter app build` ✅ (41s): 4 rotas estáticas geradas (/, /\_not-found, /invest, /landlord).
- Commit: `7299924 feat(cp2)`.
- **BLOCKER CP2→CP3**: sign real com Privy Solana wallet precisa do `scripts/seed-demo.ts` + BRZ devnet test mint. Hoje tudo usa placeholder `signTransaction: async (tx) => tx`.
- **PRÓXIMO**: Arthur confirma `.env.local` → `pnpm --filter app dev` → testa local → `vercel deploy` → tag `cp2-done` → CP3.

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
