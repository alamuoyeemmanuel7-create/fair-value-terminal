import { PythEquityComparison } from "./types";

// Try multiple Hermes endpoints in case one is rate-limited
const HERMES_URLS = [
  "https://hermes.pyth.network",
  "https://hermes-beta.pyth.network",
];

interface FeedMeta {
  id: string;
  attributes: Record<string, string>;
}

interface PriceUpdate {
  id: string;
  price: { price: string; expo: number };
}

async function findFeeds(query: string): Promise<FeedMeta[]> {
  for (const url of HERMES_URLS) {
    try {
      const res = await fetch(
        `${url}/v2/price_feeds?query=${encodeURIComponent(query)}`,
        { next: { revalidate: 60 } }
      );
      if (res.ok) return res.json();
      if (res.status !== 401) continue;
    } catch {
      continue;
    }
  }
  throw new Error(`Pyth feed search failed on all endpoints`);
}

async function latestPrices(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  
  const params = ids.map((id) => `ids[]=${id}`).join("&");
  
  for (const url of HERMES_URLS) {
    try {
      const res = await fetch(`${url}/v2/updates/price/latest?${params}`, {
        next: { revalidate: 15 },
      });
      
      if (!res.ok) {
        console.warn(`[Pyth] Endpoint ${url} returned ${res.status}`);
        continue;
      }
      
      const json = await res.json();
      const out = new Map<string, number>();
      
      if (!json.parsed) {
        console.warn(`[Pyth] No price data in response from ${url}`);
        continue;
      }
      
      for (const p of json.parsed as PriceUpdate[]) {
        out.set(p.id, Number(p.price.price) * Math.pow(10, p.price.expo));
      }
      return out;
    } catch (e) {
      console.warn(`[Pyth] Error fetching from ${url}:`, e);
      continue;
    }
  }
  
  throw new Error(`Pyth price fetch failed on all endpoints`);
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

  // Find equity feed - look for exact "Equity" or "Equity.Index" type
  const equity = feeds.find(
    (f) => 
      f.attributes.asset_type?.toLowerCase() === "equity" ||
      f.attributes.symbol?.toLowerCase().startsWith("equity.")
  );
  
  // Find xStock feed (tokenized wrapper, e.g., AAPLX)
  const xstock = feeds.find((f) => {
    const sym = f.attributes.symbol?.toUpperCase() || "";
    return sym.includes(`${symbol.toUpperCase()}X`) && sym.includes("CRYPTO");
  });
  
  // Find Ondo feed (tokenized stock, e.g., AAPLON)
  const ondo = feeds.find((f) => {
    const sym = f.attributes.symbol?.toUpperCase() || "";
    return sym.includes(`${symbol.toUpperCase()}ON`) && sym.includes("CRYPTO");
  });

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
