# Local Dev — leia antes de mexer

## Onde você está

Esse é um **worktree** do brix:

```
C:\Users\Ramos\Desktop\brix\.claude\worktrees\upbeat-dirac-3901d7
```

A main do repo fica em `C:\Users\Ramos\Desktop\brix`. **Worktree e main compartilham `.git` mas têm árvores de arquivo separadas** — `node_modules`, `.env.local`, etc, são independentes em cada worktree.

Se você está em outra sessão e está num path diferente, confira:
```bash
pwd
git status   # mostra branch (claude/upbeat-dirac-3901d7 nesse worktree)
```

## Topologia do repo

É um **pnpm workspace** com um único package:

```
brix/                    # root, packageManager: pnpm@10.33.1, node >= 20
├── app/                 # next.js 16.2.4 (turbopack) — o frontend
├── programs/brix/       # anchor program (rust, solana)
├── scripts/             # seed-demo.ts, appwrite-bootstrap.ts
├── pnpm-workspace.yaml  # packages: ['app']
└── package.json         # tem scripts root (app:dev, demo:seed, ...)
```

O `app/.env.local` é o que importa pro frontend. Programa solana já está deployed em devnet, não precisa redeploy.

## Como rodar (do root do worktree)

```bash
# 1. Instalar (se node_modules não existe)
pnpm install

# 2. Subir dev server (alias filtra pro package 'app')
pnpm app:dev
```

Ou direto no `app/`:
```bash
cd app
pnpm dev
```

Servidor sobe em `http://localhost:3000`.

**Não use `npm` ou `yarn`.** Workspace é pnpm-only.

## Env vars necessárias (em `app/.env.local`)

Já está populado nesse worktree. Se for cópia limpa, precisa setar:

```
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=...
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_PRIVY_APP_ID=...                           # ver memória project_brix_credentials
NEXT_PUBLIC_BRIX_PROGRAM_ID=6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94
NEXT_PUBLIC_BRZ_MINT=12fpfju1pfJEVkNqiucWqiUpmZzCjPgDCARRFvK2M6A7
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=699dc0fd002b40801226
NEXT_PUBLIC_APPWRITE_DATABASE_ID=...
APPWRITE_API_KEY=standard_...                          # SERVER ONLY, nunca prefixar NEXT_PUBLIC
```

**Nota Helius**: a RPC URL inclui `?api-key=` na própria URL. Se trocar de key, atualizar `NEXT_PUBLIC_SOLANA_RPC_URL` inteiro (não tem env separada pra key).

## Toolchain

```
Node     >= 20.20.2
pnpm     10.33.1
Rust     1.95
Anchor   1.0.1   (1.x line — não a velha 0.30)
Agave    3.1.14  (Solana foi renomeado pra Agave)
```

Ver memória `project_brix_toolchain_versions.md` se precisar reinstalar.

## Comandos úteis

```bash
# Frontend
pnpm app:dev                # next dev (porta 3000)
pnpm app:build              # next build

# Programa solana
pnpm program:build          # anchor build
pnpm program:test           # anchor test (devnet)

# Bootstraps
pnpm appwrite:bootstrap     # cria/atualiza tables no appwrite
pnpm demo:seed              # seed contrato demo on-chain (raramente usado, fluxo real é via UI)

# Backfill (depois q dev server estiver up)
curl -X POST http://localhost:3000/api/admin/backfill \
  -H "Content-Type: application/json" \
  -d '{"pubkey":"6nqHUjFF1vPctYxUF86mmwMDGpHAfBM7mzm37SbJcCqc","email":"arthurbuzz@gmail.com","limit":200}'

# Lint
pnpm lint                   # prettier check
pnpm lint:fix               # prettier write
```

## Troubleshooting

- **"command not found: pnpm"** → corepack enable, ou instalar global com `npm i -g pnpm@10.33.1`
- **Privy CSP / "frame-ancestors"** → garantir que `next.config.ts` permite `https://auth.privy.io`. Já configurado.
- **RPC 429** → trocar Helius key, ou esperar 30s. Cache de 20s no `cached()` mitiga mas não elimina.
- **"Account already in use"** ao registrar contrato → contractId colidiu. Os IDs novos têm sufixo random `-XXXX` então isso só acontece em retry imediato; aguardar 1s.
- **Hidratação warning** → cache lê localStorage; SSR não tem. `useState(null) + useEffect` hidrata. Não trocar pra `useState(read())`.
- **Vault InsufficientLiquidity** → vault está sem BRZ. Deposite via UI logado como investor (`/invest?tab=deposit`).

## Arquivos-chave (mapa mental)

```
app/src/
├── app/
│   ├── invest/page.tsx           # vault dashboard, deposit/withdraw, positions
│   ├── agency/page.tsx           # CRM clients + portfolio + register + repay
│   ├── landlord/page.tsx         # landlord overview + simulate (em rework)
│   ├── login/page.tsx            # privy + persona lock (1 email = 1 persona)
│   └── api/                      # appwrite proxy routes (server-only credentials)
│       ├── admin/backfill/       # populates vault_events from on-chain
│       ├── agency/{clients,properties,contracts,applications}/
│       └── vault-events/
├── components/
│   ├── primitives/
│   │   ├── TVLChart.tsx          # SVG chart + projection (em polish, ver HANDOFF.md)
│   │   ├── RecentEvents.tsx      # reusable feed (compact + full modes)
│   │   ├── ContractSteps.tsx     # 4-step visual progress
│   │   └── ...
│   └── shell/AppShell.tsx        # layout + tabs + wallet pill
├── hooks/
│   ├── use-brix.ts               # vault + position + deposit/withdraw (anchor wiring)
│   └── use-agency.ts             # register + fund + repay
├── lib/
│   ├── cache.ts                  # 2-level cache (mem + localStorage)
│   ├── i18n.tsx                  # PT canonical + EN — 1300+ linhas, gigante
│   ├── agency-clients.ts         # fetch wrappers que batem em /api/agency/*
│   ├── brix-fees.ts              # BRIX_PROTOCOL_FEE_BPS = 200
│   └── server/appwrite.ts        # server SDK (NEVER importar do client)
└── ...
```

## O que NÃO mexer sem entender

- `app/src/lib/cache.ts` — serializer custom de BigInt + PublicKey é frágil
- `app/src/hooks/use-brix.ts` — useRef pattern previne loop infinito com Privy `signTransaction`
- `app/AGENTS.md` — avisa que esse Next é não-padrão (16.2.4 turbopack); ler `node_modules/next/dist/docs/` antes de tocar route handlers ou file conventions

## Status

- Branch: `claude/upbeat-dirac-3901d7` (configurada pra trackear `origin/main`, `git push origin HEAD:main` empurra direto)
- Última main: `94ea39b feat: appwrite backend + tvl projection + protocol fee`
- Pendências: ver `HANDOFF.md` (TVL chart polish + backfill).
