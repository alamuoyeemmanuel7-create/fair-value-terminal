# Basis — a fair value terminal for tokenized pre-IPO stocks

Built for the **Stocklana** hackathon (Solana Foundation / Colosseum).

## The problem

Tokenized pre-IPO stocks (OpenAI, SpaceX, Kalshi, Anthropic, etc.) now trade
on more than one platform at once. PreStocks and Tessera each run their own
bonding curve / mark-price feed for the *same* underlying company, and
nothing forces those two feeds to agree. There is no brokerage-app
equivalent of "compare the bid on two exchanges" for this asset class yet.

**Basis is that comparison layer.** It pulls live data from PreStocks,
Tessera, and Pyth, lines up the same company across platforms, and ranks
the disagreements from widest to narrowest — the same job a fair-value
monitor does for cross-listed equities, applied to an asset class that
doesn't have one yet.

## What's real right now

Everything in this repo hits live, public data — nothing is mocked:

- `lib/prestocks.ts` — pulls `https://prestocks.com/api/prestocks` (8 tokens,
  each with both a mark price *and* an implied bonding-curve token price)
- `lib/tessera.ts` — pulls `https://rest-api.tessera.pe/v1/public/token-details`
- `lib/pyth.ts` — pulls Hermes (`hermes.pyth.network`) for real equity feeds
  vs their tokenized xStock/Ondo wrappers, as a control-group panel
- `lib/mispricing.ts` — the actual comparison logic: matches companies across
  platforms by name, prefers comparing at the **valuation** level (since
  PreStocks and Tessera mint different token counts per dollar of exposure,
  so raw price isn't comparable across them), and ranks by spread
- `app/basket/page.tsx` + `lib/meteora.ts` — builds a real, unsigned Meteora
  Dynamic Bonding Curve config + pool creation transaction sized off the
  live weighted valuation of whatever legs you pick, and sends it through
  the connected wallet
- `app/trade/page.tsx` — reads your actual on-chain SPL balances for every
  tracked mint via `getParsedTokenAccountsByOwner`

## What's intentionally out of scope for this submission

- **Execution routing**: these are SPV-backed tokens that trade on each
  issuer's own venue, not a shared order book with deep third-party
  liquidity. Rather than fake a swap against liquidity we don't have, the
  Trade page reads your real balance and routes execution out to the
  platform that actually minted the token. Wiring a real aggregator (Jupiter)
  in front of whichever of these mints do have on-chain pools is the
  natural next step post-hackathon.
- **Basket launch is unsigned-transaction-ready but untested on mainnet**:
  the DBC config/pool transactions are built with the real SDK against real
  valuations, but actually broadcasting them needs a funded wallet and a
  live RPC, which this environment doesn't have. Test on devnet first.

## Sponsor tracks this targets

- **Pyth** — the equity-vs-wrapper benchmark panel is a genuine
  price-comparison surface; Pyth data is structurally central to it, not
  bolted on.
- **Tessera** — real product built directly on the token-details API.
- **PreStocks** — real product built directly on the PreStocks API; a new
  way to research and compare PreStocks tokens.
- **Meteora** — a real basket/index primitive built on DBC, not a memecoin
  launch: curve pricing derived from live cross-platform valuations.

## Running it

```bash
npm install
cp .env.example .env.local
# add a real RPC URL (Helius/Triton/QuickNode) to .env.local - public mainnet-beta is rate-limited
npm run dev
```

Open http://localhost:3000. The dashboard and Pyth panel work with zero
wallet connection. Connect Phantom/Solflare to see the Basket and Trade
pages' wallet-backed features.

## Project structure

```
app/
  page.tsx              dashboard: cross-platform mispricing table
  basket/page.tsx        compose + launch a weighted basket via Meteora DBC
  trade/page.tsx          wallet balances + deep-link execution
  api/dashboard/          server route: merges PreStocks + Tessera + spreads
  api/pyth-benchmark/     server route: Pyth equity vs wrapper feeds
lib/
  prestocks.ts, tessera.ts, pyth.ts   API clients
  mispricing.ts                        cross-platform spread engine
  meteora.ts                           DBC curve config + transaction builders
  normalize.ts                         company-name matching across platforms
  types.ts
components/
  WalletProvider.tsx, Nav.tsx
```

## Submission checklist (Colosseum)

- [ ] Register + Submit Project before Fri Sept 25, 4:00pm ET
- [ ] Push this repo to GitHub, link it in the submission
- [ ] Record a short demo video showing: live dashboard spread updating,
      wallet connect, basket composition, and (on devnet) a successful
      DBC pool creation transaction
- [ ] Note in the submission which tracks you're entering (Pyth, Tessera,
      PreStocks, Meteora)
