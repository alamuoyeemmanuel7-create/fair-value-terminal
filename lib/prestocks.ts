import { RawAsset } from "./types";
import { canonicalCompany, displayCompany } from "./normalize";

const PRESTOCKS_URL = "https://prestocks.com/api/prestocks";

interface PreStocksToken {
  name: string;
  symbol: string;
  contract_address: string;
  markPrice: number;
  markValuation: number;
  tokenPrice: number;
  impliedValuation: number;
  supply: number;
}

export async function fetchPreStocks(): Promise<RawAsset[]> {
  const res = await fetch(PRESTOCKS_URL, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`PreStocks API returned ${res.status}`);
  const data: PreStocksToken[] = await res.json();

  return data.map((t) => ({
    platform: "PreStocks" as const,
    company: displayCompany(canonicalCompany(t.name)),
    displaySymbol: t.symbol,
    mint: t.contract_address,
    markPrice: t.markPrice,
    tokenPrice: t.tokenPrice,
    markValuation: t.markValuation,
    impliedValuation: t.impliedValuation,
    supply: t.supply,
  }));
}
