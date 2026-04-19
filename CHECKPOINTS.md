# Brix — Checkpoints

> **Regra**: este arquivo é o estado do projeto. Abra toda sessão. Atualize toda sessão.
> Tag cada conclusão com `git tag cpN-done` para bookmarks rápidos.

**Hoje**: 2026-04-18 · **Submission Frontier**: 2026-05-11 · **Solo founder**.

---

## Precondição 0 — Toolchain

> **🚧 BLOCKER ATUAL (18 abr)**: WSL está instalado mas **sem distro Linux**. Tentativa de `wsl --install -d Ubuntu` falhou porque **Virtual Machine Platform não está habilitado** (e possivelmente virtualização BIOS off).
>
> **O que Arthur precisa fazer offline**:
> 1. Abrir PowerShell como Admin e rodar:
>    ```powershell
>    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
>    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
>    ```
> 2. Reiniciar o PC.
> 3. Entrar no BIOS/UEFI (F2/Del/F10 no boot — depende da marca). Procurar `Intel VT-x`, `AMD-V`, ou `Virtualization Technology`. Habilitar. Salvar e sair.
> 4. Rodar `wsl --install -d Ubuntu` (sem admin). Quando abrir pela primeira vez, criar user (pode ser `arthur`) e senha.
> 5. Voltar aqui pra Claude retomar o setup.
>
> Após resolvido, rodar:
> ```bash
> wsl -d Ubuntu
> # dentro do Ubuntu, seguir o README.md seção "Toolchain"
> ```

- [ ] VM Platform habilitado + BIOS virtualization on (resolver offline)
- [ ] WSL2 Ubuntu instalado (`wsl -l -v` mostra Ubuntu v2)
- [ ] Rust instalado (`rustup`, stable)
- [ ] Solana CLI instalado (1.18.x)
- [ ] Anchor instalado via `avm` (0.30.x)
- [ ] Node.js 20+ via `nvm`
- [ ] pnpm instalado
- [ ] `solana-keygen new` rodado, seed phrase salvo em gerenciador seguro
- [ ] `solana config set --url devnet` feito
- [ ] `solana airdrop 5` retornou SOL
- [ ] Conta Helius criada, API key em `.env.local`
- [ ] Conta Privy criada, App ID em `.env.local`
- [ ] `anchor init test-tmp && cd test-tmp && anchor build` passa
- [ ] Commit tag: `precond0-done`

**Próximo se isso travar**: docs do anchor.com, helius.dev, privy.io. Canal #solana-dev no Discord Solana.

---

## Precondição 1 — Arquivos de contexto

- [x] `brix.md` reescrito (Apr 18)
- [x] `research/deep-dive-brix-2026-04-18.md` criado
- [x] `.agents/AGENT_BRAIN.md` criado
- [x] `CHECKPOINTS.md` (este) criado
- [ ] `README.md` root criado
- [ ] `.env.local.example` criado
- [ ] `.gitignore` ampliado (`target/`, `.anchor/`, keypairs, `node_modules/`)
- [ ] Commit tag: `precond1-done`

---

## CHECKPOINT 1 — Anchor Core (Sem 1: 18–27 abr)

**Objetivo**: programa Anchor funcional em devnet com escrow + vault único + taxa imutável + deposit/withdraw.

**Skill primária**: `build-defi-protocol`

### Tasks

- [ ] `scaffold-project` executado → workspace `create-solana-dapp` clonado
- [ ] Repo inicial ajustado (pasta renomeada, branch main, primeiro commit)
- [ ] `programs/brix/src/lib.rs` com estrutura inicial (`#[program]`, `#[account]`)
- [ ] Contas definidas: `Vault` (PDA), `Receivable` (PDA por contract_id)
- [ ] Instruction `initialize_vault` implementada + teste
- [ ] Instruction `register_receivable` (agência) implementada + teste
- [ ] Instruction `deposit` (investidor → vault) implementada + teste
- [ ] Instruction `fund_landlord` (vault → landlord) implementada + teste
- [ ] Instruction `repay` (tenant/agência → vault) implementada + teste
- [ ] Instruction `withdraw` (investidor saca principal + juros) implementada + teste
- [ ] `anchor test` passa com >= 6 testes
- [ ] Deploy devnet: `anchor deploy --provider.cluster devnet`
- [ ] Program ID salvo em `Anchor.toml` e `.env.local`
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

### 2026-04-18 (sáb) — PC home
- Deep dive Copilot Apr 18 concluído (18 JSON em `research/copilot-deep-dive-2026-04-18/`)
- `brix.md` reescrito com winning frame (capital inefficiency, RWA lending, BRZ, não BRLA)
- Arquivos-cérebro criados: `.agents/AGENT_BRAIN.md`, `CHECKPOINTS.md` (este), `README.md`, `.env.local.example`, `.gitignore` ampliado
- **Blocker WSL**: VM Platform não habilitado, BIOS virtualization provavelmente off. Instruções na Precondição 0 acima.
- PRÓXIMO: Arthur resolve VM Platform + BIOS virtualization → volta aqui → `scaffold-project` → CP1
