# Brix — Project Brief

> **Status**: Brainstorm → Ready for Claude Code buildout
> **Builder**: Arthur Ramos (@ramoslds)
> **Date**: April 14, 2026
> **Chain**: Solana (primary — Frontier hackathon), Base (secondary — Base Batches)

---

## One-liner

On-chain real estate credit protocol that turns property income streams into transparent, insurance-backed yield products. Starting in Brazil, built for global expansion.

---

## The Problem

Property owners everywhere have predictable future income (rent, short-term rental bookings, construction installments) but no transparent, fair way to access liquidity against it.

### Brazil (launch market)
- Off-chain fintechs like CashGo charge 36-60% APR with fees that change at signing
- R$2B+ annual rental advance market, zero transparency, zero on-chain alternative
- 13.3 million rented properties, seguro fiança (rental insurance) as structural protection
- Banks cut credit to construction by 54% in 2025 — developers scrambling for alternatives

### Why start here
- **Selectimob** (family business): 700+ active contracts, ~140 landlords, zero CAC, day-one pilot
- Seguro fiança solves the default problem that killed Goldfinch ($103M → $1.6M TVL)
- CVM Resolution 88 provides clear regulatory pathway for tokenized receivables
- BRZ stablecoin eliminates FX risk for local users

### Global opportunity
- US: $12T+ residential rental market, fragmented landlord financing, DSCR loans are slow and expensive
- LATAM: Similar dynamics to Brazil across Mexico, Colombia, Argentina
- Europe: Rental markets in Germany, Spain, Portugal with analogous credit gaps
- Short-term rentals (Airbnb/Booking): $100B+ global market, hosts everywhere need working capital

The protocol is designed chain-agnostic and jurisdiction-flexible from day one. Brazil is the beachhead, not the ceiling.

---

## The Solution

Brix is a Solana-native credit protocol that tokenizes real estate receivables into structured yield tranches. Connects property owners who need liquidity today with investors seeking real-world yield.

Smart contracts lock the rate — it cannot change after signing. Everything is transparent and on-chain.

---

## How It Works (Simple)

```
BORROWER SIDE                         INVESTOR SIDE
(property owner)                      (DeFi user / institution)

"I need money today                   "I want 20-25% APR
 against my future                     backed by real
 rental income"                        assets, not speculation"
       |                                      |
       v                                      v
┌─────────────────────────────────────────────────┐
│                    BRIX                         │
│                                                 │
│  1. Agency (e.g. Selectimob) validates          │
│     rental contract & tenant                    │
│                                                 │
│  2. Smart contract escrows future receivables   │
│     at IMMUTABLE rate                           │
│                                                 │
│  3. Investor capital flows into risk-tiered     │
│     vaults:                                     │
│     ┌─────────┐  ┌─────────┐                   │
│     │ SENIOR  │  │ JUNIOR  │                    │
│     │ Lower   │  │ Higher  │                    │
│     │ risk    │  │ risk    │                    │
│     │ ~16% APR│  │ ~25% APR│                    │
│     └─────────┘  └─────────┘                    │
│                                                 │
│  4. Property owner receives stablecoin →        │
│     local off-ramp (PIX in BR, ACH in US, etc)  │
│     Owner never touches crypto                  │
│                                                 │
│  5. Monthly payments flow back to vaults        │
│     automatically via smart contract            │
└─────────────────────────────────────────────────┘
```

---

## Triple Collateral (What Makes This Different)

1. **Insurance layer**: In Brazil, seguro fiança covers tenant default — not the protocol, not the investor. This is what killed Goldfinch ($103M TVL → $1.6M from loan defaults). Each new market plugs in its local equivalent (renters insurance in US, deposit protection in EU).
2. **Registered contracts**: In Brazil, cartório-registered agreements. In US, legally binding lease agreements. Institutional-grade legal backing per jurisdiction.
3. **Real estate as implicit collateral**: Physical property underlying every contract, regardless of market.

The collateral framework is modular — same protocol, different insurance/legal wrappers per market.

---

## Vertical Expansion Strategy

The vertical is **real estate income streams**. Same smart contract infra, same tranche model, same collateral type. Start narrow, expand within the vertical.

### Phase 1: Long-term rentals — LAUNCH (Brazil)
- Selectimob: 700+ contracts, ~140 landlords, zero CAC
- Simplest receivable: fixed monthly rent, seguro fiança, cartório-registered
- This is the hackathon MVP

### Phase 2: Short-term rentals (Airbnb/Booking) — GLOBAL
- Hosts need working capital, renovation funding, expansion capital
- Receivable: projected booking revenue (AirDNA-style data as underwriting)
- **Flywheel with STR Scout** (CTX Protocol MCP server already built)
- Works in any country with Airbnb/Booking presence
- Higher yield, slightly higher risk → fits Junior tranche

### Phase 3: Construction receivables — BRAZIL → LATAM
- Developers selling units on installment plans
- R$3.2T+ credit market in BR, banks retreating
- Receivable: installment payments from sold units
- Largest ticket sizes, most complex underwriting, but massive TAM

### Phase 4: US / EU market entry
- US: partner with property management companies (equivalent of Selectimob)
- Adapt collateral module for local insurance products (renters insurance, security deposits)
- Stablecoin: USDC for US market, EURe for EU
- Same protocol, different regulatory wrapper

### NOT in scope (focus = death avoidance)
- Invoice factoring (NF-e) — different vertical
- Payroll advances — different vertical
- Personal credit — different vertical
- Generic "PayFi universal" — Brix is real estate, period

---

## Competitive Landscape

### Colosseum Copilot Data (5,400+ hackathon projects)
- **Direct competitors in rental receivables on Solana: 0**
- Cluster "RE Tokenization": 204 projects, 5.9% win rate
- Cluster "Yield & DeFi": 257 projects, 11.3% win rate
- Winners over-index on: lending (+387%), tokenization (+23%), fractional ownership (+62%)
- Winners under-index on: NFTs (-77%)
- **Brix aligns with winner profile**

### Most Similar Projects (all low similarity < 0.07)
| Project | What it does | Similarity | Result |
|---------|-------------|-----------|--------|
| VitalFi | Brazilian medical receivables → USDT yield | 0.056 | HM RWAs |
| 20apy/NASH | Credit card receivables → 20% APY via WhatsApp | 0.056 | No prize |
| Pencil Finance | Student loan tranches (senior/junior) | 0.042 | 4th RWAs $10K |
| BridgingFi | UK property-backed bridging loans | 0.053 | No prize |

### Dead/dying comparables
- **Credix**: Raised $11.25M Series A. Currently $1 TVL — effectively dead.
- **Goldfinch**: $103M TVL peak → $1.6M. Killed by loan defaults. Brix solves this with insurance-backed collateral.

---

## Regulatory Strategy

### Brazil (launch): CVM Resolution 88 Partnership
- Partner with a CVM 88-authorized crowdfunding platform
- Brix = tech infrastructure layer; partner = regulated entity
- CVM reviewing Resolution 88 in 2026 to expand tokenized offerings
- Antecipação de recebíveis = cessão de crédito (Art. 286 Civil Code), not a loan
- Non-custodial design to avoid PSAV classification (R$10-37M minimum capital)

### US (expansion): Reg D / Reg CF pathway
- Accredited investor exemption (Reg D 506(c)) for initial deployment
- Regulation Crowdfunding (Reg CF) for broader access
- Partner with licensed broker-dealer or funding portal

### General principle
- Brix never seeks its own financial license
- Always operates as protocol infrastructure plugging into locally regulated entities
- Hackathon/MVP stage: no registration needed anywhere

---

## Tech Stack

- **Smart contracts**: Anchor (Rust) on Solana
- **Stablecoin**: BRZ (Brazil), USDC (US/global), modular per market
- **Off-ramp**: BRLA API for PIX (Brazil), modular for ACH/SEPA
- **Frontend**: Next.js / React
- **Auth/wallet**: Privy.io (abstract wallet complexity — users never touch crypto)
- **Underwriting data**: AirDNA integration for Phase 2 (STR), on-chain credit scoring long-term

---

## Unfair Advantages

1. **Selectimob**: Family business, 700+ contracts, ~140 landlords. Zero CAC, day-one distribution.
2. **Insurance-backed collateral**: Seguro fiança as structural default protection — modular per market.
3. **Builder proof**: 3 MCP servers shipped for CTX Protocol (BidScout Intel Tier S, STR Scout Tier A, AdWinner). Production fullstack dev at Rock Encantech/Banco Safra.
4. **STR Scout flywheel**: Already built the market intelligence tool for Phase 2's vertical.
5. **Empty niche**: 0/5,400+ Colosseum projects in rental receivables tokenization.
6. **Global-ready architecture**: Modular collateral/insurance/stablecoin/off-ramp per jurisdiction from day one.

---

## Hackathon Targets

### Colosseum Frontier (Solana) — Deadline: May 11, 2026
- Anchor smart contracts on devnet (escrow, tranches, agency registry)
- Investor deposit flow + tranche selection UI
- Landlord simulation + agency validation dashboard
- PIX off-ramp integration (BRLA)
- End-to-end demo with Selectimob data (10+ advance cycles)
- Primary KPI: successful end-to-end rental advance cycles on devnet

### Base Batches 2026 Student Track — Deadline: April 27, 2026
- Port core logic to Base/Solidity
- Record ~1 min unlisted intro video

### Agentic Engineering Grant (Superteam) — Deadline: May 4, 2026
- $200 USDG for Claude Max subscription
- Requires Frontier submission + GitHub repo + AI subscription receipt

---

## Lessons from Superteam BR Ideathon Top 5

Analyzed the winning decks (Riptide 1st, Anemone 2nd, OPEN 3rd, IntentLayer 4th, Compliance Oracle 5th):

- **Name**: Short, evocative, no suffix beats descriptive names. "Brix" fits.
- **Opening slide**: Lead with a killer one-liner, not a logo dump. 
- **Problem framing**: Open with a big number ($197M lost, $3.4B stolen). For Brix: "$103M TVL → $1.6M. Goldfinch died because defaults had no insurance. Brix fixes that."
- **Show you're building**: Anemone had a Week 1 update with actual code. Ship > slide.
- **Solo founder is OK**: 3 of top 5 were solo. But proof of work must be strong.
- **Visual style**: Dark themes, clean typography, minimal text per slide, data-heavy.

---

*Brix — Real estate yield, on-chain. Starting in Brazil, built for the world.*
*Generated April 14, 2026 — Ready for Claude Code continuation*