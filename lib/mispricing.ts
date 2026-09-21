import { RawAsset, CompanyComparison } from "./types";

/**
 * Groups raw assets by underlying company and computes the widest available
 * spread. We prefer comparing at the VALUATION level (markValuation /
 * impliedValuation) rather than raw token price, because PreStocks and
 * Tessera mint different numbers of tokens per dollar of exposure - raw
 * price is not comparable across platforms, implied company valuation is.
 */
export function buildComparisons(assets: RawAsset[]): CompanyComparison[] {
  const byCompany = new Map<string, RawAsset[]>();
  for (const a of assets) {
    const list = byCompany.get(a.company) ?? [];
    list.push(a);
    byCompany.set(a.company, list);
  }

  const comparisons: CompanyComparison[] = [];

  for (const [company, group] of byCompany) {
    if (group.length < 2) {
      // Still surface single-platform assets with their internal
      // mark-vs-implied-token-price spread, when the platform gives us both.
      const a = group[0];
      if (a.tokenPrice && a.markPrice) {
        const spreadPct = ((a.tokenPrice - a.markPrice) / a.markPrice) * 100;
        comparisons.push({
          company,
          assets: group,
          spreadPct,
          spreadBasis: "price",
          cheaper: spreadPct > 0 ? a.platform : null,
          richer: spreadPct < 0 ? a.platform : null,
        });
      }
      continue;
    }

    const withValuation = group.filter((a) => a.markValuation);
    if (withValuation.length >= 2) {
      const sorted = [...withValuation].sort(
        (x, y) => (x.markValuation ?? 0) - (y.markValuation ?? 0)
      );
      const low = sorted[0];
      const high = sorted[sorted.length - 1];
      const spreadPct =
        ((high.markValuation! - low.markValuation!) / low.markValuation!) *
        100;
      comparisons.push({
        company,
        assets: group,
        spreadPct,
        spreadBasis: "valuation",
        cheaper: low.platform,
        richer: high.platform,
      });
    } else {
      const sorted = [...group].sort((x, y) => x.markPrice - y.markPrice);
      const low = sorted[0];
      const high = sorted[sorted.length - 1];
      const spreadPct = ((high.markPrice - low.markPrice) / low.markPrice) * 100;
      comparisons.push({
        company,
        assets: group,
        spreadPct,
        spreadBasis: "price",
        cheaper: low.platform,
        richer: high.platform,
      });
    }
  }

  return comparisons.sort((a, b) => Math.abs(b.spreadPct) - Math.abs(a.spreadPct));
}
