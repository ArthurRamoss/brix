# Brix

> **Rental receivables lending on Solana** — Brazil-first, insurance-backed, immutable rate.
> Colosseum Frontier submission target: **2026-05-11**.

- **Pitch/produto**: [`brix.md`](./brix.md)
- **Estado atual**: [`CHECKPOINTS.md`](./CHECKPOINTS.md)
- **Cérebro do agente AI**: [`.agents/AGENT_BRAIN.md`](./.agents/AGENT_BRAIN.md)
- **Research**: [`research/deep-dive-brix-2026-04-18.md`](./research/deep-dive-brix-2026-04-18.md)

---

## Quickstart (cross-PC)

Arthur desenvolve de PCs diferentes. Este bloco é replicável em qualquer máquina.

### 1. Requisitos

- **WSL2 Ubuntu** (Windows) OU Ubuntu/macOS nativo
- Git

### 2. Toolchain (dentro do WSL/Linux)

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Solana CLI (1.18.x stable)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Anchor via avm
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1
avm use 0.30.1

# Node + pnpm (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
npm i -g pnpm

# Verificar
anchor --version && solana --version && node -v && pnpm -v
```

### 3. Wallet devnet

```bash
solana-keygen new                    # SALVE o seed phrase num gerenciador seguro
solana config set --url devnet
solana airdrop 5
solana balance
```

### 4. Clonar + env

```bash
git clone https://github.com/ArthurRamoss/brix.git
cd brix
cp .env.local.example .env.local
# preencher: HELIUS_API_KEY, PRIVY_APP_ID, COLOSSEUM_COPILOT_PAT
pnpm install
```

### 5. Rodar

```bash
# Smart contract (quando existir após scaffold)
anchor build
anchor test

# Frontend
pnpm dev
```

---

## Workflow (trunk-based)

```bash
# Início de sessão
git pull --rebase origin main
pnpm install
cat CHECKPOINTS.md

# Fim de sessão (obrigatório)
# 1) editar CHECKPOINTS.md com "próximo: X"
git add -A
git commit -m "wip(cp1): <o que fez> - next: <o que falta>"
git push origin main
```

**Nunca** encerrar sessão com código descommitado.
**Nunca** commitar `.env.local` ou keypairs.

---

## Estrutura do repo (após scaffold-project)

```
brix/
├── brix.md                              # Pitch e contexto de produto
├── CHECKPOINTS.md                       # Tracking de progresso por checkpoint
├── README.md                            # Este arquivo
├── .env.local.example                   # Template de env vars
├── .agents/
│   ├── AGENT_BRAIN.md                   # Cérebro do agente AI
│   ├── SKILL_ROUTER.md                  # Roteador de skills
│   ├── tone-guide.md
│   ├── data/                            # Knowledge bases (solana, defi, colosseum)
│   └── skills/                          # Skills instaladas
├── research/
│   ├── deep-dive-brix-2026-04-18.md
│   ├── copilot-deep-dive-2026-04-18/    # 18 JSON de research
│   └── archive-2026-04-14/              # Research anterior
├── programs/brix/                       # (será criado pelo scaffold) Anchor program
├── app/ ou src/                         # (será criado pelo scaffold) Next.js frontend
├── tests/                               # (será criado pelo scaffold) Anchor tests
└── scripts/                             # Scripts de demo/admin
```

---

## Stack

Ver [`.agents/AGENT_BRAIN.md` §4](./.agents/AGENT_BRAIN.md) para a lista canônica.

Resumo: **Anchor 0.30.x** (Rust) · **Next.js 14** App Router · **Privy** (auth) · **Helius** (RPC) · **BRZ** (stablecoin nativo Solana) · **pnpm**.

---

## Links rápidos

- Privy dashboard: https://dashboard.privy.io
- Helius dashboard: https://dashboard.helius.dev
- Colosseum Copilot: https://copilot.colosseum.com
- Solana Explorer devnet: https://explorer.solana.com/?cluster=devnet
- Solscan devnet: https://solscan.io/?cluster=devnet
- Anchor docs: https://www.anchor-lang.com
