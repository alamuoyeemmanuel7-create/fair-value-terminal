/**
 * Heatmap Analytics
 * Generate matrix visualizations for spread data
 */

import { CompanyComparison, RawAsset } from "./types";

export interface HeatmapData {
  companies: string[];
  platforms: string[];
  matrix: (number | null)[][]; // spreads[company_idx][platform_idx]
  values: HeatmapCell[];
}

export interface HeatmapCell {
  company: string;
  platform: string;
  price: number;
  valuation?: number;
  spreadToPlatformAvg: number; // How much this platform's price differs from average
}

export interface VolatilityMatrix {
  companies: string[];
  platforms: string[];
  volatility: number[][]; // 0-100, higher = more volatile
}

/**
 * Build heatmap data from comparisons
 */
export function buildHeatmap(comparisons: CompanyComparison[]): HeatmapData {
  const companies = comparisons.map((c) => c.company);
  const platformSet = new Set<string>();

  for (const comp of comparisons) {
    for (const asset of comp.assets) {
      platformSet.add(asset.platform);
    }
  }

  const platforms = Array.from(platformSet).sort();
  const platformIndex: Record<string, number> = {};
  platforms.forEach((p, i) => {
    platformIndex[p] = i;
  });

  // Build matrix
  const matrix: (number | null)[][] = [];
  const values: HeatmapCell[] = [];

  for (const comp of comparisons) {
    const row: (number | null)[] = new Array(platforms.length).fill(null);
    const prices: Record<string, number> = {};
    const valuations: Record<string, number> = {};

    for (const asset of comp.assets) {
      const idx = platformIndex[asset.platform];
      const price = asset.markPrice;
      row[idx] = price;
      prices[asset.platform] = price;
      if (asset.markValuation) {
        valuations[asset.platform] = asset.markValuation;
      }
    }

    // Calculate spread to platform average
    const avgPrice = Object.values(prices).reduce((a, b) => a + b, 0) / Object.values(prices).length;

    for (const asset of comp.assets) {
      const idx = platformIndex[asset.platform];
      const spreadToPlatformAvg = ((asset.markPrice - avgPrice) / avgPrice) * 100;

      values.push({
        company: comp.company,
        platform: asset.platform,
        price: asset.markPrice,
        valuation: asset.markValuation,
        spreadToPlatformAvg,
      });
    }

    matrix.push(row);
  }

  return {
    companies,
    platforms,
    matrix,
    values,
  };
}

/**
 * Calculate volatility for each company/platform combination
 */
export function buildVolatilityMatrix(
  heatmapData: HeatmapData,
  historicalSpreadMap: Map<string, number[]>
): VolatilityMatrix {
  const { companies, platforms, matrix } = heatmapData;
  const volatility: number[][] = [];

  for (let i = 0; i < companies.length; i++) {
    const row: number[] = [];
    const company = companies[i];

    for (let j = 0; j < platforms.length; j++) {
      const price = matrix[i][j];

      if (price === null) {
        row.push(0);
        continue;
      }

      // Get volatility from historical spreads
      const historicalKey = `${company}`;
      const spreads = historicalSpreadMap.get(historicalKey) || [];

      if (spreads.length === 0) {
        row.push(50); // Default medium volatility
        continue;
      }

      // Calculate coefficient of variation (std dev / mean)
      const mean = spreads.reduce((a, b) => a + b, 0) / spreads.length;
      const variance =
        spreads.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / spreads.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

      // Normalize to 0-100 scale
      const normalizedVolatility = Math.min(100, cv * 2);
      row.push(normalizedVolatility);
    }

    volatility.push(row);
  }

  return {
    companies,
    platforms,
    volatility,
  };
}

/**
 * Get color for heatmap cell based on spread magnitude
 */
export function getHeatmapColor(spreadPct: number, maxSpread: number = 20): string {
  // Normalize spread to 0-1
  const normalized = Math.min(1, Math.abs(spreadPct) / maxSpread);

  // Color scale: blue (low) -> yellow (medium) -> red (high)
  if (normalized < 0.33) {
    // Blue to yellow
    const t = normalized / 0.33;
    const r = Math.round(100 + (242 - 100) * t);
    const g = Math.round(130 + (184 - 130) * t);
    const b = Math.round(246 - (246 - 75) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalized < 0.66) {
    // Yellow to orange
    const t = (normalized - 0.33) / 0.33;
    const r = Math.round(242 + (239 - 242) * t);
    const g = Math.round(184 - (184 - 68) * t);
    const b = 75;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Orange to red
    const t = (normalized - 0.66) / 0.34;
    const r = Math.round(239 + (239 - 239) * t);
    const g = Math.round(68 - (68 - 0) * t);
    const b = Math.round(75 - (75 - 0) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Get color for volatility cell
 */
export function getVolatilityColor(volatility: number): string {
  // Green (stable) -> Yellow (moderate) -> Red (volatile)
  if (volatility < 30) {
    return "#22c55e"; // Green
  } else if (volatility < 60) {
    return "#f2b84b"; // Yellow
  } else {
    return "#ef4444"; // Red
  }
}

/**
 * Find patterns in heatmap (opportunities, risks, clusters)
 */
export function analyzeHeatmapPatterns(heatmapData: HeatmapData) {
  const { companies, platforms, matrix, values } = heatmapData;

  // Find highest spreads
  const topSpreads = values
    .sort((a, b) => Math.abs(b.spreadToPlatformAvg) - Math.abs(a.spreadToPlatformAvg))
    .slice(0, 5);

  // Find most consistent pricing (across platforms)
  const consistency: Record<string, number> = {};
  for (const company of companies) {
    const companyValues = values.filter((v) => v.company === company);
    const prices = companyValues.map((v) => v.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    consistency[company] = (stdDev / mean) * 100;
  }

  const mostConsistent = Object.entries(consistency).sort(([, a], [, b]) => a - b)[0];
  const leastConsistent = Object.entries(consistency).sort(([, a], [, b]) => b - a)[0];

  // Find platform with highest average prices
  const platformAveragePrices: Record<string, number> = {};
  for (let j = 0; j < platforms.length; j++) {
    const prices: number[] = [];
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i][j] !== null) {
        prices.push(matrix[i][j]!);
      }
    }
    platformAveragePrices[platforms[j]] =
      prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }

  return {
    topSpreads,
    mostConsistentCompany: mostConsistent?.[0],
    mostConsistentSpread: mostConsistent?.[1] ?? 0,
    leastConsistentCompany: leastConsistent?.[0],
    leastConsistentSpread: leastConsistent?.[1] ?? 0,
    platformAveragePrices,
  };
}
