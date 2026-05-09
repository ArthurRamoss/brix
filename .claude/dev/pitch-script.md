# Brix — pitch & roteiros

> documento único pros materiais de apresentação. tom segue
> `.agents/tone-guide.md` (lowercase, sem em-dash, dados em vez de adjetivos).
> testar voz alta com cronômetro antes de gravar; ajustar onde sobrar/faltar tempo.

**deadlines**:
- colosseum frontier — 2026-05-11 (vídeo 3min em inglês)
- demo day BR — apresentação ao vivo com público misto, em PT-BR

---

## 1. Elevator pitch (30s · usar em qualquer conversa casual)

**versão curta**:
> brix antecipa aluguel pra proprietário no brasil sem o golpe da taxa que muda. a
> imobiliária registra o contrato em smart contract solana com taxa fixa, investidor
> deposita stablecoin no vault, proprietário recebe via PIX. seguro fiança cobre
> default. piloto com a imobiliária da minha mãe, 700 contratos.

**porque funciona como abertura**: hook pessoal (mãe), problema concreto (golpe da
taxa), solução em 1 frase (smart contract + vault + pix), prova (700 contratos
prontos no piloto). qualquer pessoa entende, mesmo sem saber o que é solana.

---

## 2. Demo day BR — pitch 3min em PT-BR (acessível, sem jargão)

> público misto: dev, fundador, investidor, amigo, pai. ninguém deve ficar perdido.
> entregar como se fosse uma conversa, não uma palestra técnica.

### 1. hook (20s) · história real

> minha mãe tem uma imobiliária. setecentos contratos de aluguel. ano passado ela
> quase fechou com uma fintech pra antecipar a renda dos proprietários. na simulação
> a taxa era dezoito por cento ao ano. na hora de assinar, trinta e dois. eu tava na
> sala. pensei: tem que existir um jeito de essa taxa não virar surpresa.

### 2. problema (40s) · capital parado

> no brasil, banco cortou cinquenta e quatro por cento do crédito imobiliário no
> primeiro semestre de vinte e cinco. nove bilhões de reais que serviam pra antecipar
> recebíveis pra proprietário. evaporou.
>
> ao mesmo tempo, treze milhões de famílias alugam no brasil. esse aluguel é renda
> futura previsível. o proprietário não consegue acessar essa renda em condição
> justa. as plataformas que existem cobram trinta e seis a sessenta por cento ao ano,
> e mudam a taxa entre simulação e contrato.
>
> tem capital parado dos dois lados: investidor querendo render, proprietário
> precisando antecipar. ninguém une isso de forma transparente.

### 3. por que ninguém resolveu ainda (20s)

> tentaram on-chain. goldfinch chegou a cento e três milhões de dólares parados, hoje
> tem um milhão e meio. credix levantou onze milhões em série A, hoje tem um dólar
> de tvl. morreram porque os inquilinos davam calote e não tinha cobertura.

### 4. solução brix (40s) · três camadas

> brix é um protocolo solana com três proteções pra renda do investidor.
>
> **um**: a taxa do contrato é gravada no smart contract. uma vez assinada, não pode
> mudar. acabou o golpe da simulação.
>
> **dois**: seguro fiança. é um produto que noventa por cento das imobiliárias no
> brasil já oferecem. se o inquilino não paga, a seguradora paga o vault antes de
> virar prejuízo. é o que o goldfinch não tinha.
>
> **três**: o contrato de aluguel é registrado em cartório. tem imóvel físico
> servindo de garantia implícita.
>
> nenhum projeto na américa latina oferece os três juntos.

### 5. demo ao vivo (60s) · ciclo completo

> abre o navegador. devnet. tudo gravado on-chain real, ninguém é mockado fora o
> off-ramp PIX que é integração externa.
>
> [agência] entra a selectimob. cadastra um proprietário, maria, com o imóvel dela.
> abre a aba registrar e antecipa seis meses de aluguel — total nove mil e seiscentos
> reais. a taxa fica visível e gravada on-chain. clica confirmar.
>
> [investidor] outra wallet. deposita cinquenta mil reais no vault. recebe shares.
> share price começa em um.
>
> [proprietária maria] loga com o email dela. vê na tela: contrato registrado, valor
> liberado, PIX em curso. ela não precisa entender de cripto.
>
> [agência] inquilino paga o aluguel. selectimob registra o repagamento. on-chain o
> vault cresce pela parte dos juros. share price sobe.
>
> [investidor] saca. recebe principal mais juros pro-rata. tudo com hash de
> transação clicável no solana explorer.

### 6. por que agora (20s) · timing

> três coisas convergem. a stablecoin BRZ é nativa em solana desde 2021. o
> ecossistema solana RWA bateu dois bilhões de dólares em valor lockado este ano. e
> o crédito tradicional fechou a torneira. é hora.

### 7. tração + fechamento (20s)

> piloto pronto desde o dia um: setecentos contratos da selectimob, cento e quarenta
> proprietários, custo de aquisição zero porque é a imobiliária da família. fase dois
> é aluguel de temporada global usando uma flywheel de inteligência de mercado que eu
> já construí.
>
> brix. recebíveis de aluguel, on-chain. brasil primeiro. construído pra escalar.

---

## 3. Frontier 3min — pitch em inglês (Colosseum judges)

> mesma espinha do pitch BR mas mais técnica e direta, em inglês. judges veem 50+
> projetos por dia, primeira frase decide se eles continuam.

### 1. hook (15s)

> my mother runs a real estate agency in brazil. 700 active rental contracts. last
> year she almost signed with a fintech to advance future rent. simulation: 18
> percent. contract day: 32 percent. with brix the rate is written into the smart
> contract at signing. impossible to change.

### 2. macro problem (30s)

> brazilian banks cut real estate credit by 54 percent in the first half of 2025.
> 9 billion reais. that capital used to fund property owners. now it's gone.
>
> 13 million households rent in brazil. property owners hold predictable future rent
> they can't access at fair terms. existing off-chain players advance rent at 36 to
> 60 percent annual. opaque. bait-and-switch on the rate.

### 3. why on-chain breaks too (20s)

> rwa lending tried this on solana. goldfinch hit 103 million tvl. dropped to 1.6
> million. killed by uninsured defaults. credix raised 11 million. sits at 1 dollar
> tvl today.
>
> the gap is structural. defillama solana rwa lending is nearly empty.

### 4. solution (30s)

> brix tokenizes brazilian rental receivables on solana with three layers of
> collateral.
>
> one. rate is immutable in the smart contract. defeats the bait-and-switch.
>
> two. seguro fiança. brazilian rental insurance absorbs tenant default before it
> reaches the protocol. 85 percent of our pilot agency contracts already carry it.
>
> three. real estate as implicit collateral. every contract is cartório-registered.

### 5. demo (60s)

> here's a full cycle on devnet.
>
> [/agency] selectimob onboards a property owner, registers a 9.6k receivable.
> one click triggers register_receivable then fund_landlord. owner receives BRZ.
> in production this off-ramps to PIX via transfero.
>
> [/invest] investor deposits 50 thousand brz into the vault. tvl updates. shares
> minted at price one.
>
> [/landlord] property owner logs in with their email. sees the contract registered,
> PIX in progress. no crypto knowledge needed.
>
> [/agency] tenant pays selectimob. selectimob calls repay on-chain. the vault
> grows by the interest portion. share price increases.
>
> [/invest] investor withdraws. burns shares. receives principal plus pro-rata
> interest. tx hashes link to solana explorer.
>
> real signatures via privy embedded wallet. real spl transfers. devnet brz mint
> we control. nothing mocked except the pix off-ramp on the landlord side.

### 6. why solana (10s)

> 400ms blocks. 25 thousandths of a cent per tx. brz is native on solana since 2021.
> rwa momentum. helius and privy as frontier sponsors directly in our stack.

### 7. traction + next (15s)

> selectimob pilot ready day one. 700 contracts. 140 landlords. zero customer
> acquisition cost. phase 2 is short-term rentals globally, powered by str scout,
> a market intelligence flywheel i already shipped.
>
> brix. rental receivables, on-chain. brazil first. built to scale.

---

## 4. Demo walkthrough · passo a passo (pra apresentação ao vivo)

> use isso quando alguém pedir "me mostra como funciona". cada passo tem o que
> aparece na tela e o que falar.

### preparo

- janela do navegador limpa (sem favoritos visíveis)
- aba 1: `localhost:3000` (ou domínio em produção)
- aba 2: `https://explorer.solana.com/?cluster=devnet`
- abrir três janelas anônimas pra simular três personas (imobiliária, investidor,
  proprietário) sem precisar deslogar — cada uma com session Privy separada

### passo 1 · cadastro da imobiliária (30s)

**na tela**: `/login` → escolhe **imobiliária** → cai em `/agency/onboard`

**fala**:
> primeira coisa que precisa entender: brix não é um app que qualquer um se cadastra
> e começa a operar. é uma rede de imobiliárias parceiras. cada imobiliária passa por
> um KYB rápido antes de operar. aqui é o formulário: nome da empresa, contato,
> email, site, cidade, número de contratos sob gestão.

**na tela**: preenche "selectimob" → submit → aparece tela de candidatura recebida

**fala**:
> em produção isso vai pra revisão. pra demo, tem um botão "simular aprovação" que
> manda direto pro painel.

### passo 2 · primeiro cadastro de cliente (45s)

**na tela**: `/agency` aprovado → aba **clientes** → vazia → "+ adicionar primeiro
proprietário"

**fala**:
> dashboard começa limpa. nada mockado. pra antecipar um contrato, primeiro cadastra
> o proprietário. nome, email — esse email é o que ele vai usar pra logar e ver os
> contratos dele depois — CPF, telefone, chave PIX.

**na tela**: preenche dados de Maria Santos, email maria@teste.com → salvar

**fala**:
> agora cada cliente pode ter vários imóveis. clica no card dele e adiciona o
> primeiro: rua, número, valor do aluguel mensal.

**na tela**: expande Maria → "+ adicionar imóvel" → R. Augusta 1402, R$ 1800/mês

### passo 3 · antecipação on-chain (45s)

**na tela**: aba **registrar** → seleciona Maria → seleciona R. Augusta → 6 meses →
seguradora Porto Seguro → review

**fala**:
> aqui o coração do produto. seleciona o cliente, seleciona o imóvel, escolhe quantos
> meses antecipar. a taxa anual aparece automática — quanto maior o prazo, taxa
> ligeiramente maior. tudo gravado on-chain.

**na tela**: clica "registrar on-chain" → Privy abre popup de confirmação → assina →
volta pra tela com tx hash

**fala**:
> esse é um signature real, com a wallet embedded da Privy que foi criada quando a
> imobiliária logou. o smart contract grava o recebível com a taxa imutável e libera
> o BRZ pra carteira da imobiliária. em produção, esse BRZ vai por PIX pra Maria via
> Transfero.

**na tela**: clica no link do tx → abre solana explorer → mostra o `register_receivable`
+ `fund_landlord` confirmados

### passo 4 · investidor deposita (30s)

**na tela**: outra janela anônima → `/login` → investidor → `/invest`

**fala**:
> persona dois: investidor. logou com outro email. vê o vault com TVL, taxa anual,
> contratos ativos lastreando.

**na tela**: aba **depositar** → 5000 BRZ → confirmar → assina → toast com tx hash

**fala**:
> deposita cinco mil reais. recebe shares — a "cotação" dessas shares é o quanto vai
> render. começa em um por um. quando o repagamento chega, a cotação sobe. é o mesmo
> modelo de fundo de investimento, só que totalmente on-chain.

### passo 5 · proprietário confere (20s)

**na tela**: terceira janela anônima → `/login` com `maria@teste.com`

**fala**:
> Maria loga com o email que a imobiliária usou no cadastro. brix reconhece, joga
> ela direto na visão de proprietário. ela vê o contrato dela, valor recebido, tx
> hash, status do PIX. ela não precisa saber o que é wallet ou shares.

### passo 6 · repagamento (30s)

**na tela**: volta pra janela da imobiliária → aba **registrar repagamento** →
seleciona o contrato → confirmar → assina → tx hash

**fala**:
> inquilino pagou o aluguel pra imobiliária esse mês. ela registra o repagamento
> on-chain. o vault recebe o BRZ de volta com a parcela de juros embutida. share
> price sobe automaticamente — ninguém precisa fazer claim, distribuir dividendo.
> a matemática roda no smart contract.

### passo 7 · todos veem o efeito (30s)

**na tela**: volta pra janela do investidor → `/invest` → aba **minha posição**

**fala**:
> investidor agora tem o mesmo número de shares mas elas valem mais. yield realizado.

**na tela**: terceira janela → Maria → vê "1/6 parcelas pagas"

**fala**:
> Maria vê o progresso do contrato dela: uma parcela quitada, cinco a ir.
>
> esse é o ciclo completo. seis meses depois, contrato fechado, investidor saca, todo
> mundo no zero a zero. o que tu acabou de ver: três personas, quatro signatures
> reais on-chain, mockando só a parte de PIX.

---

## 5. FAQ · perguntas que vão fazer

> respostas curtas e honestas. nada de marketing speak. se a resposta é "ainda não",
> dizer "ainda não".

**é custodial? quem segura o dinheiro?**
> não. usamos Privy, que dá uma carteira embedded pro usuário. a chave privada fica
> com o usuário, brix nunca tem acesso. todo o dinheiro tá em PDA on-chain ou na
> wallet do próprio usuário.

**e a regulação CVM?**
> antecipação de recebível é cessão de crédito (artigo 286 do código civil), não é
> empréstimo. não precisa de licença pra MVP em devnet. pra produção, parceria com
> plataforma autorizada CVM 88 (existe consulta pública aberta de 2025 pra expandir
> isso pra tokenização). brix não busca licença própria, sempre encaixa em entidade
> regulada localmente.

**o que acontece se o inquilino não paga?**
> seguro fiança absorve. é um produto que setenta por cento das imobiliárias no
> brasil oferecem. a apólice cobre até 30 meses de aluguel atrasado. quando o
> inquilino dá calote, a seguradora paga, a imobiliária registra o repagamento via
> seguro on-chain. investidor não vê o calote.

**e os 15% sem seguro fiança?**
> ficam como pool separado em produção, com taxa maior. no MVP é single-pool pra
> simplicidade. no roadmap tem tranches senior/junior pra v2.

**por que não fizeram um FIDC tradicional?**
> três coisas. taxa imutável on-chain elimina o golpe da simulação. shares são
> componíveis com outros protocolos defi (próximo passo é mercado secundário). custo
> operacional muito menor que setup de FIDC.

**onde tá o BRZ?**
> stablecoin nativa em solana desde 2021, emitida pela Transfero. mainnet mint
> `FtgGSF...`. em devnet a gente cria um mint próprio só pra demo.

**por que solana e não ethereum/polygon?**
> três motivos. BRZ é nativo aqui (em ethereum não existe). taxa de tx é dois e meio
> centavos, viable pra pagamentos parcelados. blocos de 400ms permitem UX
> sincrônica.

**quem tá no time?**
> sou solo founder. fullstack na Banco Safra, três MCP servers shipados em produção
> no CTX Protocol. piloto comercial via Selectimob, imobiliária da minha mãe.

**quando vai pra mainnet?**
> depende de duas coisas. auditoria do programa (em fila). parceria com plataforma
> CVM 88. estimativa: 60 a 90 dias pós-frontier.

---

## 6. Checklist técnico antes da gravação / apresentação

- [ ] `pnpm app:dev` rodando local em `localhost:3000` (ou produção em domínio)
- [ ] `app/.env.local` com `NEXT_PUBLIC_BRZ_MINT` = mint criado pelo `seed-demo.ts`
- [ ] vault inicializado em devnet (rodar `pnpm demo:seed` se ainda não)
- [ ] wallet privy criada (login uma vez no app pra gerar)
- [ ] saldo brz da demo wallet ≥ 100k (seed-demo cuida disso)
- [ ] solana explorer aberto em outra aba apontando pra devnet + program id
  (`6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94`)
- [ ] obs configurado: 1080p, mic level testado, scenes pré-montadas
- [ ] cronômetro visível pra cortar em 180s
- [ ] três janelas anônimas pré-abertas (uma por persona) pra apresentação ao vivo
- [ ] testado o golden path inteiro pelo menos 1x antes da gravação ou demo

---

## 7. Tags + headline (Colosseum submission)

**tags**: `rwa tokenization` · `lending` · `stablecoin payments` · `oracle`

**headline**:
> "brix unlocks parked capital stuck in future rent by tokenizing insurance-backed
> rental receivables on solana. brazil first, agency-originated, immutable rate."

**proibido como headline** (zero winners no corpus colosseum):
- ❌ smart contract escrow como solution tag
- ❌ lack of transparency como problema (transparência é mecanismo, não headline)
- ❌ high platform fees / high barrier to entry como problema
- ❌ nft como primitive (lift -66%)
