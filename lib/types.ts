export type Platform = "PreStocks" | "Tessera";

export interface RawAsset {
  platform: Platform;
  /** Canonical company name, normalized for cross-platform matching (e.g. "OpenAI") */
  company: string;
  displaySymbol: string;
  mint: string;
  markPrice: number;
  /** Implied token price from the platform's own bonding/AMM curve, when available */
  tokenPrice?: number;
  markValuation?: number;
  impliedValuation?: number;
  supply?: number;
  holders?: number;
}

export interface CompanyComparison {
  company: string;
  assets: RawAsset[];
  /** % spread between the two most-diverging valuation/price signals available */
  spreadPct: number;
  /** Human-readable basis for the spread calc, since PreStocks/Tessera use different units */
  spreadBasis: "valuation" | "price";
  cheaper: Platform | null;
  richer: Platform | null;
}

export interface SpreadTrend {
  current: number;
  avg24h: number;
  avg7d: number;
  max24h: number;
  min24h: number;
  change24h: number;
  trend1h: number;
  direction: "up" | "down" | "stable";
}

export interface PythEquityComparison {
  symbol: string;
  equityPrice: number | null;
  xStockPrice: number | null;
  ondoPrice: number | null;
  spreadPct: number | null;
}
