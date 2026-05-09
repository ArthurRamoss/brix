# Brix — Project Brief

> **Status**: Idea validated → Ready for scaffold
> **Builder**: Arthur Ramos ([@ArthurRamoss](https://github.com/ArthurRamoss))
> **Repo**: https://github.com/ArthurRamoss/brix
> **Last updated**: April 18, 2026
> **Target**: Colosseum Frontier (Solana) — Deadline: May 11, 2026

---

## One-liner

Brix unlocks parked capital stuck in future rent by tokenizing insurance-backed rental receivables on Solana. Brazil-first, agency-originated, transparent pricing.

---

## The Problem (winning frame: capital inefficiency)

Property owners hold predictable future rental income but cannot access it at fair terms.

### Macro
- **17.4% of Brazilian households are renters** (IBGE PNAD 2023) — 13M+ rented units
- **PIX moves 7B+ transactions/month, ~$6.7T in 2025** (+34% YoY, EBANX). Universal local rail — but **no on-chain bridge to it for receivables**.
- Brazilian fintech credit market grew 68% YoY (R$35B in 2024, ANBC); alternative-lending TAM growing to **$3.35B by 2029**. Rental receivables remain underserved.
- Existing off-chain fintechs (CashGO R$120M FIDC, 250K+ owners served) operate with opaque pricing and **bait-and-switch practices**: simulation rate differs from final contract rate.

### The on-chain gap (the most defensible stat we have)
- **BRZ has 200M+ tokens minted on Solana** — 73% of total Transfero supply lives here (rwa.xyz, May 2026)
- ...but Solana hosts only **42 active addresses with ~$1.1k monthly volume**
- Polygon does **$25.65M/month** in BRZ activity — same token, same issuer, 23,000× the volume
- **Brix is the first real demand vector** for the BRZ supply already deployed on Solana

### Solana RWA category state (May 2026)
- $2.26B distributed value on Solana RWA, +2.82% 30d (rwa.xyz)
- Leadership migrated to **Treasury products** (BlackRock BUIDL, Ondo, Maple $2.2B)
- **RWA Lending category is empty** — Goldfinch collapsed $103M → $1.3M TVL (DefiLlama), killed by uninsured defaults. Credix is alive ($44M issued, 24 active deals) but is institutional USDC SME credit — not retail rental.
- No Colosseum project in the 5,400+ corpus has dominated rental receivables with insurance wrapper + local origination in Brazil.

### Why the insurance angle matters
Goldfinch peaked at $103M TVL and collapsed to $1.3M — **killed by loan defaults without an insurance layer**. Credix is the only living adjacent (institutional/USDC), leaving retail-rental wide open. **Brix solves the default problem structurally via seguro fiança** (Brazilian rental insurance), which ~85% of Selectimob's contracts already carry.

---

## The Solution

Brix is an RWA lending protocol on Solana that tokenizes rental receivables into a single transparent yield vault.

### Core promise
Rate is written in the smart contract at signing. **It cannot change.** This alone defeats the off-chain bait-and-switch that made rental advances a broken category.

### Flow
```
Landlord (via Selectimob)           Investor (DeFi user / institution)
"I need money today against          "I want ~20% APR backed by real
 my future rental income"             rental income, not speculation"
          |                                       |
          v                                       v
  ┌──────────────────────────────────────────────────────┐
  │                        BRIX                          │
  │                                                      │
  │  1. Agency (Selectimob) validates contract + seguro  │
  │     fiança off-chain, signs commitment on-chain      │
  │                                                      │
  │  2. Smart contract escrows future receivables at     │
  │     IMMUTABLE rate                                   │
  │                                                      │
  │  3. Single investor vault (senior/junior tranches    │
  │     deferred to v2) deposits BRZ stablecoin          │
  │                                                      │
  │  4. Landlord receives BRZ → off-ramp to PIX via      │
  │     Transfero API (or integrated partner like        │
  │     LocalPay/Sendryx). Owner never touches crypto.   │
  │                                                      │
  │  5. Tenant pays Selectimob → Selectimob routes to    │
  │     smart contract → repayment to vault              │
  └──────────────────────────────────────────────────────┘
```

---

## Differentiation (triple collateral, modular by market)

1. **Insurance layer**: seguro fiança absorbs tenant default before it reaches the protocol. This is what Goldfinch missed. Modular per market (renters insurance US, deposit protection EU).
2. **Registered contracts**: cartório-registered in Brazil, legally binding lease in other jurisdictions.
3. **Real estate as implicit collateral**: physical property underlying every contract.

**Core tags (winning frame, from Colosseum Copilot)**: `rwa tokenization`, `lending`, `stablecoin payments`, `oracle`. Intentionally NOT `smart contract escrow` — zero Colosseum winners positioned that way.

---

## Unfair advantages

1. **Selectimob** (family business): 700+ active contracts, ~140 landlords, **~85% with seguro fiança** (~595 insured), zero CAC, day-one pilot. Already intermediates rent payment flow → smart contract can slot into existing rails.
2. **Founder story is genuine**: landlords in the family nearly signed with CashGO; the rate changed between simulation and contract. That is the pitch hook.
3. **Founder-market fit**: production fullstack at Banco Safra / Rock Encantech + 3 MCP servers shipped for CTX Protocol (BidScout Tier S, STR Scout Tier A, AdWinner).
4. **Timing**: bank credit retreat + Solana RWA momentum + empty RWA lending category on DefiLlama.
5. **STR Scout flywheel** (already built): market intelligence for Phase 2 vertical (short-term rentals).

---

## Competitive landscape (refined with Copilot Apr 18 data)

### Most relevant adjacencies on Solana
| Project | Angle | Team | Prize | Why it matters |
|---|---|---|---|---|
| xVaultFi | Solana-native RWA lending for xStocks | 3 | none | **Closest architecture reference** (Anchor/Rust vault pattern) |
| BridgingFi | UK property-backed bridging loans | 4 | none | Useful framing: "legal-to-smart-contract mapping" |
| Kormos (C4 accelerator) | Fractional reserve yield, senior/junior tranches | 4 | 2nd DeFi Cypherpunk $20K | Tranche pattern reference (deferred to v2) |
| Credible Finance (C4) | CeDeFi lending vs tokenized RWAs, institutional licenses | 5 | HM DeFi & Payments | Horizontal competitor; Brix is vertical-specific |
| Care Finance (C4, Credible portfolio) | CeDeFi lending for India healthcare | 4 | none | **Structural twin**: vertical-specific CeDeFi in emerging market |
| Yumi Finance (C4) | BNPL + credit scoring | 4 | 1st DeFi Cypherpunk $25K | Underwriting reference |
| VitalFi | Medical receivables BR → USDT yield | 4 | HM RWAs Cypherpunk | Proves BR receivables on-chain works |

### Status of the closest competitors (May 2026)
- **Goldfinch**: collapsed from $103M → ~$1.3M TVL (DefiLlama). Died from uninsured borrower defaults — **the exact failure mode Brix's seguro fiança defends against**.
- **Credix**: alive — $44M issued, $7.1M interest, 24 active deals across Brazil + Colombia. **But institutional USDC SME credit, not retail rental.** Brix is positioned as **retail / BRZ / rental / PIX-native**.
- **VitalFi** (medical receivables BR via Pollum): direct shape clone but different vertical (medical, USDT). Brix differentiates on asset class + native BRZ rail + Selectimob's day-one origination.

**Honest positioning**: "Nobody has dominated **rental receivables with insurance wrapper and local origination in Brazil** on Solana." Credix sits adjacent (institutional, USD-denominated); Brix owns the retail/BRZ slot.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Smart contracts | Anchor (Rust) on Solana devnet | Standard; well-documented |
| Stablecoin | **BRZ (Transfero)** — native on Solana since 2021 | BRLA is NOT on Solana. USDC as global alt. |
| Off-ramp PIX | Transfero API (BRZ→PIX) for production; **mocked in MVP demo** | LocalPay/Sendryx/DOLLAR exist as integration partners — not building from scratch |
| Auth / wallet | **Privy.io** (Frontier sponsor, SOC 2, email login) | Users never touch seed phrases |
| RPC | **Helius** (Frontier sponsor, 50% off Max, 10M credits) | Sub-ms response |
| Multisig (v2) | Squads (Frontier sponsor) | For vaults >$10K TVL |
| Frontend | Next.js / React | Fast shipping |
| Underwriting data (v2) | AirDNA via STR Scout | Phase 2 (short-term rentals) |

**Not using**: Metaplex (no NFTs), World (identity overkill), Arcium (privacy not the angle).

---

## MVP scope — brutally cut for solo + 27 days

### What ships for Frontier
- Anchor program: escrow + **single vault** + immutable rate + deposit/withdraw
- Next.js frontend with Privy auth — landlord flow + investor flow
- Agency validation: off-chain, signed on-chain
- End-to-end demo: 1–3 full advance cycles with anonymized Selectimob data
- Pitch video (3 min) + technical demo video (2–3 min)

### Explicitly deferred to v2
- Senior/junior tranches (Kormos/Pencil Finance already prove the pattern; too complex for MVP)
- Agency validation dashboard (agency signature is enough for now)
- Real PIX off-ramp (mocked in demo; mentioned as integration partner story in pitch)
- 10+ advance cycles (overkill — 1–3 end-to-end is a clean demo)
- Multi-rail payout automation
- STR vertical (Phase 2)
- Construction receivables (Phase 3)

---

## Pitch video structure (3 min)

1. **Hook (15s)** — "Minha mãe tem uma imobiliária. 700 contratos. Ela quase assinou com uma fintech pra antecipar aluguel. Na simulação era 18%. Na hora de assinar, 32%. Com Brix, a taxa é gravada em smart contract. Impossível de mudar."
2. **Macro problem (30s)** — Bancos cortaram crédito imobiliário em 54% no 1S25. R$ bilhões em aluguéis futuros parados. Proprietários pagam 36-60% ao ano em off-chain alternatives.
3. **Why it's broken on-chain too (20s)** — Goldfinch: $103M → $1.6M TVL, killed by defaults without insurance. Credix: $1 TVL.
4. **Solution (30s)** — Brix: RWA lending with (a) immutable rate in smart contract, (b) seguro fiança as structural default protection (85% of our contracts already carry it), (c) off-ramp PIX via Transfero.
5. **Demo (60s)** — Full cycle on devnet: agency validates → investor deposits → landlord receives BRZ → tenant pays → vault settles.
6. **Why Solana (10s)** — 400ms blocks, $0.00025 tx, native stablecoins, RWA momentum.
7. **Traction + next (15s)** — Selectimob pilot ready day one (700 contratos, zero CAC). Phase 2: short-term rentals globally via STR Scout flywheel.

---

## Regulatory strategy

- **Hackathon / MVP**: no license required (devnet prototype).
- **Brazil production**: partner with CVM 88–authorized crowdfunding platform. Brix = tech layer; partner = regulated entity. CVM opened public consultation in 2025 to expand Res. 88 for tokenized securities — pathway exists but is not plug-and-play.
- **Non-custodial design** to avoid PSAV classification (R$10–37M minimum capital requirement).
- **Antecipação de recebíveis = cessão de crédito** (Art. 286 Civil Code), not a loan.
- Brix never seeks its own financial license; always plugs into locally regulated entities.

---

## Timeline (27 days: Apr 14 → May 11)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 (Apr 14–20) | Scaffold + smart contract core | Anchor program on devnet: escrow, vault, deposit/withdraw |
| 2 (Apr 21–27) | Frontend + Privy + flows | Next.js + Privy, landlord flow, investor flow |
| 3 (Apr 28–May 4) | Integration + demo data | E2E flow working, Selectimob data anonymized, polish |
| 4 (May 5–11) | **SACRED: video + submission** | Pitch video 3min, demo video, Colosseum submission |

Week 4 is untouchable for code changes. Video and submission eat the full week.

---

## Status

- [x] Agentic Engineering Grant (Superteam) — **secured**
- [x] Idea validation (Colosseum Copilot, DefiLlama, competitive landscape)
- [x] Founder interview with Selectimob (seguro fiança %, payment flow, demand confirmed)
- [ ] Scaffold project (next step)
- [ ] Anchor program MVP
- [ ] Frontend MVP
- [ ] Pitch video + submission

---

*Brix — Rental receivables, on-chain. Brazil-first, built to scale.*
