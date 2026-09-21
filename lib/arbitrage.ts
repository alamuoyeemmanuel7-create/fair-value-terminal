/**
 * Arbitrage Detection Engine
 * Identifies profitable cross-platform trading opportunities
 */

import { CompanyComparison, RawAsset, Platform } from "./types";

export interface ArbitrageOpportunity {
  company: string;
  buyPlatform: Platform;
  sellPlatform: Platform;
  buyPrice: number;
  sellPrice: number;
  spreadPct: number;
  estimatedProfit: number; // % profit after gas fees
  confidenceScore: number; // 0-100, higher = more reliable
  reason: string;
}

// Estimated gas fees in USD (these are approximations)
const GAS_FEE_USD = 0.25; // ~$0.25 per transaction on Solana
const GAS_FEE_TRADING_USD = 0.5; // Gas for swap/trade

/**
 * Calculate potential profit from an arbitrage opportunity
 */
export function calculateArbitrageProfit(
  buyPrice: number,
  sellPrice: number,
  amount: number = 1000 // Default investment size in USD
): {
  grossProfit: number;
  gasFeesTotal: number;
  netProfit: number;
  netProfitPct: number;
} {
  const grossProfit = (sellPrice - buyPrice) * (amount / buyPrice);
  const gasFeesTotal = GAS_FEE_USD + GAS_FEE_TRADING_USD; // 2 transactions
  const netProfit = grossProfit - gasFeesTotal;
  const netProfitPct = (netProfit / amount) * 100;

  return {
    grossProfit,
    gasFeesTotal,
    netProfit,
    netProfitPct,
  };
}

/**
 * Detect arbitrage opportunities from spread comparisons
 */
export function detectOpportunities(
  comparisons: CompanyComparison[]
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  for (const comp of comparisons) {
    if (comp.assets.length < 2) continue;

    // Find the cheapest and most expensive assets
    const byPrice = [...comp.assets].sort((a, b) => a.markPrice - b.markPrice);
    const cheap = byPrice[0];
    const expensive = byPrice[byPrice.length - 1];

    if (cheap.platform === expensive.platform) continue;

    const spreadPct = comp.spreadPct;
    const profit = calculateArbitrageProfit(cheap.markPrice, expensive.markPrice);

    // Only flag if profitable after gas fees
    if (profit.netProfitPct > 0.5) {
      // Confidence score based on:
      // 1. Spread width (wider = higher confidence in the opportunity)
      // 2. Data freshness (implicit in the comparison)
      // 3. Valuation vs price basis (valuation is more reliable)
      let confidence = 50;
      if (comp.spreadBasis === "valuation") confidence += 30;
      if (spreadPct > 5) confidence += 15;
      if (spreadPct > 10) confidence += 5;
      confidence = Math.min(100, confidence);

      opportunities.push({
        company: comp.company,
        buyPlatform: cheap.platform,
        sellPlatform: expensive.platform,
        buyPrice: cheap.markPrice,
        sellPrice: expensive.markPrice,
        spreadPct,
        estimatedProfit: profit.netProfitPct,
        confidenceScore: confidence,
        reason: `Buy at ${cheap.platform} (${cheap.markPrice.toFixed(2)}), sell at ${expensive.platform} (${expensive.markPrice.toFixed(2)})`,
      });
    }
  }

  // Sort by estimated profit (descending)
  return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
}

/**
 * Filter opportunities by minimum profit threshold
 */
export function filterByMinProfit(
  opportunities: ArbitrageOpportunity[],
  minProfitPct: number = 1.0
): ArbitrageOpportunity[] {
  return opportunities.filter((o) => o.estimatedProfit >= minProfitPct);
}

/**
 * Filter opportunities by confidence level
 */
export function filterByConfidence(
  opportunities: ArbitrageOpportunity[],
  minConfidence: number = 70
): ArbitrageOpportunity[] {
  return opportunities.filter((o) => o.confidenceScore >= minConfidence);
}

/**
 * Calculate portfolio-level arbitrage metrics
 */
export function calculatePortfolioMetrics(opportunities: ArbitrageOpportunity[]) {
  if (opportunities.length === 0) {
    return {
      totalOpportunities: 0,
      averageProfit: 0,
      maxProfit: 0,
      averageConfidence: 0,
      highConfidenceCount: 0,
    };
  }

  const profits = opportunities.map((o) => o.estimatedProfit);
  const confidences = opportunities.map((o) => o.confidenceScore);

  return {
    totalOpportunities: opportunities.length,
    averageProfit: profits.reduce((a, b) => a + b, 0) / profits.length,
    maxProfit: Math.max(...profits),
    averageConfidence:
      confidences.reduce((a, b) => a + b, 0) / confidences.length,
    highConfidenceCount: confidences.filter((c) => c >= 80).length,
  };
}
