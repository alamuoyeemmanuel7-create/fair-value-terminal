/**
 * Jupiter Integration
 * Route trades through Jupiter Aggregator for best execution
 */

import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { ArbitrageOpportunity } from "./arbitrage";

const JUPITER_API_URL = "https://quote-api.jup.ag/v6";

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: "ExactIn" | "ExactOut";
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

export interface SwapInstructions {
  tokenLedgerInstruction?: any;
  computeBudgetInstructions?: any[];
  setupInstructions?: any[];
  swapInstruction: any;
  cleanupInstruction?: any;
  addressLookupTableAddresses: string[];
}

export interface ExecutionDetails {
  route: string; // Human readable route description
  slippage: number; // %
  priceImpact: number; // %
  estimatedOutput: number;
  walletAddress: string;
}

/**
 * Get Jupiter quote for a swap
 */
export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 100 // 1% default
): Promise<JupiterQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });

    const response = await fetch(`${JUPITER_API_URL}/quote?${params}`);
    if (!response.ok) {
      console.error("Jupiter quote failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching Jupiter quote:", err);
    return null;
  }
}

/**
 * Get swap instructions from Jupiter
 */
export async function getSwapInstructions(
  quote: JupiterQuote,
  userPublicKey: string,
  wrapUnwrapSOL: boolean = true
): Promise<SwapInstructions | null> {
  try {
    const payload = {
      quoteResponse: quote,
      userPublicKey,
      wrapUnwrapSOL,
    };

    const response = await fetch(`${JUPITER_API_URL}/swap-instructions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Swap instructions failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching swap instructions:", err);
    return null;
  }
}

/**
 * Calculate execution details for display
 */
export function calculateExecutionDetails(
  quote: JupiterQuote,
  inputAmount: number,
  walletAddress: string
): ExecutionDetails {
  const outputAmount = parseFloat(quote.outAmount) / 10 ** 6; // Assuming 6 decimals
  const priceImpact = parseFloat(quote.priceImpactPct);

  return {
    route: `${quote.routePlan.length} hop${quote.routePlan.length > 1 ? "s" : ""}`,
    slippage: quote.slippageBps / 100,
    priceImpact,
    estimatedOutput: outputAmount,
    walletAddress,
  };
}

/**
 * Build execution link for manual routing
 * Used for assets that don't have on-chain pools
 */
export function buildExecutionLink(
  platform: string,
  company: string,
  mint: string
): string {
  if (platform === "PreStocks") {
    return `https://prestocks.com/tokens/${mint}`;
  } else if (platform === "Tessera") {
    return `https://tessera.pe/tokens/${mint}`;
  }
  return "#";
}

/**
 * Format quote for display
 */
export function formatQuoteDisplay(quote: JupiterQuote, decimals: number = 6) {
  return {
    inputAmount: (parseFloat(quote.inAmount) / 10 ** decimals).toFixed(2),
    outputAmount: (parseFloat(quote.outAmount) / 10 ** decimals).toFixed(2),
    priceImpact: parseFloat(quote.priceImpactPct).toFixed(2),
    slippage: (quote.slippageBps / 100).toFixed(2),
  };
}
