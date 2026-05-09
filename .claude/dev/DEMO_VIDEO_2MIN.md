# Demo video · 2min · 2 personas · voiceover-ready

> **Estratégia**: você grava SOMENTE a tela (sem áudio). Faz voiceover separado em outro app (Audacity/Voice Memos), sincroniza no edit.
> **Por quê**: voiceover gravado separado fica MUITO mais limpo que mic + screen capture juntos. E você pode refazer linhas isoladas sem regravar a tela.

---

## Setup PRÉ-gravação (15min, off-camera)

1. `pnpm demo:reset` — vault zerado
2. Abrir https://brixprotocol.com em janela anônima Chrome (1440×900)
3. Logar como **investor** (`arthurbuzz@gmail.com`) → `/admin/fund` → mint **50.000 BRZ**
4. Logout, logar como **agency** (segundo email) → `/admin/fund` → mint **50.000 BRZ**
5. Continuando como agency: `/agency` → tab "clientes" → cadastrar:
   - Nome: **João Silva**, email: `joao.silva@email.com`
   - Endereço: **Rua Augusta, 1500, São Paulo - SP**
   - Aluguel: **3.000** BRZ
6. Logout
7. Logar de novo como **investor** → `/invest/deposit` → depositar **20.000 BRZ** (cria liquidez inicial)
8. Logout
9. Mantém 2 abas Chrome abertas:
   - Aba A: brixprotocol.com (não logada — ou logada como investor)
   - Aba B: brixprotocol.com (logada como agency)

Cursor grande (Mac: 150% / Win: tamanho 3). Bookmarks bar escondido. Devtools fechado.

---

## Linha do tempo — 2:00 total

| Time | Quem | O que aparece na tela | Voiceover |
|---|---|---|---|
| **0:00–0:08** | — | Logo brix + tagline | "brix. recebíveis de aluguel, on-chain." |
| **0:08–0:50** | INVESTIDOR | walkthrough investor | 4 frases curtas (~10s cada) |
| **0:50–1:40** | IMOBILIÁRIA | walkthrough agency | 5 frases curtas (~10s cada) |
| **1:40–2:00** | — | TVL crescendo + URL final | 2 frases (~10s cada) |

---

## Cena 1 · Abertura (0:00–0:08, 8s)

**Tela:**
- Aba A em **brixprotocol.com** (landing page). Hover na logo no header por 2s.
- Cut.

**Voice:**
> "brix. recebíveis de aluguel, on-chain. seu primeiro vault de yield previsível em solana, com taxa imutável."

(Uma frase só, calma. ~6s.)

---

## Cena 2 · Persona Investidor (0:08–0:50, 42s)

### Beat 2.1 (0:08–0:18, 10s) — entrar e ver o vault

**Tela:**
- Click "investidor" / loga
- Pousa em `/invest` — vault tab
- Hover por 2s no card "TOTAL VALUE LOCKED" (mostra 20.000 BRZ pré-depositado)
- Hover no chart (gold projetado)

**Voice:**
> "como investidor, eu deposito BRZ e financio antecipações de aluguel.
> 20 mil BRZ depositados, TVL crescendo, projeção em gold mostra o yield futuro."

### Beat 2.2 (0:18–0:32, 14s) — modal de deposit em ação

**Tela:**
- Click no botão "+ depositar" (gold)
- Modal abre — hover 1s no passo 1 (gold)
- Click "mintar 50.000 BRZ (demo)" — aguarda toast verde "✓"
- Hover 1s no passo 2 (teal)
- Click "ir pro depósito →"

**Voice:**
> "fluxo em dois passos. primeiro adiciono BRZ na carteira — em produção isso vai ser
> integração Transfero, comprar via PIX. agora, depósito vai pro vault. taxa imutável
> gravada no smart contract no momento da assinatura."

### Beat 2.3 (0:32–0:50, 18s) — assinar deposit + ver position

**Tela:**
- Em `/invest/deposit`, amount já vem com BRZ. Tipo **5000** BRZ
- Click "confirmar depósito"
- Privy modal abre → click approve (vai cortar isso depois)
- Toast verde "depósito confirmado"
- Click tab "minha posição"
- Hover 2s nos KPIs: DEPOSITED 25.000 / VALUE 25.000 / SHARES 25000.00
- Hover no histórico mostrando o deposit recém-feito

**Voice:**
> "shares brxV emitidas proporcional ao depósito. minha posição atualiza em tempo real:
> 25 mil depositados, 25 mil shares. share-price valoriza conforme parcelas dos
> recebíveis vão chegando no vault."

---

## Cena 3 · Persona Imobiliária (0:50–1:40, 50s)

### Beat 3.1 (0:50–1:00, 10s) — portfolio overview

**Tela:**
- Switch pra Aba B (agency, já logada) — `/agency` tab portfolio
- Hover nos 4 KPIs no topo (zero, vazio)
- Hover na status strip "aguardando 1ª parcela / em curso / liquidados" (todos zero)

**Voice:**
> "do outro lado, a imobiliária. portfolio limpo, zero contratos. ponto de partida.
> agora a Selectimob registra um recebível pro João Silva."

### Beat 3.2 (1:00–1:25, 25s) — registrar recebível

**Tela:**
- Click tab "registrar recebível"
- Step 1 do wizard:
  - Dropdown "selecionar proprietário" → **João Silva** (já cadastrado)
  - Dropdown "imóvel" → único disponível (Rua Augusta)
  - Months → **6**
  - Taxa anual → **25**%
  - Hover 1s no pill "TAXA IMUTÁVEL" gold
  - Click "revisar antes de registrar"
- Step 2 (review):
  - Hover nos números: principal R$ 18.000 · repayment R$ 20.250 · fee 2%
  - Click "registrar on-chain"
- Privy approve (cortar)
- Toast "Antecipação confirmada!"

**Voice:**
> "aluguel de 3 mil por mês, 6 meses, taxa de 25 por cento ao ano. taxa GRAVADA
> no contrato — não muda depois, nunca. principal de 18 mil sai do vault automaticamente
> e cai na carteira do proprietário. tudo on-chain, sem licença bancária."

### Beat 3.3 (1:25–1:40, 15s) — repassar 1ª parcela

**Tela:**
- Click tab "registrar repagamento"
- Contrato já vem selecionado (BRX-…)
- Mostra "valor da parcela: BRZ 3.375" na tela por 1.5s
- Click "confirmar repasse"
- Privy approve (cortar)
- Toast "Pagamento registrado!"
- Volta pra tab "portfolio" — mostra status strip atualizado: "0 / 1 / 0" (em curso)

**Voice:**
> "todo mês, imobiliária processa o aluguel do inquilino. parcela cai no vault,
> share-price sobe. yield real, lastreado em renda real, sem oracle, sem especulação."

---

## Cena 4 · Loop final (1:40–2:00, 20s)

### Beat 4.1 (1:40–1:50, 10s) — investidor vê TVL crescer

**Tela:**
- Switch pra Aba A (investor) — F5
- Hover 2s no card TVL (agora 25.000 + 225 = 25.225 BRZ)
- Hover no chart — pontinho "today" subiu

**Voice:**
> "investidor vê em tempo real. TVL passou de 25 mil pra 25 mil e 225, exatamente o
> juros da primeira parcela."

### Beat 4.2 (1:50–2:00, 10s) — outro

**Tela:**
- Cut pra logo brix em fundo escuro (pode ser o slide 10 do `pitch-deck.html`)
- Mostra **brixprotocol.com** + **github.com/ArthurRamoss/brix**

**Voice:**
> "brixprotocol.com. devnet ao vivo agora. solana frontier 2026."

---

## Voice-over completo (texto contínuo, ~110s)

Pra você ler tudo em sequência e cronometrar antes:

> brix. recebíveis de aluguel, on-chain. seu primeiro vault de yield previsível em
> solana, com taxa imutável.
>
> como investidor, eu deposito BRZ e financio antecipações de aluguel. 20 mil BRZ
> depositados, TVL crescendo, projeção em gold mostra o yield futuro.
>
> fluxo em dois passos. primeiro adiciono BRZ na carteira — em produção isso vai ser
> integração Transfero, comprar via PIX. agora, depósito vai pro vault. taxa imutável
> gravada no smart contract no momento da assinatura.
>
> shares brxV emitidas proporcional ao depósito. minha posição atualiza em tempo real:
> 25 mil depositados, 25 mil shares. share-price valoriza conforme parcelas dos
> recebíveis vão chegando no vault.
>
> do outro lado, a imobiliária. portfolio limpo, zero contratos. ponto de partida.
> agora a Selectimob registra um recebível pro João Silva.
>
> aluguel de 3 mil por mês, 6 meses, taxa de 25 por cento ao ano. taxa GRAVADA
> no contrato — não muda depois, nunca. principal de 18 mil sai do vault automaticamente
> e cai na carteira do proprietário. tudo on-chain, sem licença bancária.
>
> todo mês, imobiliária processa o aluguel do inquilino. parcela cai no vault,
> share-price sobe. yield real, lastreado em renda real, sem oracle, sem especulação.
>
> investidor vê em tempo real. TVL passou de 25 mil pra 25 mil e 225, exatamente o
> juros da primeira parcela.
>
> brixprotocol.com. devnet ao vivo agora. solana frontier 2026.

**Cronometra essa fala lendo pausado.** Alvo: **110-115 segundos**. Se passar de 115s, corta a frase do meio do beat 2.2 ("em produção isso vai ser integração Transfero...").

---

## Workflow de gravação · etapas

1. **GRAVA TELA SEM ÁUDIO** — OBS / QuickTime. Faz a sequência 4 cenas seguindo o roteiro acima. Se errar, continua, corta no edit.
2. **GRAVA VOICEOVER SEPARADO** — Audacity / Voice Memos. Lê o texto pausado, faz takes até ficar bom. Exporta MP3.
3. **EDITA** (DaVinci Resolve free / CapCut):
   - Importa video da tela + áudio do VO
   - Sincroniza marcando os beats (2.1, 2.2, etc)
   - Corta os Privy modals
   - Speedup transições lentas (>1s) pra 1.5×
   - Adiciona crossfade 200ms entre beats
   - Cut to logo final
4. **EXPORTA** — MP4 H.264, 1080p, ~10Mbps

---

## Plan B · se não conseguir gravar tela limpa

Se o demo ao vivo der problema (Privy / Helius / etc), opção alternativa:

- Gravar **só os screenshots-chave** com câmera lenta (1-2 segundos cada, ~10 frames)
- Adicionar transições + texto sobreposto
- Voiceover completo sobre as imagens

Menos impressionante mas funcional. **Não recomendo a menos que o ao vivo falhe**.

---

## Quer que eu monte um Remotion?

Se você decidir que o video real do app é arriscado demais ou tem visual fraco, posso scaffoldar um projeto Remotion (motion graphics) com:
- Logo animado
- TVL counter subindo
- Cards das 2 personas com transições
- Logo final + URL

Tempo: ~45min coding + 10min render. Output: MP4 final, sem precisar gravar tela.

Não recomendo pra agora — juízes Colosseum dão valor pro "app real funciona", mas é opção se a gravação estiver caótica.
