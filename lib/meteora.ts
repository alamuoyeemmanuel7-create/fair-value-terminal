import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";

export interface BasketLeg {
  company: string;
  weightPct: number;
  /** Latest cross-platform mark valuation in USD, used to size the starting curve */
  referenceValuationUsd: number;
}

/**
 * Turns the dashboard's live comparison data into a starting market cap for
 * the basket token: the weighted sum of each leg's own reference valuation.
 */
export function weightedBasketValuation(legs: BasketLeg[]): number {
  const totalWeight = legs.reduce((s, l) => s + l.weightPct, 0) || 1;
  return legs.reduce(
    (sum, l) => sum + l.referenceValuationUsd * (l.weightPct / totalWeight),
    0
  );
}

/**
 * Builds a DBC curve configuration for a basket token.
 * 
 * Note: This feature is currently disabled due to Meteora SDK compatibility issues.
 */
export function buildBasketCurveConfig(initialMarketCapUsd: number, migrationMarketCapUsd: number) {
  throw new Error("Basket creation is currently unavailable due to Meteora SDK compatibility issues.");
}

/**
 * Builds the two transactions needed to launch a basket.
 * 
 * Note: This feature is currently disabled due to Meteora SDK compatibility issues.
 */
export async function buildBasketLaunchTransactions(params: {
  connection: Connection;
  payer: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  initialMarketCapUsd: number;
  migrationMarketCapUsd: number;
  feeClaimer: PublicKey;
}) {
  throw new Error("Basket creation is currently unavailable due to Meteora SDK compatibility issues.");
}
