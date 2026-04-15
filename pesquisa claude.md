# Brix Deep Dive — Pesquisa Completa



## Context



Arthur quer validar se Brix (protocolo de credito imobiliario on-chain) vale construir pro Colosseum Frontier (deadline: 11 mai 2026). Ele ta solo, precisa de chance real de ganhar. A ideia evoluiu de uma chamada "antecipay" e o nucleo eh tokenizar recebiveis de aluguel com collateral de seguro fianca.



---



## 1. VEREDITO: WORTH BUILDING?



**Sim, com ajustes significativos.** O nucleo da ideia eh forte. Mas a narrativa atual do brix.md ta inflada e o escopo ta grande demais pra um dev solo com 27 dias.



### O que sustenta a ideia



- **Market timing real**: bancos cortaram credito SBPE pra producao em 54% no 1S25 (CBIC). Proprietarios precisam de liquidez.

- **CashGO valida o mercado**: captou R$120M via FIDC, atendeu 250K+ proprietarios, avancou R$200M+ em alugueis, 450+ imobiliarias parceiras. **O mercado existe e tem dinheiro.**

- **Niche on-chain vazio**: zero projetos de rental receivables no Solana (confirmado nos 5.400+ projetos do Colosseum). Adjacencias existem (VitalFi, Credible Finance, ChainCrib) mas nenhum faz exatamente isso.

- **Solana RWA crescendo**: TVL de RWA em Solana passou de $2B em abril 2026, mas quase tudo eh treasuries (BlackRock, Ondo). Private credit/real estate eh thin = oportunidade de destaque.

- **Founder-market fit forte**: familia tem imobiliaria com 700+ contratos, voce tem 3 MCP servers shipped, trabalha em producao no Banco Safra. Isso eh demonstravel.

- **Perfil de winner alinhado**: projetos Colosseum que ganham over-indexam em lending (+387%) e tokenization (+23%). Brix encaixa perfeitamente.



### O que precisa de ajuste



#### Problema critico: BRLA NAO ESTA EM SOLANA

- BRLA (stablecoin) ta em Polygon, Celo, Base, Ethereum — **NAO em Solana**

- BRZ (Transfero) SIM esta em Solana (integrada desde 2021)

- O brix.md menciona "BRLA API for PIX" — isso nao funciona direto

- **Acao**: usar BRZ como stablecoin + buscar off-ramp BRZ→PIX (Transfero tem API) ou usar USDC + off-ramp via MoonPay/outro parceiro do Frontier



#### Narrativa inflada (flagged pela pesquisa-codex.md)

- "0 direct competitors" → melhor: "ninguem dominou rental receivables com insurance wrapper e originacao local no Brasil on-chain"

- "R$2B+ annual rental advance market" → sem fonte primaria confiavel. CashGO avancou R$200M+ total (nao anual). Mercado real eh grande mas o numero precisa de fonte

- "CVM 88 provides clear regulatory pathway" → CVM ta revisando Res. 88 em 2026 pra acomodar securitizacao. Caminho existe mas nao eh plug-and-play

- "Credix dead / Goldfinch died" → parcialmente verdade. Goldfinch ainda tem Borrowed relevante. Credix tem $10M+ Borrowed. "Colapsaram em TVL" eh mais preciso



#### Escopo grande demais pra hackathon solo

- brix.md lista: escrow, tranches, agency registry, investor deposit, landlord simulation, agency validation dashboard, PIX off-ramp, 10+ advance cycles

- Solo founder contra times de 3+ pessoas (media de winner do Colosseum)

- **Acao**: cortar pra um fluxo funcional end-to-end, nao 6 features meia-boca



---



## 2. ANALISE COMPETITIVA COMPLETA



### On-chain (Solana)

| Projeto | O que faz | Status | Ameaca |

|---------|----------|--------|--------|

| VitalFi | Medical receivables BR → USDT yield | HM RWAs Cypherpunk | Baixa — vertical diferente |

| Credible Finance | RWA lending generico | Ativo | Media — generico, sem foco em rental |

| Facto | Invoice factoring on-chain | Ativo | Baixa — invoice ≠ rental |

| Yumi Finance | BNPL for DeFi | Winner Cypherpunk | Baixa — consumer focus |

| ChainCrib | Fractional RE ownership | Base/Cardano | Nula — chain diferente, modelo diferente |



**Conclusao**: zero competidor direto em rental receivables on Solana. VitalFi eh o mais proximo (receivables BR on-chain) mas vertical diferente.



### Off-chain (Brasil)

| Empresa | Status | Tamanho | Modelo |

|---------|--------|---------|--------|

| CashGO | Operacional, crescendo | R$120M FIDC, 450+ imobiliarias, 250K+ proprietarios | Antecipacao via FIDC, parceria com imobiliarias |

| Outras fintechs | Fragmentado | Menor | 36-60% APR com fees opacos |



**CashGO eh o benchmark real.** Eles validam o mercado mas operam 100% off-chain, opaco, com taxas altas. A tese on-chain: transparencia, taxa imutavel no smart contract, acesso global a yield.



### Mortos/moribundos

- **Goldfinch**: $103M TVL peak → ~$1.6M. Mas ainda tem borrowed ativo. Morreu por default sem insurance

- **Credix**: $1 TVL mas $10M+ borrowed. Raised $11.25M Series A. Efetivamente morto em termos de protocol activity



**Por que Brix eh diferente**: insurance-backed (seguro fianca absorve default), originacao local (Selectimob), nao depende de crypto-native borrowers



---



## 3. RECURSOS DO FRONTIER QUE BRIX DEVE USAR



### Sponsors diretamente uteis

| Recurso | Por que | Prioridade |

|---------|---------|-----------|

| **Privy** | Auth + embedded wallet Solana. Sponsor do Frontier. Abstrai crypto do usuario final. SOC 2 compliant | CRITICO |

| **Helius** | RPC provider. 50% off ($24.50/mo), 10M credits, sub-ms response | CRITICO |

| **Squads** | Multisig pra vaults >$10K TVL. Sponsor do Frontier | MEDIO |

| **MoonPay** | Off-ramp alternativo se BRZ→PIX nao rolar | BACKUP |



### Recursos de aprendizado

- **Start Here** path do Frontier → shortest path pra primeiro build

- **DeFi + Stablecoins** build path → interesse bearing assets e primitives

- **Colosseum Copilot** → deep dive com PAT (precisa configurar)



### O que NAO usar

- Metaplex (NFTs — Brix nao precisa)

- World (identity — overkill pra MVP)

- Arcium (privacy — nao eh o foco)



---



## 4. PADRAO DE WINNERS vs PERFIL DO BRIX



### O que os Grand Champions tem em comum

Todos os Grand Champions ($50K) construiram **infrastructure-level innovation**:

- Unruggable (hardware wallet), Reflect (hedge-backed stablecoins), TapeDrive (storage), Ore (PoW), FluxBot (AI chatbot), Underdog (dynamic NFTs)



**Brix nao eh infrastructure-level.** Brix eh application-level (credit protocol). Isso nao desqualifica — 20 projetos ganham $10K cada. Mas o Grand Champion provavelmente nao eh realista.



### O que os $10K winners tem em comum

- Working demo on devnet (non-negotiable — 30% do peso)

- Founder-market fit claro

- Narrative crisp (problema → solucao → demo em 3 min)

- Nao precisam ser inovacao radical, mas precisam funcionar



### Onde Brix encaixa

- **Forte**: founder-market fit (Selectimob), problema real (transparencia em antecipacao), nicho vazio

- **Fraco**: solo founder (media de winner eh 3+), escopo ambicioso, two-sided marketplace



### O que o Colosseum diz sobre solo founders

> "We highly encourage joining forces with at least 1 other cofounder. The average winning team size is now above 3."



Mas 3/5 no Superteam BR Ideathon top 5 eram solo. **Solo pode ganhar, mas proof of work tem que ser absurdo.**



---



## 5. ESTRATEGIA PRA GANHAR SOLO



### Principio: menos features, mais profundidade



Nao tente competir em breadth contra times de 3. Compete em:

1. **Profundidade de dominio** (voce CONHECE o mercado imobiliario)

2. **Demo funcional real** (nao mockup — transacao real on devnet)

3. **Narrativa killer** (CashGO cobra 36-60% opaco, Goldfinch morreu sem insurance, Brix resolve os dois)



### MVP cortado pra hackathon (27 dias)



**Um fluxo, end-to-end, que funciona:**



```

Proprietario submete contrato

  → Agencia (Selectimob) valida

    → Smart contract escrow com taxa IMUTAVEL

      → Investidor deposita em vault

        → Proprietario recebe stablecoin

          → (bonus) off-ramp PIX

```



**Cortar**:

- ~~Tranches (Senior/Junior)~~ → vault unico (simplifica MUITO o smart contract)

- ~~Agency validation dashboard~~ → agencia valida off-chain, registra on-chain com assinatura

- ~~10+ advance cycles~~ → 1-3 cycles completos no demo

- ~~PIX off-ramp real~~ → simular no demo, mencionar BRLA/BRZ integration no pitch



**Manter**:

- Smart contract Anchor funcional (escrow + vault + immutable rate)

- Frontend Next.js com Privy auth

- Demo com dados reais da Selectimob (anonymizados)

- Fluxo completo: deposit → advance → repayment



### Timeline sugerida (27 dias: 14 abr → 11 mai)



| Semana | Foco | Entregavel |

|--------|------|-----------|

| 1 (14-20 abr) | Smart contract core + setup | Anchor program: escrow, vault, deposit/withdraw. Devnet deploy |

| 2 (21-27 abr) | Frontend + Privy + fluxo | Next.js app com Privy, landlord flow, investor flow |

| 3 (28 abr - 4 mai) | Integracao + demo data | End-to-end flow funcionando, dados Selectimob, polish |

| 4 (5-11 mai) | Video + testing + submission | Pitch video 3min (Loom), demo video 2-3min, testes, submission |



**Semana 4 eh SAGRADA pra video e polish.** O pitch video eh o item mais importante da submission segundo o Colosseum.



### Pitch video (3 min) — estrutura



1. **Hook** (15s): "Minha mae tem uma imobiliaria. 700 contratos. Ela quase assinou com uma fintech pra antecipar aluguel. Na simulacao era 18%. Na hora de assinar, 32%. Com Brix, a taxa eh gravada em smart contract. Impossivel de mudar."

2. **Quem sou eu** (20s): dev em producao no Banco Safra, familia com imobiliaria de 700+ contratos (85% com seguro fianca), 3 MCP servers shipped pra CTX Protocol

3. **Problema** (30s): proprietarios querem antecipar aluguel mas fintechs cobram 36-60% com bait-and-switch. Goldfinch tentou on-chain e morreu ($103M→$1.6M) porque nao tinha insurance. Zero solucao on-chain que funcione.

4. **Solucao** (30s): Brix tokeniza recebiveis de aluguel com: taxa IMUTAVEL em smart contract + seguro fianca como collateral (85% dos contratos) + off-ramp PIX

5. **Demo** (60s): mostrar o fluxo completo funcionando no devnet

6. **Por que Solana** (15s): 400ms blocks, $0.00025 tx, ecossistema RWA $2B+, stablecoins nativas

7. **Traction / Next** (10s): Selectimob como piloto day-one (700+ contratos, zero CAC), expansion pra STR (STR Scout ja built)



---



## 6. VALIDACAO COM A SELECTIMOB (CONFIRMADO)



### 1. Seguro fianca: ~85% dos contratos

- Triple collateral eh REAL, nao marketing

- 85% de 700+ = ~595 contratos com seguro fianca ativo

- Isso eh um edge brutal que nenhum competidor on-chain tem



### 2. Selectimob intermedia o pagamento: SIM

- Inquilino paga pra Selectimob → Selectimob repassa pro proprietario

- Smart contract PODE interceptar esse fluxo (critical path funciona)

- Modelo operacional validado: rent payment → smart contract escrow → vault repayment



### 3. Demanda de adiantamento: VALIDADA COM HISTORIA REAL

- Proprietarios quase assinaram com CashGO

- **Desistiram porque a taxa mudou na hora de assinar** (simulacao era uma, contrato era outra)

- Proprietarios TEM interesse mas NAO PODEM ACESSAR termos justos



**ISSO MUDA TUDO PRO PITCH:**

- A dor nao eh so "falta de liquidez" — eh **opacidade e bait-and-switch**

- Brix resolve EXATAMENTE isso: taxa imutavel gravada em smart contract, impossivel de mudar depois

- Hook do pitch: "Minha mae quase assinou com CashGO. Na simulacao era X%. Na hora de assinar, era Y%. Com Brix, a taxa eh gravada em smart contract. Impossivel de mudar."

- Founder story genuina + problema real + solucao tecnica = combinacao que juizes amam



---



## 7. RESULTADOS DO COLOSSEUM COPILOT DEEP DIVE



### Projetos similares (5.400+ corpus)



> Nota: projetos de hackathon sao demos/prototipos, nao produtos em producao. Uteis pra inspiracao e pra ver o que ja foi tentado.



- **otc3** (`otc3`, Breakout) — RE tokenization platform, 10% target yield. Fractional ownership focus, sem receivables. Similarity: 0.074

- **TRLCO** (`trlco`, Cypherpunk) — AI-powered RWA tokenization de businesses. Solo founder. Sem foco em rental. Similarity: 0.062

- **Crib Connect** (`crib-connect`, Cypherpunk) — Marketplace descentralizado de alugueis, trust entre landlord/tenant. Escrow-based. NAO faz receivables advance. Similarity: 0.037

- **LEAP** (`leap-2`, Renaissance) — Rental marketplace com NFTs, landlord liquidity via DeFi yield. Solo founder. O mais proximo conceptualmente. Sem premio. Similarity: 0.030

- **VitalFi** (`vitalfi`, Cypherpunk) — **Receivables BR on-chain (medical, nao rental)**. HM RWAs. Time de 4. **Referencia direta de architecture.** Similarity: 0.031

- **Chaincrib** (`chaincrib`, Renaissance) — Multi-chain fractional RE, rental yield distribution. Time de 3. Sem premio. Similarity: 0.054

- **Credible Finance** (`credible-finance`, Renaissance → **Accelerator C4**) — CeDeFi lending contra RWAs tokenizados. **No accelerator portfolio.** Similarity: 0.080



### Accelerator portfolio overlap



**Credible Finance** (C4) eh o unico projeto no portfolio do accelerator que toca RWA lending on Solana. Eles sao genericos (qualquer RWA), nao especificos pra rental receivables. Diferenciacao clara:

- Brix: vertical especifico (rental), insurance-backed, originacao local (Selectimob)

- Credible: horizontal (qualquer RWA), institutional licenses, CeDeFi



**Kormos** (C4, 2nd DeFi Cypherpunk) usa tranches senior/junior — referencia util de architecture

**Yumi Finance** (C4, 1st DeFi Cypherpunk) — BNPL/credit scoring on-chain, referencia pra underwriting



### Archive insights (crypto literature)



- **Galaxy Research: "The New Age in Onchain Credit Markets"** (Feb 2026, similarity 0.65) — "Native players are reshaping asset-backed finance by turning stablecoin cash flows into programmable, enforceable collateral." Cash-flow-backed lending com smart-contract lockboxes eh EXATAMENTE o que Brix faz. Goldfinch/BlockFi/Genesis citados como failures por enforcement off-chain. Validates timing.

- **a16z: "Blockchains for TradFi"** (Aug 2025, similarity 0.59) — Tokenized deposits ja live (JPMorgan JPMD). Validates institutional-grade on-chain credit.

- **Pantera Capital: "Full-Spectrum Investing"** (Apr 2025, similarity 0.57) — Banks losing deposit-based funding that supported lending → gap que blockchain preenche. TESE CENTRAL DO BRIX (bancos cortando credito → Brix preenche o gap).

- **Paradigm: "Crypto-native Insurance"** (Aug 2020, similarity 0.40) — Insurance como primitive fundamental de DeFi. Credit derivatives market $4.2T globally. Seguro fianca do Brix encaixa nesse framework.



### Gap classification



**Partial gap — Geographic + Segment opportunity**

- Ninguem tokenizou rental receivables especificamente em Solana

- VitalFi prova que o modelo de receivables BR on-chain funciona (pegou HM)

- Credible Finance prova que RWA lending em Solana tem traction (accelerator C4)

- Mas NENHUM combina: rental + insurance-backed + originacao local + Brasil

- O gap eh real, mas nao eh "empty niche" — eh "niche desocupado com adjacencias validadas"



### Hackathon analytics (4.352 projetos, Cypherpunk + Breakout + Radar)



**Problem tags mais comuns**: fragmented liquidity (98), information overload (80), high platform fees (60), high barrier to entry (46), lack of transparency (42)



**Solution tags mais comuns**: rwa tokenization (102), tokenized rewards (72), smart contract escrow (56), stablecoin payments (41)



**Cluster "Solana Real Estate Tokenization" (v1-c1)**: 204 projetos — moderadamente ocupado. Mas quase tudo eh fractional ownership, NAO receivables financing.



**Tech stack dominante**: Solana (99.5%), React (42%), Rust (31%), Anchor (21.4%), TypeScript (14.8%)



---



## 8. FONTES DA PESQUISA



- [CashGO — R$120M FIDC](https://www.letsmoney.com.br/noticias/cashgo-fidc-120-milhoes-antecipacao-alugueis)

- [CashGO — R$100M em antecipacao](https://imobireport.com.br/aluguel/cashgo-atinge-r-100-mi-em-antecipacao-de-aluguel-com-integracao-nos-principais-erps/)

- [Solana RWA TVL $1.8B+](https://phemex.com/news/article/solanas-rwa-tvl-surpasses-18-billion-amid-defi-expansion-67995)

- [Helius RWA on Solana overview](https://www.helius.dev/blog/solana-real-world-assets)

- [BRLA Digital (Polygon/Base, nao Solana)](https://brla.digital/brlatoken)

- [BRZ em Solana (Transfero)](https://transfero.com/stablecoins/brz)

- [How to Win a Colosseum Hackathon](https://blog.colosseum.com/how-to-win-a-colosseum-hackathon/)

- [Perfecting Your Hackathon Submission](https://blog.colosseum.com/perfecting-your-hackathon-submission/)

- [Colosseum Accelerator (0.67% acceptance)](https://colosseum.com/accelerator)

- [Privy Solana integration](https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana)

- [Frontier Resources](https://colosseum.com/frontier/resources)

- [Colosseum Copilot Docs](https://docs.colosseum.com/copilot/introduction)

- [CBIC credito producao -54%](https://cbic.org.br/wp-content/uploads/2025/09/informativo-economico-pib-2otrimestre-de-2025.pdf)

- [Seguro Fianca explicado](https://suhaiseguradora.com/blog/seguro/seguro-fianca/)



### Copilot Sources

- Galaxy Research: [The New Age in Onchain Credit Markets](https://www.galaxy.com/insights/perspectives/the-new-age-in-onchain-credit-markets) (Feb 2026)

- a16z: [Blockchains for TradFi](https://a16zcrypto.com/posts/article/blockchains-banks-asset-managers-fintechs) (Aug 2025)

- Pantera Capital: [Full-Spectrum Investing](https://panteracapital.com/blockchain-letter/full-spectrum-investing-approach) (Apr 2025)

- Paradigm: [Crypto-native Insurance](https://www.paradigm.xyz/2020/08/crypto-native-insurance) (Aug 2020)

- Copilot project slugs: `otc3`, `trlco`, `crib-connect`, `leap-2`, `vitalfi`, `chaincrib`, `credible-finance`, `cronia`, `credlend`, `kormos`, `yumi-finance`



---



## 9. RISK ASSESSMENT



### Technical risk: BAIXO-MEDIO

- Anchor/Rust eh well-documented, voce ja tem experiencia fullstack

- Escrow + vault pattern eh standard (defi-program-patterns.md no repo tem code)

- Risco real: time pressure de 27 dias solo



### Regulatory risk: BAIXO (pra hackathon)

- MVP em devnet nao precisa de nenhuma licenca

- CVM 88 pathway existe mas eh complexo pra producao

- Hackathon/prototype stage: zero regulatory concern



### Market risk: BAIXO

- CashGO validou o mercado com R$120M FIDC

- 13.3M+ domicilios alugados no Brasil

- Proprietarios demonstram interesse em liquidez (CashGO 250K+ atendidos)

- Vitamin ou painkiller? **PAINKILLER** — proprietarios precisam de liquidez agora, bancos cortaram credito



### Execution risk: ALTO

- Solo founder contra times de 3+

- 27 dias pra smart contract + frontend + video

- Two-sided marketplace: cold start problem

- Mitigacao: Selectimob resolve o cold start (supply-side), escopo cortado pro minimo funcional



### Competitive risk: BAIXO

- Zero competidor direto on-chain

- CashGO eh off-chain e nao se posiciona como concorrente

- VitalFi eh medical, nao rental

- Credible Finance eh generico, nao vertical



---



## 10. DECISAO FINAL



**BUILD. Mas com escopo brutal.**



| Dimensao | Score (1-5) | Justificativa |

|----------|------------|--------------|

| Market validation | 5 | CashGO R$120M FIDC, bancos cortando credito 54% |

| Competitive moat | 4 | Seguro fianca + Selectimob + vertical specific |

| Founder-market fit | 5 | Familia imobiliaria + dev production |

| Technical feasibility | 4 | Anchor escrow/vault eh standard pattern |

| Hackathon fit | 4 | Winner profile alinhado (lending +387%), niche vazio |

| Solo execution risk | 2 | Alto — 27 dias, 1 pessoa, precisa de video + demo + contracts |

| **TOTAL** | **24/30** | **Worth building. Escopo eh o risco, nao a ideia.** |

