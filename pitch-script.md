# Brix — pitch script (3 min)

> draft pra CP4. estrutura segue `brix.md` seção "Pitch video". tom segue
> `.agents/tone-guide.md` (lowercase, sem em-dash, dados em vez de adjetivos).
> testar voz alta com cronômetro antes de gravar; ajustar onde sobrar/faltar tempo.

**tempo total**: 180s · **deadline**: colosseum frontier 2026-05-11 · **canal**: youtube unlisted

---

## opção A — pitch 100% em inglês (recomendado pra colosseum)

### 1. hook (15s)

> my mother runs a real estate agency in brazil. 700 active rental contracts. last year
> she almost signed with a fintech to advance future rent. simulation: 18 percent.
> contract day: 32 percent. with brix the rate is written into the smart contract at
> signing. impossible to change.

### 2. macro problem (30s)

> brazilian banks cut real estate credit by 54 percent in the first half of 2025.
> 9 billion reais. that capital used to fund property owners. now it's gone.
>
> 13 million households rent in brazil. property owners hold predictable future rent
> they can't access at fair terms. existing off-chain players advance rent at 36 to 60
> percent annual. opaque. bait-and-switch on the rate.

### 3. why on-chain breaks too (20s)

> rwa lending tried this on solana. goldfinch hit 103 million tvl. dropped to 1.6 million.
> killed by uninsured defaults. credix raised 11 million. sits at 1 dollar tvl today.
>
> the gap is structural. defillama solana rwa lending is nearly empty.

### 4. solution (30s)

> brix tokenizes brazilian rental receivables on solana with three layers of collateral.
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
> [/invest] investor deposits 50 thousand brz into the vault. tvl updates. shares minted.
>
> [/agency] selectimob registers a 9.6k receivable for owner A. one click triggers
> register_receivable then fund_landlord. owner A receives BRZ. in production this
> off-ramps to PIX via transfero.
>
> [/agency] tenant pays selectimob. selectimob calls repay on-chain. the vault grows by the
> interest portion. owner A's debt closes.
>
> [/invest] investor withdraws. burns shares. receives principal plus pro-rata interest.
> annualized rate visible on screen. tx hashes link to solana explorer.
>
> one wallet. real signatures via privy embedded wallet. real spl transfers. devnet brz mint
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

## opção B — hook em PT-BR (entrega emocional autêntica), resto em inglês

mesmo script, mas a seção 1 é falada em português, com legenda em inglês:

```
PT-BR (falado):
"minha mãe tem uma imobiliária. 700 contratos. ano passado ela quase assinou com uma
fintech pra antecipar aluguel. na simulação, 18 por cento. na hora de assinar, 32.
com brix, a taxa é gravada em smart contract. impossível de mudar."

EN (legenda na tela):
"my mother runs a real estate agency. 700 contracts. last year she almost signed with
a fintech to advance future rent. simulation: 18%. contract day: 32%. with brix the
rate is written into the smart contract. impossible to change."
```

vantagem: entrega autêntica, emoção real. risco: pode soar amador se a edição não
estiver boa. recomendação: tentar uma take cada e comparar.

---

## checklist técnico antes da gravação

- [ ] `pnpm app:dev` rodando local em `localhost:3000`
- [ ] `app/.env.local` com `NEXT_PUBLIC_BRZ_MINT` = mint criado pelo `seed-demo.ts`
- [ ] vault inicializado em devnet (rodar `pnpm demo:seed` se ainda não)
- [ ] wallet privy criada (login uma vez no app pra gerar)
- [ ] saldo brz da demo wallet ≥ 100k (seed-demo cuida disso)
- [ ] solana explorer aberto em outra aba apontando pra devnet + program id
- [ ] obs configurado: 1080p, mic level testado, scene com `/invest` + `/agency` + explorer
- [ ] cronômetro visível pra cortar em 180s

## tags da submission (do brix.md)

`rwa tokenization` · `lending` · `stablecoin payments` · `oracle`

**proibido como headline** (zero winners no corpus colosseum):

- ❌ smart contract escrow como solution tag
- ❌ lack of transparency como problema (transparência é mecanismo, não headline)
- ❌ high platform fees / high barrier to entry como problema
- ❌ nft como primitive (lift -66%)

## headline da submission

> "brix unlocks parked capital stuck in future rent by tokenizing insurance-backed
> rental receivables on solana. brazil first, agency-originated, immutable rate."
