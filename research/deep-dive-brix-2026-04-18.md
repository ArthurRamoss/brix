# Brix Deep Dive — Apr 18, 2026

**Scope**: Refined competitive landscape + positioning insights from Colosseum Copilot, building on the Apr 14 deep dive (archived under `research/archive-2026-04-14/`).

**Status**: Validation complete. Thesis locked. Ready for scaffold.

---

## What's new vs Apr 14

### 1. Winning positioning rule (new, high-impact)

From Copilot gap analysis (293 winners vs 5,428 total projects):

**Solution tags that winners OVER-index on**:
- `stablecoin payments` — lift +115%
- `rwa tokenization` — lift +27%
- `tokenization` primitive — lift +27%
- `oracle` primitive — lift +27%
- `lending` primitive — lift +272% (winners use it far more than non-winners)

**Solution tags winners EVITAM (lift -100%, zero winners)**:
- `smart contract escrow` (67 non-winners used it; 0 winners)
- `tokenized rewards`
- `decentralized marketplace`

**Problem tags that winners OVER-index on**:
- `capital inefficiency` — lift +81%
- `fragmented liquidity` / `liquidity fragmentation` — lift +100–105%

**Problem tags that winners EVITAM (zero winners)**:
- `high platform fees`
- `high barrier to entry`
- `lack of transparency` ← critical: "transparency" as primary narrative does not win

**Implication for Brix**:
- Lead with **capital inefficiency** as the macro hook ("R$ bilhões em aluguéis futuros parados"), not "bait-and-switch transparency".
- Tag Brix as **rwa tokenization + lending + stablecoin payments + oracle**. Do NOT position as "smart contract escrow" or "vault" — those tags do not convert.
- Transparency (immutable rate in contract) becomes the **mechanism**, not the headline.

### 2. Care Finance — new structural reference (C4 accelerator)

Not surfaced in the Apr 14 deep dive. **Care Finance** (Credible portfolio, C4):
- One-liner: DeFi-powered lending for zero-cost healthcare loans in India, subsidized by hospital yield
- Primitives: `lending`, `yield farming`, `stablecoins`, `fiat-on-ramp`
- Problem tags: `high cost of healthcare`, `lack of affordable medical credit`, `high interest rates in emerging markets`
- Solution tags: `defi-to-fiat lending`, `yield subsidization`, `hospital partnerships`
- Team: 4, no prize won, but **entered C4 accelerator**

**Why it matters**: Care Finance is the cleanest structural twin to Brix — vertical-specific CeDeFi lending for an emerging market, partnering with on-the-ground institutions. Proves the pattern is investable. Brix is: rental receivables (vertical) + Brazil (emerging market) + Selectimob (on-the-ground partner).

### 3. Reflect Protocol — solo founder won Grand Prize ($50K)

Team of **1**, C2 accelerator, Grand Prize at Radar. Product: fully on-chain delta-neutral hedging protocol. Infra-level, not application-level, but proves **solo teams can take the top prize** with sufficient depth.

### 4. New projects similar to Brix (not in Apr 14 list)

| Project | Angle | Team | Similarity | Status | Use for Brix |
|---|---|---|---|---|---|
| **xVaultFi** | Solana-native RWA lending for xStocks | 3 | 0.049 | Cypherpunk, no prize | Closest architecture ref (Anchor/Rust vault) |
| **BridgingFi** | UK property-backed bridging loans | 4 | 0.052 | Cypherpunk, no prize | Useful framing: "legal-to-smart-contract mapping" |
| **Lyhva** | Uncollateralized lending + zkTLS credit score | 2 | 0.047 | Cypherpunk, no prize | Credit-score reference (Brix uses insurance instead) |
| **CrediSOL** | P2P undercollateralized lending + zkTLS + AI | 2 | 0.044 | Cypherpunk, no prize | Same problem space, different mitigation |
| **CredenceChain** | On-chain credit scoring + lending | 1 | 0.037 | Renaissance, no prize | Solo founder precedent |
| **Peer Protocol** | P2P lending global credit market | 6 | 0.044 | Radar, no prize | P2P lending reference |

### 5. Brazil / LATAM stablecoin rail — already covered by others

Brix does NOT need to build off-ramp infrastructure. Integrate instead:

| Project | Angle | Prize |
|---|---|---|
| **LocalPay** (C3 accelerator) | QR stablecoin payments for emerging markets | 3rd Stablecoins Breakout $15K |
| **DOLLAR** (Credible portfolio) | Stablecoin wallet cross-border USD | HM Stablecoins $5K |
| **Sendryx** | Stablecoin-to-local-currency payment gateway | Cypherpunk, no prize |
| **LINK Business** | FX dashboard + API cross-border stablecoin settlement | Breakout, no prize |
| **Flipeet Pay** | Stablecoin payment rail fiat on-off-ramp | Breakout, no prize |

**Implication**: Pitch says "BRZ + Transfero API for production PIX off-ramp; mocked in MVP demo; partners like LocalPay/Sendryx available for future integration." Don't build; integrate.

### 6. Confirmation of Apr 14 findings

Still true after fresh data:
- Zero direct competitors doing **rental receivables + insurance-backed + Brazil origination** on Solana
- Cluster v1-c1 (Real Estate Tokenization): 204 projects, mostly fractional ownership not financing
- Cluster v1-c8 (Yield and DeFi Optimization): 257 projects, more saturated
- VitalFi (medical receivables BR → USDT, HM RWAs Cypherpunk) remains the cleanest adjacency
- Kormos (C4, 2nd DeFi Cypherpunk $20K) remains the tranche pattern reference — to be deferred to Brix v2
- Yumi Finance (C4, 1st DeFi Cypherpunk $25K) remains the underwriting / BNPL reference

---

## Decision: Go

**Confidence: 0.87** (up from 0.83 on Apr 14 — mostly because the framing is now sharper).

**Main risk remains execution scope in 27 days solo.** Mitigation: MVP brutally cut (see `brix.md`), Week 4 sacred for video + submission, no side quests.

---

## Research artifacts

- **Raw Copilot data (Apr 18)**: `research/copilot-deep-dive-2026-04-18/` — 18 JSON files (8 aggregate queries + 10 project deep-dives)
- **Archived Apr 14 work**: `research/archive-2026-04-14/` — earlier brainstorm, initial Copilot queries, `pesquisa claude.md`, `pesquisa-codex.md`
- **Live spec**: `brix.md` (rewritten Apr 18 with winning frame + corrected tech stack + scope cuts)

---

## Next actions

1. Run `/scaffold-project` to initialize Anchor + Next.js workspace
2. Anchor program: escrow + single vault + immutable rate + deposit/withdraw
3. Frontend with Privy auth (landlord flow, investor flow)
4. Integrate BRZ mint on devnet
5. Selectimob data ingestion for demo (anonymized, 1–3 cycles)
6. Week 4: pitch video + submission
