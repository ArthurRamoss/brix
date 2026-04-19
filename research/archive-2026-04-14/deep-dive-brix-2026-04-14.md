# Brix Deep Dive (Colosseum Copilot + solana.new skills)

Date: 2026-04-14
Scope: Full idea deep dive for Brix/AnteciPay, focused on Frontier hackathon positioning and grant readiness.

## Executive verdict

Brix is worth building for Frontier, but the winning pitch is not "zero competition." The strongest angle is:

Brazil-first rental receivables infrastructure with agency origination, insurance-aware underwriting, and transparent immutable pricing on Solana.

This is a strong 10k-track profile if demo quality is high and scope is cut to one end-to-end flow.

## Method used

This deep dive used:
- Existing repo artifacts: brix.md, pesquisa-codex.md, pesquisa claude.md
- Colosseum Copilot API (authenticated, 2026-04-14)
- solana.new playbooks: colosseum-copilot, competitive-landscape, validate-idea, apply-grant

Copilot raw outputs are saved at:
- research/copilot-deep-dive-2026-04-14/01-filters.json
- research/copilot-deep-dive-2026-04-14/02-projects-q1-semantic.json
- research/copilot-deep-dive-2026-04-14/03-projects-q2-problem.json
- research/copilot-deep-dive-2026-04-14/04-projects-q3-accelerator.json
- research/copilot-deep-dive-2026-04-14/05-projects-q4-winners.json
- research/copilot-deep-dive-2026-04-14/06-projects-q5-tag-followup.json
- research/copilot-deep-dive-2026-04-14/07-archives-conceptual.json
- research/copilot-deep-dive-2026-04-14/08-archives-implementation.json
- research/copilot-deep-dive-2026-04-14/09-analyze-hackathons.json
- research/copilot-deep-dive-2026-04-14/10-project-details-top.json
- research/copilot-deep-dive-2026-04-14/11-summary.json

## Copilot findings (fresh)

### Similar and adjacent projects (from project search)

Top similar slugs in current corpus include:
- leap-1 and leap-2 (LEAP)
- trustrent (TrustRent)
- rentic
- vitalfi (HM RWAs winner in Cypherpunk)
- evergreen-protocol

Interpretation:
- The niche is not empty in absolute terms.
- There are adjacent attempts in rental flows and RWA receivables.
- Similarity scores are low (roughly 0.04-0.08), indicating no dominant direct equivalent to Brix's insurance-backed rental receivables design.

### Accelerator and winner checks

Accelerator-only search returned relevant adjacent teams (example: Kormos, Reflect Protocol, Decal).
Winner-focused search returned mostly broad DeFi/RWA adjacent projects, not a direct rental-receivables winner.

Conclusion:
- There is competitive pressure in DeFi/RWA.
- There is no obvious entrenched winner for the exact Brix positioning.

### Tag follow-up

Top extracted problem tag from relevant results: illiquid real estate assets.

Follow-up results confirm a sparse but real set of related projects, reinforcing: not empty, not saturated.

### Archive evidence (concept + implementation)

Highest relevance archive hits included:
- The New Age in Onchain Credit Markets (Galaxy Research)
- Crypto-native Insurance (Paradigm Research)
- Deep Dive of the State of RWAs on Solana (Superteam Blog)
- Solana Ecosystem Report (H1 2025) (Helius)

Interpretation:
- Brix aligns with active credit-market narratives (yield + risk control + RWA rails).
- Insurance-backed framing is a valid strategic differentiator, not a cosmetic claim.

## Hackathon landscape signal

Copilot analyze totals from current dataset:
- Projects: 5428
- Winners: 293

Implication:
- This is a high-noise field; execution quality matters more than broad idea novelty.
- For Brix, the edge is founder-market fit + distribution + transparent pricing story + working demo.

## Core thesis stress-test

### What is strong
- Distribution edge: Selectimob with 700+ contracts and pre-existing landlord relationships.
- Real pain signal: mismatch between simulation rates and final contract rates in off-chain alternatives.
- Structural risk mitigation: seguro fianca + legal contract rails + property-backed context.
- On-chain advantage: auditable and immutable pricing logic.

### What should be de-risked in wording
- Avoid absolute claims like "0 competitors".
- Avoid unsupported market-size figures without clear source in the grant narrative.
- Treat BRLA/PIX language carefully; keep payout rail wording modular unless integration is already confirmed in the code path.

## Recommended submission angle (Frontier + grant)

Use this framing:
- Problem: landlords need liquidity, but current rental advance rails are opaque and can re-price at signing.
- Product: Brix locks terms in smart contracts and routes investor capital to real rental receivables.
- Why now: RWA + stablecoin demand is strong, and this segment is underbuilt in Solana hackathon outcomes.
- Why us: direct origination channel (Selectimob) and domain context from real agency operations.

## MVP scope recommendation (for solo founder)

Ship one complete flow:
1. Agency validates receivable.
2. Investor deposits in a single vault.
3. Protocol advances funds to landlord.
4. Repayment simulation settles back to vault.

Defer after hackathon:
- Full tranche complexity
- Broad dashboard surface
- Multi-rail payout automation

## Go / No-go decision

Go.

Confidence: 0.83

Reason:
- Proven user pain + distribution + sparse direct overlap + feasible MVP.
- Main risk is execution scope, not thesis viability.

## Notes

- Most hackathon projects do not become startups; use them as signal and design references.
- Projects surfaced may no longer be active; verify status before drawing hard competitive conclusions.

## Repository proof points

- Git remote: https://github.com/ArthurRamoss/brix.git
- Latest commit observed: b81d876 (Initial Brix project setup)

