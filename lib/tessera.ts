import { RawAsset } from "./types";
import { canonicalCompany, displayCompany } from "./normalize";

const TESSERA_URL = "https://rest-api.tessera.pe/v1/public/token-details";

interface TesseraToken {
  id: string;
  name: string;
  symbol: string;
  code: string;
  mint: string;
  markPrice: number;
  holders: number;
  markValuation: number;
}

export async function fetchTessera(): Promise<RawAsset[]> {
  const res = await fetch(TESSERA_URL, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Tessera API returned ${res.status}`);
  const data: TesseraToken[] = await res.json();

  return data.map((t) => ({
    platform: "Tessera" as const,
    company: displayCompany(canonicalCompany(t.name)),
    displaySymbol: t.symbol,
    mint: t.mint,
    markPrice: t.markPrice,
    markValuation: t.markValuation,
    holders: t.holders,
  }));
}
