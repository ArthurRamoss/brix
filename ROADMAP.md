# Brix — Roadmap pós-MVP

> **Regra**: toda ideia/feature que **não entra** no MVP vai pra este arquivo. Nenhuma
> decisão boa se perde. Adicionar livremente — reorganizar depois.
> MVP = target Colosseum Frontier (11 mai 2026). Qualquer coisa não-essencial = fora
> do MVP = entra aqui.

**Tiers** (prioridade decrescente):
- **v2** — próxima iteração logo após submission. Features que o produto real precisa
  mas o demo não precisa.
- **v3** — melhorias substantivas que demandam refatoração ou novo design.
- **eventually** — ideias válidas sem timing claro; podem subir de prioridade a
  qualquer momento.

---

## v2 — Pós-submission (mai–jun 2026)

### On-chain

- [ ] **Slippage protection em `deposit` e `withdraw`**
  - Adicionar `min_shares_out` em `deposit` e `min_amount_out` em `withdraw`.
  - **Por quê deferido**: share price só muda em `repay` (admin-triggered, baixa
    frequência). Surface real de sandwich attack é quase zero nessa arquitetura.
  - **Quando subir prioridade**: se adicionarmos repay permissionless, ou se volume
    cresce o suficiente pra haver MEV em timing de depósito.
  - **Referência**: `.claude/skills/build-defi-protocol/references/defi-security.md`
    seção "MEV / Sandwich Attacks".

- [ ] **`set_pause(paused: bool)` instruction (admin-only)**
  - Scaffold já tem `vault.paused: bool` + checks em `deposit`/`fund_landlord`.
    Falta só a instruction que escreve o campo.
  - **Por quê deferido**: sem ix, `paused` sempre `false`. No hackathon sem risco de
    mainnet, é dead code.
  - **Quando subir prioridade**: antes de QUALQUER deploy com TVL real.
  - **Custo**: ~15 linhas + 1 teste.

- [ ] **Fluxo de `Defaulted` + liquidação**
  - Status enum já tem `Defaulted` mas ninguém usa. Lógica de produção:
    se `repayment` não chega em `registered_at + duration_days + grace_period`,
    admin (ou cron keeper) marca como Defaulted, aciona seguro fiança off-chain,
    seguradora paga o vault.
  - **Por quê deferido**: MVP demo é happy-path. Mostrar default = desviar do pitch.
  - **Dependências**: integração com seguradora (BTG, Porto?). Contratos jurídicos.

- [ ] **SPL share mint (shares transferíveis)**
  - Trocar `InvestorPosition` PDA por um SPL mint `brxBRZ` que cada investor
    carrega em ATA normal. Shares viram componíveis — DeFi-native, secundário possível.
  - **Por quê deferido**: PDA é mais simples pra MVP 1-ciclo. Sem mercado secundário
    pro MVP.
  - **Trade-off**: migração não é trivial (precisa snapshot + swap).

- [ ] **Tranches senior/junior**
  - Vault passa a ter 2 pools: senior (capital protegido, taxa menor) e junior
    (absorve primeiro default, taxa maior). Atrai perfis diferentes de investidor.
  - **Por quê deferido**: `AGENT_BRAIN.md` guardrail 10 — MVP é single-pool.
  - **Dependência**: Defaulted flow precisa existir pra tranche junior fazer sentido.

- [ ] **Multisig admin (Squads V4)**
  - Chave única → 2-of-3 ou 3-of-5 multisig pra `initialize_vault` authority e
    pause. Timelock em parameter changes.
  - **Por quê deferido**: irrelevante sem TVL real.
  - **Quando subir prioridade**: primeiro deploy mainnet com capital.

### Off-chain / integrações

- [ ] **Off-ramp PIX real (vs mock)**
  - LocalPay, Sendryx, ou Transfero → PIX real pro landlord após `fund_landlord`.
  - **Por quê deferido**: `AGENT_BRAIN.md` guardrail 10. Mockado no MVP, mencionado
    como "integração futura" no pitch.

- [ ] **Multi-rail de pagamento**
  - Além de BRZ, aceitar USDC e outras stables. Routing via Jupiter pra converter.
  - **Por quê deferido**: BRZ nativo em Solana resolve o MVP brasileiro.

- [ ] **Dashboard agência — validação on-chain**
  - Hoje assinatura da agência no `register_receivable` basta. Em produção a
    agência precisa de dashboard pra listar, aprovar, rejeitar recebíveis antes
    de registrar.
  - **Por quê deferido**: `AGENT_BRAIN.md` guardrail 10.

- [ ] **Integração seguro fiança on-chain**
  - Receivable referencia uma apólice tokenizada (ou oracle que atesta cobertura).
  - **Por quê deferido**: hoje é narrativa off-chain (85% dos contratos Selectimob).

### DX / testes

- [ ] **Trident fuzz tests**
  - Fuzzing property-based pra invariantes (`total_assets` monotônico em repay,
    shares conservados, etc).
  - **Referência**: `.claude/skills/build-defi-protocol/references/defi-testing.md`.

- [ ] **Surfpool integration tests**
  - Fork mainnet com BRZ real, testa contra liquidez real.
  - **Referência**: mesma ref acima.

- [ ] **solana-fender-mcp static analysis**
  - Roda antes de qualquer deploy mainnet.

---

## v3 — Expansão (jul+ 2026)

- [ ] **Cross-chain (Base, Arbitrum) via Wormhole/LayerZero**
  - Se Base Batches voltar a ser opção, aqui.

- [ ] **Outros RWAs**: recebíveis B2B (faturas), royalties musicais, etc.
  - Vault passa a ser genérico; Receivable vira trait.

- [ ] **Mercado secundário de InvestorPosition**
  - Precisa SPL mint primeiro (v2). Depois um orderbook simples.

- [ ] **Governance token + DAO**
  - Quem governa upgrades, parameters, pause emergency. Só faz sentido com TVL
    meaningful.

---

## Eventually — sem timing definido

- [ ] Oracle FX hedging (se BRZ desviar do BRL)
- [ ] NFT-wrapped position (discussão: `AGENT_BRAIN.md` guardrail 5 diz pra NÃO
      tokenizar recebível como NFT — mas position tokenizada é outra coisa)
- [ ] zk-proofs pra privacidade de landlord/tenant
- [ ] Confidential SPL (Token-2022 extension) pro BRZ escondido de block explorers
- [ ] Agent-driven portfolio rebalancing (Claude Agent SDK chamando deposits/withdraws
      em nome do investor)

---

## Como usar este arquivo

- Quando aparecer ideia "não agora" → abre aqui, escreve 2-4 linhas (o quê, por quê
  deferido, quando subir prioridade).
- Antes de cada checkpoint/milestone → passa os olhos aqui, vê se algo virou
  prioritário.
- Features que saírem do roadmap (cortadas, não priorizadas mais) → risca e deixa
  commit history como arquivo.
