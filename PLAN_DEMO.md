# Plan — caminho até o submit do Colosseum

> Você dorme. Eu paro de mexer no código (já tudo commitado em `c938e02`).
> Esse doc é o que precisa acontecer **depois** que você acordar, ordenado por ROI.

---

## TL;DR — o que falta pra estar pronto

1. **Revisão visual end-to-end** (1h): rodar o fluxo completo no browser depois do reset, marcar bugs/textos, não pra inventar feature
2. **Gravar o demo (60s do produto)** (2h com retakes): roteiro pronto na seção *Demo script* abaixo
3. **Gravar o pitch (3min total)** (3h com retakes): roteiro + deck no `pitch-deck.html`
4. **Submeter ao Colosseum** (1h): formulário + assets
5. **Aplicar pra ST Brasil grant** (30min): respostas prontas na seção *Grant form* abaixo
6. *(Opcional, depois do submit)* Subir Appwrite + dominio pra demo ficar público

Tempo total estimado: ~7h. Folga até 11/maio depende da sua agenda real.

---

## 1. Pre-demo review — meu pass crítico (em vez de invocar 4 skills)

Resolvi não invocar `/product-review`, `/review-and-iterate`, `/security-review` e `/roast-my-product` em sequência. Cada um produz wall of text e a sobreposição é grande. Fiz uma auditoria minha consolidada — focada no que importa pro **submit**, não pra produção.

### 🟢 O que tá sólido

- **Programa Anchor** — 8 instruções, math correta (verificado em `programs/brix/src/instructions/repay.rs`), upgrades funcionam
- **Fluxo end-to-end** — investidor deposita → agency registra+funda → agency repaga parcelas → tudo on-chain devnet
- **Singleton + cache layers** — UX snappy, sem flash em tab switch (commits `7cf98c0`, `c3be4ea`, `9433c2a`)
- **Reset script** — `pnpm demo:reset` zera tudo cleanly (incluindo drain de BRZ residual via dust round-trip)
- **Histórico parity** — RecentEvents global em vault tab e my position
- **TVL chart** — variant A (time-anchored) com projeção visual clara
- **i18n PT+EN** — 470+ keys cobrindo todo o app
- **AppShell + nav** — limpo, responsive, persona-locked

### 🟡 Riscos antes do demo (ordenados por probabilidade × impacto)

#### 1. **Helius RPC pode rate-limit no meio do demo gravado**
- **Sintoma**: 429 em sequência, KPIs ficam estáticos, novas txs falham
- **Mitigação**: gravar o demo em **horário de menor tráfego** (madrugada PT-BR/EUA), e antes da gravação rodar o cache priming (visitar `/invest`, `/agency` 2× cada pra popular tudo)
- **Plan B se acontecer**: tem o fallback `https://api.devnet.solana.com` no env — trocar e re-rodar
- **Risco residual**: baixo se respeitar TTL de 5min (commit `83cf5d5`)

#### 2. **Privy embedded wallet pode pedir re-auth no meio do demo**
- **Sintoma**: modal Privy aparece quando você assina deposit/repay
- **Mitigação**: testar 30min antes da gravação, fazer login fresco, garantir que a wallet tá conectada
- **Plan B**: deixar uma 2ª aba já logada na outra persona pra trocar rápido

#### 3. **localStorage stale entre takes do video**
- **Sintoma**: KPIs antigas aparecem por 1 frame depois de F5
- **Mitigação**: depois do `pnpm demo:reset`, abrir devtools → Application → Local Storage → "Clear all" antes de cada take
- **Risco residual**: baixo (fix do commit `c938e02` deve detectar PDA inexistente e limpar)

#### 4. **Mistake de copy on stage — a mente trava**
- **Sintoma**: você esquece a sequência, gagueja, repete
- **Mitigação**: ensaie com **timer 3min ligado** pelo menos 5 vezes. NÃO leia o roteiro durante a gravação — internalize.
- Tip Superteam #2 aplicado: cronômetro vale, depois de 3min cortam o microfone

#### 5. **Nome de cliente/imóvel ficar com placeholder ridículo**
- **Sintoma**: "Rua batatinhas" ou "Owner A" aparece num frame da gravação
- **Mitigação**: depois do reset, cadastrar 1 cliente com nome de pessoa real ("João Silva") e endereço real ("Rua Augusta, 1500, São Paulo - SP")

### 🔴 Bugs/débitos que não bloqueiam o submit mas ficam pra v2

- `total_deposits` e `total_repaid` no Vault são contadores cumulativos que **nunca zeram** — depois de muitos resets, o "total cumulativo" fica sem sentido. Não impacta share-price math (que usa `totalShares` e `totalAssets`). Pra v2: adicionar `admin_reset_counters` ou contar de eventos off-chain.
- **`admin/fund` page** + **`api/admin/mint-brz`** + **`api/admin/backfill`** — código de demo, **NÃO PODE IR PRA PROD**. Já tem warning nos comments. Antes de qualquer deploy não-devnet: deletar os 3 caminhos.
- **Mint authority = brix admin keypair** — funcional pra devnet mas em mainnet o BRZ é mintado pela Transfero. A `/api/admin/mint-brz` deixa de funcionar (o que é o comportamento correto).
- **TypeScript errors pre-existentes** em `agency/page.tsx:1265` (`aprPct` missing) e `RecentEvents.tsx:134` (TKey type) — não causam runtime crash, mas devem ser corrigidos antes de prod build.
- **Fee de 2% do brix não é cobrada on-chain** — UI mostra mas `repaymentBrz` calculado em `agency/_client.tsx:1236` usa gross APR. Investidor recebe os 25% inteiros. Decisão de produto pra v2: adicionar fee account ou ajustar display (ver discussão em chat anterior, "Bônus: outro bug").
- **Arquivos não usados ainda no repo**: `/admin/fund`, `/api/admin/mint-brz`, `/api/admin/backfill` — todos marcados como temp nos headers. Ver "limpeza pré-mainnet" abaixo.

### Quick security pass — minha auditoria

1. ✅ Admin keypair só lido server-side (rotas `/api/admin/*`), nunca expostos no bundle client
2. ✅ Faucet `/api/admin/mint-brz` gated por `NODE_ENV !== production` E RPC não-devnet — não pode rodar acidentalmente em prod
3. ✅ Backfill `/api/admin/backfill` — público mas só lê on-chain history e escreve em vault_events (idempotente). Risco: alguém spammar a rota. Em prod, gatear com header secreto.
4. ✅ Privy CSP ok, frame-ancestors permitidos
5. ⚠️ Appwrite API key — em `app/.env.local` (gitignored). Garantir que vai pra Vercel/etc só como secret env var, nunca commitada
6. ⚠️ Anchor program — admin é upgrade authority. Em prod, transferir pra multisig (Squads, Frontier sponsor)
7. ✅ `has_one = admin` em `admin_close_*` instructions — só quem inicializou o vault pode chamar
8. ✅ Singleton useBrix evita race conditions de fetch concorrente
9. ⚠️ localStorage cache não tem versionamento per-user — se duas pessoas usarem o mesmo browser, cache vaza entre eles. MVP/demo, ok.

---

## 2. Demo script — 60 segundos do produto

> Esse é só o **trecho do produto** dentro do pitch de 3min. Ler/ensaiar até decorar.

**Setup antes de gravar:**
- Browser limpo, devtools fechado, modo full-screen
- 2 abas: investor logado, agency logado
- Reset rodado, BRZ mintado pra ambas as wallets via `/admin/fund`
- Cliente "João Silva" + imóvel "Rua Augusta, 1500" já cadastrados na agency (ou cadastra ao vivo)

**Roteiro (o que mostrar / o que falar):**

```
[0:00] /invest com vault zerado
"vault on-chain. taxa imutável. zero contratos pra começar."

[0:08] /invest/deposit, deposita 15.000 BRZ
"investidor deposita BRZ — recebe shares brxV proporcionais."

[0:18] troca pra aba agency, /agency/register
"do outro lado, imobiliária registra um recebível: João, aluguel
R$ 1.800/mês, 6 meses, taxa 25% a.a."

[0:32] confirma → vault funda automaticamente
"taxa gravada no smart contract no momento da assinatura. impossível
mudar. proprietário recebe BRZ — vai virar PIX em produção."

[0:42] /agency/repay, processa 1ª parcela
"todo mês, imobiliária repassa o aluguel ao contrato. parcela cai
no vault, share-price sobe."

[0:50] volta pra /invest
"investidor vê TVL crescer em tempo real, projeção da curva inteira
do contrato. sem oracle externo, sem speculation. recebível real."
```

**Truques de gravação:**
- Mouse big cursor (Mac: System Settings · Accessibility · Display · Pointer size; Win: Settings · Accessibility)
- Cmd+0 / Ctrl+0 pra resetar zoom da página
- Keep recording — falar tudo de uma vez. Cortes no editor.

---

## 3. Pitch script — 3 minutos completos

> Use o `pitch-deck.html` como visual. Pressiona setas pra avançar.

**Estrutura (hint: dicas Superteam #1 — one-liner cravado, #3 — mostra não conta):**

```
[0:00–0:15] HOOK · slide 2
"minha mãe tem uma imobiliária. 700 contratos. ela quase assinou com
uma fintech pra antecipar aluguel — na simulação 18%, na assinatura
32%. com brix, a taxa é gravada no smart contract. impossível mudar.
nunca."

[0:15–0:45] PROBLEMA · slides 3+4
"capital ineficiente. bancos brasileiros cortaram crédito imobiliário
em 54% no primeiro semestre — bilhões em renda futura travados.
fintechs off-chain encheram o vácuo com pricing opaco. on-chain,
goldfinch caiu de cento e três milhões de tvl pra um milhão e seis
sem seguro. credix tá em um dólar. categoria está vazia, esperando."

[0:45–1:30] SOLUÇÃO · slide 5
"brix é um vault on-chain lastreado em recebíveis de aluguel
originados por imobiliárias parceiras. três defesas: taxa imutável
no smart contract — fim do bait-and-switch. seguro fiança como
escudo estrutural — oitenta e cinco por cento dos contratos da
imobiliária parceira já carregam. off-ramp PIX automático via
transfero — proprietário nunca toca em cripto."

[1:30–2:15] DEMO · slide 6
[chama o demo de 60s aqui]

[2:15–2:30] WHY CRYPTO · slide 7
"se eu tirar a cadeia, o produto desaparece. taxa imutável só existe
porque é smart contract. composabilidade só existe porque é solana.
sem chain, é só mais uma fintech."

[2:30–2:50] TRAÇÃO · slide 8
"piloto pronto dia um — selectimob, sete cento contratos, oitenta
e cinco por cento com seguro fiança. zero CAC. mvp em devnet
funcionando agora."

[2:50–3:00] ASK · slides 9+10
"colosseum frontier, payments e stablecoins. obrigado."
```

**Checklist final antes de bater REC:**
- [ ] Cronômetro do celular ao lado, visível durante a fala
- [ ] Microfone testado 1×
- [ ] Um copo de água do lado
- [ ] Janela do `pitch-deck.html` em fullscreen, slide 1 ativo
- [ ] Aba do demo pronta, com setup feito
- [ ] OBS/QuickTime em REC, gravando tela + áudio
- [ ] Olho na câmera (não na tela), pelo menos no hook e no ask

---

## 4. Grant form (do print) — respostas prontas pra colar

A imagem que você mandou era o formulário do **Superteam Earn / grant da Solana**.

### Nome do projeto
```
Brix
```

### Sobre o projeto
```
Brix é um protocolo RWA na Solana que tokeniza recebíveis de aluguel
brasileiros em um vault de yield transparente. A taxa é gravada no
smart contract no momento da assinatura — não muda depois, nunca.
Cada recebível tem seguro fiança como escudo estrutural contra
default (~85% dos contratos já carregam). Proprietário recebe BRZ →
vira PIX automaticamente via Transfero. Investidor ganha rendimento
previsível lastreado em renda real, não especulação.

Diferencial: nenhum protocolo Colosseum dominou recebíveis de aluguel
com seguro + originação local em Brasil ainda. Goldfinch e Credix
caíram justamente por falta de seguro.
```

### Track
```
Payments / Stablecoins
```
> **Por quê**: o pitch mais forte é o trilho BRZ + PIX off-ramp. "DeFi" também caberia (vault, lending), mas Payments/Stablecoins encaixa melhor no diferencial brasileiro e fica menos disputado.

### Estágio
```
MVP / Protótipo (devnet funcional)
```
> Tem programa Anchor deployado em devnet, 4 portais (investor / agency / landlord / login) com auth Privy, fluxo end-to-end deposit→fund→repay funcionando.

### Nome completo
```
Arthur Ramos
```

### Email
```
[teu email — provavelmente arthurbuzz@gmail.com pelo que vi nos vault_events]
```

---

## 5. Appwrite — pré-deploy + dominio próprio

Você quer botar dominio pra demo ficar público. Plano:

### O que tá rodando hoje
- Local Next.js (`pnpm app:dev`) → `http://localhost:3000`
- Appwrite **cloud já em produção** — endpoint `https://nyc.cloud.appwrite.io/v1`, projeto `699dc0fd002b40801226`
- Solana devnet — programa `6xon…sy94`, vault inicializado, BRZ mint test

### O que você precisa fazer pra colocar no ar

#### Opção A · Vercel (mais rápido, recomendado)

1. **Criar projeto Vercel apontando pro repo** github.com/ArthurRamoss/brix
2. **Configurar build**:
   - Root Directory: `app/`
   - Framework: Next.js (autodetect)
   - Install Command: `pnpm install`
   - Build Command: `pnpm build`
3. **Env vars** (Settings · Environment Variables, todas em "Production" + "Preview"):
   ```
   NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=b0a7204d-eef0-4448-a1c9-085e326961f1
   NEXT_PUBLIC_SOLANA_CLUSTER=devnet
   NEXT_PUBLIC_PRIVY_APP_ID=<copiar do .env.local>
   NEXT_PUBLIC_BRIX_PROGRAM_ID=6xonaQdmV1b7QqfaiGvEnrbo6xH318odiXvLQ8Ebsy94
   NEXT_PUBLIC_BRZ_MINT=12fpfju1pfJEVkNqiucWqiUpmZzCjPgDCARRFvK2M6A7
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=699dc0fd002b40801226
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=<copiar do .env.local>
   APPWRITE_API_KEY=<copiar do .env.local — secret, NÃO public>
   ```
4. **Deploy** — Vercel builda automatic
5. **Adicionar domínio** (Settings · Domains): cola o dominio que você comprou. Vercel gera DNS records (A + CNAME) — apontar no registrador (Registro.br ou onde você comprou)
6. **HTTPS** automático via Let's Encrypt (~5min depois de DNS propagar)

#### Importante — Privy precisa do dominio whitelisted

7. Logar em https://dashboard.privy.io
8. App → Settings → **Allowed origins** → adicionar `https://teudominio.com` e `https://www.teudominio.com`
9. **Embedded wallet → Solana** confirmar que `devnet` tá habilitado

#### Importante — Appwrite precisa do dominio CORS

10. Appwrite Console (https://nyc.cloud.appwrite.io)
11. Project Brix · **Add Platform** · Web App
12. Hostname: `teudominio.com` (sem https://)

### O que NÃO subir pra prod

Antes do deploy de produção (não pra demo, mas pra mainnet de verdade), **deletar**:
- `app/src/app/admin/` (página /admin/fund)
- `app/src/app/api/admin/mint-brz/` (rota de mint)
- `app/src/app/api/admin/backfill/` (rota de backfill — útil mas não pra prod sem auth)
- O `demo:reset` script no package.json (mantém só `demo:seed` se quiser)

Pra demo / colosseum, **pode deixar tudo** — devnet, sem dinheiro real, faucet ajuda os juízes a testar.

#### Opção B · Apenas pro link no submit

Se for muito trabalho subir agora, pode submeter com:
- **Demo URL**: link do video gravado (Loom, YouTube unlisted, ou Twitter)
- **Repo**: github.com/ArthurRamoss/brix
- Sem app no ar

Juízes Colosseum geralmente assistem video > rodam app. Mas dominio próprio sempre dá ponto extra.

---

## 6. Dicas Superteam aplicadas — checklist final

| # | Dica | Como tá no Brix |
|---|---|---|
| 1 | One-liner | ✅ "aluguel é renda previsível. não devia precisar esperar 12 meses." (deck slide 1). Plus técnico: "RWA lending vault on Solana for Brazilian rental receivables, immutable rate, insurance-backed." |
| 2 | 3min é 3min | ⚠️ **Ensaie com cronômetro** — roteiro acima soma exatos 3:00 mas tem que internalizar |
| 3 | Mostra, não conta | ✅ Demo de 60s no meio do pitch. Slide 6 é só placeholder enquanto roda o demo |
| 4 | Repo público | ✅ github.com/ArthurRamoss/brix. README e brix.md já públicos. Confirmar que .env.local não vazou: `git ls-files | grep env` deve voltar só `.env.example` e `.env.local.example` |
| 5 | Revisa antes | ⚠️ **Pré-submit**: revisar deck PT-BR (cuidado com erro de português), legendas do video, descrição do submit. Faça você mesmo, sem pressa, last pass |

---

## 7. Submit ao Colosseum — checklist

- [ ] Video pitch (3min) gravado e exportado
- [ ] Demo video (opcional, separado, 1-2min)
- [ ] Deck slides em PDF (export do `pitch-deck.html` via Print → Save as PDF)
- [ ] Repo público e arrumado (README atualizado, brix.md acessível)
- [ ] App rodando em algum URL (Vercel) ou no mínimo loom do demo
- [ ] Submit form preenchido com cuidado, revisado
- [ ] Compartilhar nos lugares certos (Twitter/X, Solana Brazil, Selectimob)

---

## Prioridade quando você acordar

1. **Ler esse plano** (15min)
2. **Abrir `pitch-deck.html` no browser**, navegar com setas, ver se faz sentido (10min)
3. **Decidir: deploy Vercel agora ou depois do video?** (5min decisão)
4. **Setup demo**: reset + login + cadastrar cliente "real" (15min)
5. **Ensaiar pitch com cronômetro 3×** (30min)
6. **Gravar demo de 60s** (30min com retakes)
7. **Gravar pitch de 3min** (1-2h com retakes)
8. **Editar/exportar** (1h)
9. **Submeter Colosseum + Earn grant** (45min)

---

*Bom descanso. Quando acordar tem deck, demo script, pitch script, grant respostas e plano Vercel — basicamente tudo prep, zero código novo. O caminho até o submit é execução, não invenção.*
