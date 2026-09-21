import { PythEquityComparison } from "./types";

const HERMES_URL = "https://hermes.pyth.network";

interface FeedMeta {
  id: string;
  attributes: Record<string, string>;
}

interface PriceUpdate {
  id: string;
  price: { price: string; expo: number };
}

async function findFeeds(query: string): Promise<FeedMeta[]> {
  const res = await fetch(
    `${HERMES_URL}/v2/price_feeds?query=${encodeURIComponent(query)}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`Pyth feed search failed: ${res.status}`);
  return res.json();
}

async function latestPrices(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const params = ids.map((id) => `ids[]=${id}`).join("&");
  const res = await fetch(`${HERMES_URL}/v2/updates/price/latest?${params}`, {
    next: { revalidate: 15 },
  });
  if (!res.ok) {
    console.error(`Pyth price fetch failed with status ${res.status}:`, await res.text());
    throw new Error(`Pyth price fetch failed: ${res.status}`);
  }
  const json = await res.json();
  const out = new Map<string, number>();
  for (const p of json.parsed as PriceUpdate[]) {
    out.set(p.id, Number(p.price.price) * Math.pow(10, p.price.expo));
  }
  return out;
}

/**
 * Pyth publishes the real equity price alongside tokenized-wrapper feeds
 * (xStocks, Ondo) for the same underlying company. This is our "sanity check"
 * panel: if a tokenized wrapper of a PUBLIC stock is trading away from the
 * real equity feed, that tells you how much basis risk to expect once
 * PRIVATE pre-IPO tokens (which have no independent public feed at all)
 * start trading away from PreStocks/Tessera's own quoted mark.
 */
export async function fetchPythEquityBenchmark(
  symbol: string
): Promise<PythEquityComparison> {
  const feeds = await findFeeds(symbol);

  const equity = feeds.find(
    (f) => f.attributes.asset_type?.toLowerCase() === "equity"
  );
  const xstock = feeds.find((f) =>
    f.attributes.symbol?.toUpperCase().includes(`${symbol.toUpperCase()}X`)
  );
  const ondo = feeds.find((f) =>
    f.attributes.symbol?.toUpperCase().includes(`${symbol.toUpperCase()}ON`)
  );

  const ids = [equity?.id, xstock?.id, ondo?.id].filter(Boolean) as string[];
  const prices = await latestPrices(ids);

  const equityPrice = equity ? prices.get(equity.id) ?? null : null;
  const xStockPrice = xstock ? prices.get(xstock.id) ?? null : null;
  const ondoPrice = ondo ? prices.get(ondo.id) ?? null : null;

  let spreadPct: number | null = null;
  if (equityPrice && xStockPrice) {
    spreadPct = ((xStockPrice - equityPrice) / equityPrice) * 100;
  }

  return { symbol, equityPrice, xStockPrice, ondoPrice, spreadPct };
}
