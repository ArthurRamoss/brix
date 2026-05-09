# Demo recording — what you actually click and say

> Tempo de gravação: **45-60s** (corta no edit)
> Estratégia: **pré-gravar**. Faz retakes até ficar limpo, dá play durante o pitch.
> Não tente live demo no palco — Privy modal aparecendo ao vivo é game-over.

---

## Setup (20 min, NÃO gravar)

### 1. Estado limpo
```bash
cd /c/Users/Ramos/Desktop/brix/.claude/worktrees/upbeat-dirac-3901d7
pnpm demo:reset
```
Confirma `✓ vault drained — totalAssets should now be 0`.

### 2. Browser limpo
- **Chrome em janela anônima** (sem extensões dando popup)
- DevTools fechado
- Zoom 100% (Ctrl+0)
- Janela em tamanho fixo: **1440×900** (record settings consistente)
- Bookmarks bar escondido (Ctrl+Shift+B)

### 3. Pré-mint BRZ (gasta 30 segundos, fora da gravação)
Abre `localhost:3000/admin/fund` em uma aba:
- Loga como **investor** (email: `arthurbuzz@gmail.com`)
- Role pra "mint test BRZ" → **mint 50.000 BRZ**
- Logout (link no canto superior direito)
- Loga como **agency** (email diferente, ex: `agency@selectimob.com`)
- Mint 50.000 BRZ pra agency
- Logout

### 4. Pré-cadastra cliente real-looking (fora da gravação)
Loga como agency → `/agency` → tab "clientes" → "novo cliente":
- Nome: **João Silva**
- Email: **joao.silva@email.com** (qualquer)
- Endereço: **Rua Augusta, 1500, São Paulo - SP**
- Salva
- "imóveis vinculados" → "adicionar imóvel"
- Endereço: **Rua Augusta, 1500, ap 42**
- Aluguel mensal: **3000** BRZ
- Salva

Logout.

### 5. Pré-deposito de liquidez (fora da gravação)
Loga como investor → `/invest/deposit`:
- Amount: **20000** BRZ
- Confirma deposito (Privy modal)
- Aguarda ✓ confirmado
- Vai pra `/invest` (vault tab) → confere TVL **= 20.000 BRZ**

Agora você tá pronto. **NÃO logout**. Mantém a aba do investor aberta.

### 6. Tab arrangement (importante pro flow)
Abre **2 abas no mesmo browser**:
- **Aba 1**: `localhost:3000/invest` (logado como investor)
- **Aba 2**: `localhost:3000/agency` (loga agora como agency)

Deixa Aba 1 ativa. Pronto pra gravar.

### 7. Tela de gravação
- **OBS** ou **QuickTime** (Mac) ou **Windows Game Bar** (Win+G)
- Source: tela inteira ou janela do browser
- Áudio: mic ativo, nivelado
- Settings recomendados: 1080p, 30fps, MP4

### 8. Mouse cursor
- **Mac**: System Settings → Accessibility → Display → Pointer size: **150%**
- **Windows**: Settings → Accessibility → Mouse pointer → tamanho **2-3**
- Cursor grande aparece melhor no video

---

## Gravação · click-by-click (45-60s alvo)

> **Dica**: clica devagar. Cada click espera ~1s antes do próximo. Olho calmo.
> Se errar, **continua** — corta no edit. Não para mid-take.

### Cena 1 · Vault em movimento (0:00 → 0:10)

**Tela**: Aba 1 — `/invest` vault tab, TVL 20.000 BRZ visível

**Voz** (over):
> "vault on-chain na Solana. taxa imutável gravada no contrato.
> 20 mil BRZ depositados, esperando virar empréstimo."

**Ações**:
- Mouse **hover** no card "TOTAL VALUE LOCKED" por 1s
- Hover no card "RECENT OPERATIONS" — mostra o deposit que você fez
- Não clica em nada ainda

---

### Cena 2 · Agency registra recebível (0:10 → 0:30)

**Tela**: Switch pra Aba 2 (Ctrl+Tab ou clica)

**Voz** (over):
> "do outro lado, a imobiliária registra um recebível pro João.
> aluguel de 3 mil por mês, 6 meses, taxa 25% ao ano."

**Ações**:
1. Aba 2 já tá em `/agency` — clica tab "**registrar recebível**"
2. Step 1 do wizard:
   - Dropdown "selecionar proprietário" → escolhe **João Silva**
   - Dropdown "imóvel" → seleciona o único disponível
   - "meses" → muda pra **6** (se não tiver default)
   - "taxa anual" → **25%** (se não tiver default)
   - Click "**revisar antes de registrar**"
3. Step 2 (review):
   - Mostra os números na tela: principal R$ 18.000, repayment R$ 20.250, fee 2%
   - Hover no card "TAXA IMUTÁVEL" por 1s — destaca a frase
4. Click "**registrar on-chain**"
5. Privy modal aparece — **clica "approve" rápido** (dá pra editar isso depois pra cortar)
6. Aguarda toast verde "Antecipação confirmada!"

---

### Cena 3 · Vault funda automaticamente (0:30 → 0:42)

**Tela**: Ainda Aba 2 (agency), agora vê portfolio com 1 contrato novo

**Voz** (over):
> "no mesmo bloco, o vault financia. 18 mil BRZ saem do vault,
> chegam na carteira do proprietário. tudo on-chain, sem
> intermediário, sem licença bancária."

**Ações**:
1. Tela vai pra portfolio automaticamente (depois do registro)
2. Mouse hover no contrato "BRX-2026-…" listado
3. Hover no status "funded" (pill verde/dourada)
4. Hover na coluna VALOR → BRZ 18.000

---

### Cena 4 · Investidor vê TVL crescer (0:42 → 0:55)

**Tela**: Switch pra Aba 1 (investor), F5 pra forçar refresh

**Voz** (over):
> "investidor vê em tempo real. utilization sobe pra 90%.
> recebíveis aparecem no vault. taxa de retorno projetada
> calculada do contrato real."

**Ações**:
1. F5 (ou Cmd+R)
2. Espera carregar (~1s)
3. Hover no card "UTILIZATION" → mostra ~90%
4. Hover no card "RECEIVABLES BACKING THE VAULT" → mostra contrato BRX-…
5. Mouse vai pro chart TVL → hover sobre a linha **gold tracejada** (projeção)
6. Hover no footer stat "PROJECTED IN 180D"

---

### Cena 5 · Agency repassa primeira parcela (0:55 → 1:05) — opcional

**Tela**: Switch pra Aba 2 (agency)

**Voz** (over):
> "todo mês, imobiliária processa o aluguel. parcela cai no
> vault, share-price sobe. yield real, sem oracle, sem
> especulação."

**Ações**:
1. Click tab "**registrar repagamento**"
2. Contrato já vem selecionado (único funded)
3. Mostra "valor da parcela: BRZ 3.375" na tela
4. Click "**confirmar repasse**"
5. Privy modal → approve
6. Aguarda toast "Pagamento registrado!"

---

### Cena 6 · Loop final (1:05 → 1:10)

**Tela**: Switch pra Aba 1 → F5

**Voz** (over):
> "TVL passou de 20 mil pra 20 mil e 225. real yield na chain."

**Ações**:
- F5
- Mouse hover no TVL number
- (opcional) hover no chart, vê o pontinho "today" subir

---

## Edit guidance (DaVinci/CapCut/Premiere)

### Cortes obrigatórios
- **Privy modal**: corta o "approve" — fica chato no video. Splice o antes/depois com cross-dissolve 200ms
- **Loading toasts**: se demorar >2s, corta

### Speedup
Toda transição de página > 1s pode ir pra **1.5x ou 2x speed** sem perder.

### Áudio
- Voice-over **separado** da gravação (grava em outro app, sincroniza no edit)
- Música de fundo? **Não.** Distrai. Voz limpa basta.

### Export
- 1080p, MP4, H.264, ~10Mbps
- Mantém em **45-60s** total. Se passar de 60, corta cenas opcionais (5 e 6).

---

## Plan B · Live demo (se preferir)

Se for fazer ao vivo durante o pitch:

1. Mesmo setup (1-7 acima)
2. Tab arrangement: 3 abas — `/invest`, `/agency`, deck (`pitch-deck.html`)
3. Use **trackpad gestures** ou **Cmd+1/2/3** pra trocar abas (mais rápido que mouse)
4. **Não confia em live coding** — se você precisa digitar nome de cliente, vai dar errado. Pré-cadastra **TUDO**, só clica botões durante o demo
5. **Privy approve modal**: pratica 5x antes. Sabe exatamente onde vai estar o botão "approve"

**Risco real**: Privy as vezes pede re-auth (modal extra), Helius rate-limita, click no lugar errado. Pré-gravado elimina isso 100%.

---

## Recovery moves (se algo falhar mid-recording)

| Problema | Ação |
|---|---|
| Privy modal não aparece | F5 + tenta de novo. Se persistir, abrir nova aba anônima e logar de novo |
| RPC 429 / fetch error | Aguarda 5s, F5. Se persistir, corta o take |
| TVL não atualizou | F5 forçado (Ctrl+Shift+R). Cache pode ter pegado fresco |
| Clicou no lugar errado | Não pausa o REC, continua o take, corta no edit |
| Voz embolou | Refaz só a voice-over (separa de imagem) |

---

## Checklist de gravação · imprime e marca

- [ ] `pnpm demo:reset` rodado
- [ ] BRZ mintado pra investor + agency (50k cada)
- [ ] Cliente "João Silva" + imóvel cadastrado
- [ ] Investor pré-depositou 20.000 BRZ
- [ ] 2 abas abertas (investor + agency)
- [ ] Browser em janela anônima, 1440×900
- [ ] Cursor grande (150%)
- [ ] Mic testado (1 take de teste, escutar volume)
- [ ] OBS/QuickTime gravando tela + áudio
- [ ] Cronômetro do celular ao lado
- [ ] Água pertinho
- [ ] **Hit REC**

---

## Fala completa pro voice-over (45-60s, leia pausado)

> "vault on-chain na Solana. taxa imutável gravada no contrato.
> 20 mil BRZ depositados, esperando virar empréstimo.
>
> do outro lado, a imobiliária registra um recebível pro João.
> aluguel de 3 mil por mês, 6 meses, taxa 25% ao ano.
>
> no mesmo bloco, o vault financia. 18 mil BRZ saem do vault,
> chegam na carteira do proprietário. tudo on-chain, sem
> intermediário, sem licença bancária.
>
> investidor vê em tempo real. utilization sobe pra 90%.
> recebíveis aparecem no vault. taxa de retorno projetada
> calculada do contrato real.
>
> todo mês, imobiliária processa o aluguel. parcela cai no
> vault, share-price sobe. yield real, sem oracle, sem
> especulação."

**Cronometra essa fala antes de gravar imagem.** Se passar de 55s, corta a última frase.
