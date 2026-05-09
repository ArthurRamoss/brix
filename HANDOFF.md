# Handoff — TVL chart polish + backfill

## Estado atual

Última sessão fez:
- Reverteu layout `/invest` p/ chart grandao na esquerda, coluna direita com 3 cards (Util KPI + Actions + RecentEvents).
- Adicionou projeção no TVLChart (linha tracejada teal opacity .55, marcador vertical "today").
- X-axis label dinâmica: `histórico · hoje · projetado` quando há projeção, senão `60d/45d/30d/15d/today`.
- Footer com 3 stats embaixo do chart (eventos, entrada projetada, contratos ativos).
- Criou `/api/admin/backfill` (POST `{pubkey,email}`) — varre `getSignaturesForAddress` + diff de BRZ pre/post → insere `vault_events` faltantes.

User reclamou que:
1. Card do chart tem altura **menor** que os 3 cards da direita combinados → desbalanceado.
2. Legenda atual (apenas 3 spans no rodapé) está confusa/ilegível, não diferencia bem realizado vs projetado.
3. Projeção precisa de **cor distinta** (não só teal-fade) + **legenda explícita** com swatch.
4. Curva da projeção sobe em degraus de 30d (1 ponto por parcela) → quer mais densidade visual.

## Pendente (próxima sessão)

### 1. TVLChart.tsx — legenda + cor projeção
Arquivo: `app/src/components/primitives/TVLChart.tsx`

- **Trocar cor da projeção** de `oklch(0.78 0.12 195)` (teal-fade) para `var(--gold)` ou âmbar tipo `oklch(0.80 0.14 75)`. Mantém dashed mas fica visualmente claro = "outra coisa".
- **Adicionar legenda no topo** (acima do SVG), substituindo o rodapé `histórico · hoje · projetado`. Formato:
  ```
  ▬ realizado    ┄ ┄ projetado
  (teal sólido)   (gold tracejado)
  ```
  Inline flex, fontSize 11, gap 16, swatches 12×2 retangulinhos.
- **Remover** o componente `ChartXLabels` antigo (ou simplificar pra só mostrar "today" no marcador).
- **Densificar projeção**: em vez de 1 ponto por parcela, interpolar lineares no `projectionSeries` do invest/page.tsx — gerar 1 ponto **por dia** entre instalments (mantém o degrau real mas suaviza visualmente). Alternativa mais simples: deixar como está e adicionar pontos vazios entre cada inflow pra que o gráfico ocupe mais largura.

### 2. invest/page.tsx — altura do card
Arquivo: `app/src/app/invest/page.tsx` linha ~237

Card do chart precisa esticar pra altura dos 3 cards da direita:
- Coluna direita atualmente é `display: flex, flexDirection: column, gap: 16` com KPI + Actions Card + RecentEvents Card.
- Soluções:
  - **Opção A** (CSS grid stretch): no grid pai (linha ~228) já tem `alignItems: "start"` — trocar pra `alignItems: "stretch"`. Card esquerdo precisa ser `display: flex, flexDirection: column` pra distribuir espaço internamente. Footer stats no rodapé empurrado pra baixo via `marginTop: auto`.
  - **Opção B** (fixed height): medir altura real dos 3 cards juntos (~460px) e setar `minHeight: 460` no card do chart. Mais simples mas frágil.

Recomendo A. Ajusta também a altura do SVG (`h = 200` no TVLChart) — pode subir pra `h = 280` ou aceitar prop `height`.

### 3. Densificar projeção (invest/page.tsx ~157)
Trocar o `projectionSeries`:
```ts
// Em vez de 1 ponto por parcela:
return inflows.map((inflow, i) => {
  running += inflow.amount;
  return { d: startD + i + 1, value: running };
});

// Fazer 1 ponto por dia:
const lastDay = Math.ceil((inflows[inflows.length-1].ts - now) / dayMs);
const series: { d: number; value: number }[] = [];
let pointer = 0;
let running = lastTvl;
for (let day = 1; day <= lastDay; day++) {
  const tCutoff = now + day * dayMs;
  while (pointer < inflows.length && inflows[pointer].ts <= tCutoff) {
    running += inflows[pointer].amount;
    pointer++;
  }
  series.push({ d: startD + day, value: running });
}
return series;
```

### 4. Rodar backfill
User logou como investor `6nqHUjFF1vPctYxUF86mmwMDGpHAfBM7mzm37SbJcCqc` (email `arthurbuzz@gmail.com`). Tem deposits/withdraws antigos que não estão em `vault_events`. Rodar:

```bash
curl -X POST http://localhost:3000/api/admin/backfill \
  -H "Content-Type: application/json" \
  -d '{"pubkey":"6nqHUjFF1vPctYxUF86mmwMDGpHAfBM7mzm37SbJcCqc","email":"arthurbuzz@gmail.com","limit":200}'
```

Resposta vai listar `inserted: N`. Depois disso o "histórico de operações" em `/invest?tab=positions` deve mostrar os deposits passados.

## Arquivos relevantes (já lidos nessa sessão)

- `app/src/components/primitives/TVLChart.tsx` — 174 linhas, SVG + ChartXLabels component
- `app/src/app/invest/page.tsx` — 1041 linhas, contém VaultDashboard + DepositTab + WithdrawTab + PositionsTab + FooterStat + Row2
- `app/src/lib/i18n.tsx` — 1304 linhas, PT+EN dicts. Strings já adicionadas: `inv_chart_past`, `inv_chart_today`, `inv_chart_projected`, `inv_chart_stat_*`, `inv_recent_events`, `inv_history_*`
- `app/src/app/api/admin/backfill/route.ts` — 219 linhas, rota pronta

## Cuidados

- App AGENTS.md avisa que esse Next é **não-padrão** (versão 16.2.4 turbopack). Antes de mexer em route handlers ou file conventions, ler `node_modules/next/dist/docs/`.
- BigInt+PublicKey serializer em `cache.ts` é frágil — não toque.
- Helius RPC key visível em URL (MVP, ok).
