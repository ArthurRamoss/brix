# Brix — Rental receivables, on-chain.

[![Live demo](https://img.shields.io/badge/Live%20demo-brixprotocol.com-FF9900?style=for-the-badge)](https://brixprotocol.com)
[![Solana devnet](https://img.shields.io/badge/Solana-devnet-9945FF?style=for-the-badge&logo=solana)](https://explorer.solana.com/address/6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94?cluster=devnet)
[![Colosseum Frontier](https://img.shields.io/badge/Colosseum-Frontier%202026-FFD700?style=for-the-badge)](https://colosseum.com/frontier)

> **An RWA lending vault on Solana for Brazilian rental receivables.**
> Immutable rate, insurance-backed, paid out in BRZ → PIX. Brazil-first; built to scale globally.

---

## TL;DR for judges

**Problem.** 13M+ Brazilian families rent. Property owners hold predictable future income but
can't access it at fair terms. Off-chain fintechs charge 36–60% APR with **bait-and-switch**
(rate changes between simulation and contract). On-chain alternatives died from defaults:
**Goldfinch collapsed $103M → $1.6M TVL. Credix is a $44M institutional USDC product, not retail.**

**Why now.** Transfero **already minted 200M BRZ on Solana** (73% of the total BRZ supply),
but Solana hosts only **42 active addresses with ~$1.1k monthly volume** — vs. **$25.65M/month
on Polygon**. The supply is there, the demand vector isn't. Brix is that vector.

**Solution.** A single transparent yield vault funded by BRZ stablecoin, lending against
rental receivables originated by partner real-estate agencies. Three structural defenses:

1. **Immutable rate** — gravada no smart contract no momento da assinatura. Bait-and-switch impossible.
2. **Seguro fiança as default shield** — ~85% of Brazilian rental contracts already carry
   tenant-default insurance; the protocol inherits that protection. This is what killed
   Goldfinch's uninsured book.
3. **Off-ramp PIX automático** via Transfero — landlord receives BRZ, sees PIX in 24h,
   never touches crypto.

**Day-one origination.** Selectimob (founding partner, family business): **700+ active rental
contracts, ~85% with seguro fiança**, zero CAC, integrated payment rail.

---

## Quick links

| | |
|---|---|
| 🌐 **Live demo** | [brixprotocol.com](https://brixprotocol.com) |
| 🎬 **Pitch video** (3 min) | [link uploaded for submission] |
| 📊 **Pitch deck** (HTML, click slides) | [`pitch-deck.html`](./pitch-deck.html) |
| 📄 **Full pitch / product brief** | [`brix.md`](./brix.md) |
| 🔗 **On-chain program** | `6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94` ([Explorer](https://explorer.solana.com/address/6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94?cluster=devnet)) |
| 🎯 **Track positioning** | Payments / Stablecoins (also fits DeFi-RWA) |
| 👤 **Builder** | [@ArthurRamoss](https://github.com/ArthurRamoss) |

---

## What's in this repo

```
programs/brix/         Anchor program (Rust): vault, deposit, withdraw,
                       register_receivable, fund_landlord, repay,
                       admin_close_receivable, admin_close_position
app/                   Next.js 16 frontend (Privy auth, Appwrite backend, BRZ on devnet)
scripts/               seed-demo.ts, reset-demo.ts, appwrite-bootstrap.ts
brix.md                Full product brief — problem, solution, competitive landscape,
                       regulatory strategy, timeline
pitch-deck.html        10-slide deck (open in browser, navigate with arrow keys)
.claude/dev/           Internal docs: dev setup, demo recording scripts, planning
.claude/research/      Background research (Colosseum Copilot, deep dive)
```

---

## Try it locally

Prereqs: Node 20+, pnpm 10+, Solana CLI (Agave), Anchor 1.x.

```bash
git clone https://github.com/ArthurRamoss/brix && cd brix
pnpm install
cp app/.env.local.example app/.env.local        # fill RPC + Privy + Appwrite keys
pnpm app:dev                                     # → http://localhost:3000
```

Detailed setup (toolchain, env vars, deploy): [`.claude/dev/LOCAL_DEV.md`](./.claude/dev/LOCAL_DEV.md).

---

## Architecture in one paragraph

The Anchor program holds a singleton `Vault` PDA that custodies BRZ. Investors call `deposit`
and receive shares (`brxV`). Agencies call `register_receivable` (writes immutable rate to
the smart contract) and `fund_landlord` (vault transfers BRZ to landlord ATA). Every month,
the agency forwards the tenant's payment to the contract via `repay`, which splits the
amount pro-rata between principal and interest — principal returns to the vault, interest
flows to share value. The Next.js app uses Privy for email-based auth (zero seed phrases),
Helius for RPC, and Appwrite for off-chain UX state (clients, properties, contract metadata,
event log for the TVL chart).

---

## Stack

**Anchor 1.x** (Rust) on **Solana devnet** · **Next.js 16** (Turbopack, App Router) · **Privy**
(embedded wallets, Frontier sponsor) · **Helius** (RPC, Frontier sponsor) · **BRZ** (Transfero
stablecoin, native on Solana since 2021) · **Appwrite** (off-chain state) · **pnpm workspace**.

---

## Roadmap

- v2: Senior/junior tranches (pattern from Pencil Finance / Kormos)
- v2: Real Transfero PIX off-ramp wired up (currently mocked in demo)
- v3: STR (short-term rentals) underwriting via STR Scout flywheel (already shipped)
- v3: Construction receivables vertical
- Global: any market with local stablecoin + registered lease infrastructure

Detail in [`ROADMAP.md`](./ROADMAP.md).

---

## License

MIT.
