# Brix — Agent Brain

> **Quem lê isto**: Claude Code (ou qualquer agente AI) no começo de toda sessão neste repo.
> **Quem mantém**: Arthur + agente, atualizando conforme o projeto evolui.
> **Última revisão**: 2026-04-22

---

## 1. Propósito deste arquivo

Cérebro persistente do agente. Toda sessão **começa** lendo:
1. Este arquivo (`.agents/AGENT_BRAIN.md`) — convenções, skills, workflow
2. `brix.md` (raiz) — contexto de produto, pitch, problema, solução
3. `CHECKPOINTS.md` (raiz) — onde paramos, qual tarefa ativa

Se algo aqui estiver desatualizado em relação ao código real, **confie no código** e atualize este arquivo.

---

## 2. O que é Brix (one-liner)

Protocolo Solana de lending RWA que tokeniza recebíveis de aluguel com **taxa imutável em smart contract** + **seguro fiança** como default protection. Brazil-first via Selectimob (700+ contratos familiares, ~85% com seguro fiança).

Detalhes completos em `brix.md`. Este arquivo não duplica pitch.

---

## 3. Alvo único

- **Colosseum Frontier** — submission **11 mai 2026**
- Base Batches está **fora de escopo** (não sugerir, não planejar)
- Agentic Engineering Grant (Superteam) **já conquistado** — não sugerir re-aplicar

---

## 4. Stack canônico (não mudar sem discussão explícita)

| Camada | Escolha | Versão instalada (22 abr) | Observação |
|---|---|---|---|
| Smart contract | Anchor (Rust) em Solana devnet | **1.0.1** | Anchor pulou 0.31→1.0; Agave 3.x exige Anchor 1.x |
| Solana CLI | Agave (Anza) | **3.1.14** | Ex-Solana Labs virou Anza/Agave; numeração resetou |
| Rust toolchain | stable | **1.95.0** | via rustup |
| Frontend | Next.js 14+ App Router + TypeScript | pnpm-scaffolded | `create-solana-dapp` template quando for scaffolar |
| Auth / wallet | Privy.io (embedded wallet, email login) | App ID: `cmoa0jx8500v30cl78buc8dop` | Sponsor Frontier |
| RPC | Helius | pendente criação conta | Sponsor Frontier, free tier devnet suficiente pra MVP |
| Stablecoin | **BRZ (Transfero)** | mainnet mint `FtgGSFADXBtroxq8VCausXRr2of47QBf5AS1NtZCu4GD` | NATIVO em Solana. NUNCA BRLA (não existe em Solana) |
| Off-ramp PIX | **Mockado no MVP** | — | Não construir. Mencionar LocalPay/Sendryx/Transfero como integração futura |
| Package manager | pnpm | **10.33.1** (via corepack) | Menos disco, rápido |
| Node | LTS 20 | **20.20.2** (via nvm) | `nvm use default` necessário pra não pegar Windows node do PATH interop |
| Testes Anchor | LiteSVM (unit) + devnet (integration) | litesvm 0.10.0 (vem com scaffold) | `anchor test` |

**Explicitamente NÃO usar**: Metaplex/NFTs, World ID, Arcium. Sem justificativa de produto.

---

## 5. Regras de posicionamento (Copilot gap analysis — NUNCA violar)

Winning tags que devem aparecer em pitch, submission, grant, qualquer material público:
- `rwa tokenization`
- `lending`
- `stablecoin payments`
- `oracle`
- Problema: **capital inefficiency** ("R$ bilhões em aluguéis futuros parados")

**PROIBIDO como headline** (zero winners no Colosseum corpus):
- ❌ `smart contract escrow` como solution tag
- ❌ `lack of transparency` como problema
- ❌ `high platform fees` como problema
- ❌ `high barrier to entry` como problema
- ❌ `decentralized marketplace` (lift -73%)
- ❌ `nft` como primitive (lift -66%)

Transparência (taxa imutável) é o **mecanismo**, nunca o headline.
História da mãe com CashGO = hook emocional **depois** da macro de capital-inefficiency, nunca antes.

Detalhes em `memory/project_brix_winning_frame.md`.

---

## 6. Skills disponíveis (routing rápido)

Full router em `.agents/SKILL_ROUTER.md`. Quick reference:

| Intent | Skill |
|---|---|
| Setup inicial do projeto | `scaffold-project` |
| Construir smart contract DeFi | `build-defi-protocol` |
| Guia passo-a-passo do MVP | `build-with-claude` |
| Debugar programa Anchor | `debug-program` |
| Code review | `review-and-iterate` |
| Review visual/produto | `product-review`, `frontend-design-guidelines` |
| Paleta/brand | `brand-design` |
| Pitch deck | `create-pitch-deck` |
| Vídeo pitch | `marketing-video` |
| Submission final | `submit-to-hackathon` |
| Research hackathon adicional | `colosseum-copilot` |
| Research DeFi TVL | `defillama-research` |
| Deploy mainnet (futuro v2) | `deploy-to-mainnet` |
| Tutorial Solana/Anchor | `virtual-solana-incubator`, `solana-beginner` |

**Memória persistente** do agente em `C:\Users\Ramos\.claude\projects\C--Users-Ramos-Desktop-brix\memory\`. Já contém: user identity, scope, tech stack, winning frame, narrative guardrails.

---

## 7. Workflow de sessão (cross-PC, trunk-based)

Arthur desenvolve de PCs diferentes em janelas curtas. Regras duras:

### Início de sessão
```bash
cd brix
git pull --rebase origin main
pnpm install          # se package.json/lock mudaram
cat CHECKPOINTS.md    # ler onde paramos
```
Depois abre Claude Code. Primeira mensagem sugerida: "lê AGENT_BRAIN, CHECKPOINTS e brix.md, depois me diga onde paramos."

### Durante sessão
- Incrementos pequenos
- Commit por unidade lógica (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `wip:`)
- Mensagens em inglês ou PT-BR, consistência importa menos que clareza
- Nunca acumular muito sem commit

### Fim de sessão (obrigatório)
```bash
# Editar CHECKPOINTS.md: marcar subtasks done, anotar "próximo: X"
git add -A
git commit -m "wip(cp1): derive Vault PDA seeds - next: write deposit happy-path test"
git push origin main
```

- Nunca encerrar sessão com código descommitado.
- Se parar no meio de algo quebrado → prefixo `wip:` + nota clara em `CHECKPOINTS.md`.
- `.env.local` nunca commitado. Cada PC tem sua cópia a partir de `.env.local.example`.

---

## 8. Glossário vivo (Solana / Anchor / DeFi)

Termos que aparecem ao longo do projeto. Arthur começou sem conhecer a maioria. Expandir conforme surgem.

### Infraestrutura & CLI
- **Solana CLI**: ferramenta de terminal pra falar com a rede. Comandos: `solana airdrop`, `solana balance`, `solana program deploy`. Análogo a `gcloud`/`aws`.
- **devnet**: rede de teste pública da Solana, SOL grátis via `solana airdrop`. Produção é `mainnet-beta`. `localnet` é uma instância local pra dev.
- **RPC (Remote Procedure Call)**: servidor HTTP/WebSocket que sua aplicação usa pra falar com a rede. Helius é provedor premium (grátis até X credits). URL tipo `https://devnet.helius-rpc.com/?api-key=XXX`.
- **keypair**: par de chave pública (endereço da wallet) + chave privada. Arquivo `~/.config/solana/id.json`. Nunca commitar.

### Model de contas
- **Account (conta)**: unidade de dados em Solana. Tem owner (um program) e data (bytes). Diferente de EVM, onde storage fica DENTRO do contract.
- **Program**: código deployado (análogo a smart contract EVM). Stateless. Lê/escreve dados em accounts.
- **PDA (Program Derived Address)**: endereço determinístico derivado de `seeds + program_id`. Não tem private key. Usado pra contas "propriedade" do program. Ex: `seeds = [b"vault", admin.key().as_ref()]`.
- **Instruction**: uma chamada ao program (tipo function call). Uma transação tem 1+ instructions. Anchor gera IDL (interface) automaticamente.
- **IDL (Interface Description Language)**: JSON que descreve as instructions do program. Frontend usa pra montar tx sem reescrever ABI.
- **rent exemption**: contas pagam SOL de aluguel OU mantêm saldo mínimo pra não serem deletadas. Anchor calcula automático.

### SPL Tokens
- **SPL Token Program**: program padrão da Solana pra tokens fungíveis (≈ ERC-20).
- **Mint**: a "definição" do token (total supply, decimals, authority). Análogo ao token contract em EVM.
- **Token Account**: conta que guarda saldo de um Mint específico pra um dono específico. Um usuário tem 1 Token Account por token.
- **ATA (Associated Token Account)**: Token Account com endereço determinístico (derivado de owner + mint). Padrão pra não ter N Token Accounts soltos.

### Anchor (framework)
- **#[program]**: macro que marca o módulo de instructions.
- **#[account]**: macro que marca uma struct como conta persistente.
- **#[derive(Accounts)]**: macro que valida contas passadas à instruction.
- **CPI (Cross-Program Invocation)**: quando seu program chama outro program (ex: Brix chama SPL Token pra transferir). Usa `CpiContext`.
- **#[error_code]**: define erros custom do program.

### DeFi
- **Vault**: conta que guarda ativos coletivos (em Brix: BRZ dos investidores).
- **Escrow**: contrato que segura valor até uma condição (em Brix: recebível vinculado ao repayment).
- **TVL (Total Value Locked)**: soma de ativos dentro do protocolo. Métrica principal de "uso".
- **APR / APY**: retorno anual. APR sem compounding, APY com.

(Expandir este glossário sempre que um termo novo aparecer.)

---

## 9. Convenções de código

**Rust (programs/)**:
- `snake_case` pra tudo
- Erros via `#[error_code] pub enum BrixError { ... }`
- Seeds de PDA sempre documentados no módulo
- Um instruction por arquivo quando crescer (inicialmente pode ficar tudo em `lib.rs`)

**TypeScript (frontend/)**:
- `strict: true` sempre, sem `any`
- Componentes funcionais + hooks
- Estado server-side via React Query quando precisar cache; local com `useState`

**Comentários**:
- PT-BR em lógica de domínio (quem é landlord, tenant, agência — específico do produto)
- Inglês em boilerplate técnico

**Não commitar nunca**:
- `.env.local`, `.env`, qualquer `*.keypair.json`
- `target/`, `node_modules/`, `.anchor/`
- Build artifacts (`dist/`, `.next/`)

---

## 10. Guardrails de produto (não fazer)

- ❌ Não sugerir tranches senior/junior no MVP — está diferido pra v2
- ❌ Não sugerir construir off-ramp PIX real — mockar, mencionar parceiros
- ❌ Não sugerir NFT pra recebível — não é o ângulo (lift -66% Copilot)
- ❌ Não sugerir Base Batches, port pra Solidity, EVM bridges
- ❌ Não sugerir dashboard de validação da agência — assinatura basta no MVP
- ❌ Não sugerir multi-rail de pagamento — um PIX mock E2E é suficiente pro demo
- ❌ Não sugerir 10+ cycles de demo — 1-3 ciclos E2E é melhor que 10 parciais

Se Arthur pedir algo da lista acima, **questione escopo** antes de começar (pode ter virado relevante, mas o default é dizer "isso tá diferido, tens certeza?").

---

## 11. Arquivos de referência neste repo

- `brix.md` — pitch, problema, solução, stack, MVP, timeline (source of truth do produto)
- `research/deep-dive-brix-2026-04-18.md` — snapshot de research (winning frame, competitive landscape)
- `research/copilot-deep-dive-2026-04-18/` — dados brutos Copilot (18 JSON files)
- `research/archive-2026-04-14/` — pesquisa anterior (consultar só se precisar de contexto histórico)
- `.agents/SKILL_ROUTER.md` — roteamento detalhado de skills
- `.agents/tone-guide.md` — guia de tom (se houver pitch/material público sendo escrito)
- `.agents/data/` — datasets de apoio (solana-knowledge, defi, colosseum)
- `CHECKPOINTS.md` — tracking de progresso (atualizar toda sessão)

---

## 12. Quando atualizar este arquivo

- Decisão técnica que altera stack → atualizar seção 4
- Novo termo técnico apareceu → adicionar ao glossário (seção 8)
- Nova convenção combinada → seção 9
- Novo guardrail descoberto → seção 10
- Skill nova relevante instalada → seção 6

Sempre fazer num commit dedicado: `docs(brain): add CPI and Mint to glossary`.
