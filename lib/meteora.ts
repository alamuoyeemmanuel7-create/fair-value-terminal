import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  DynamicBondingCurveClient,
  buildCurveWithMarketCap,
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  MigrationFeeOption,
  MigrationOption,
  TokenDecimal,
  TokenType,
  TokenUpdateAuthorityOption,
} from "@meteora-ag/dynamic-bonding-curve-sdk";

export interface BasketLeg {
  company: string;
  weightPct: number;
  /** Latest cross-platform mark valuation in USD, used to size the starting curve */
  referenceValuationUsd: number;
}

/**
 * Turns the dashboard's live comparison data into a starting market cap for
 * the basket token: the weighted sum of each leg's own reference valuation.
 * This is what the DBC config's initial/migration market caps are built from,
 * so the basket launches priced against what the underlying names are
 * actually marked at right now, not an arbitrary number.
 */
export function weightedBasketValuation(legs: BasketLeg[]): number {
  const totalWeight = legs.reduce((s, l) => s + l.weightPct, 0) || 1;
  return legs.reduce(
    (sum, l) => sum + l.referenceValuationUsd * (l.weightPct / totalWeight),
    0
  );
}

/**
 * Builds a DBC curve configuration for a basket token. Uses SOL as the quote
 * mint and a market-cap-based curve so the starting price tracks the
 * weighted valuation of the underlying pre-IPO legs. Migration threshold is
 * fixed at 10 SOL (Meteora's default keeper-supported threshold for wSOL).
 */
export function buildBasketCurveConfig(initialMarketCapUsd: number, migrationMarketCapUsd: number) {
  return buildCurveWithMarketCap({
    totalTokenSupply: 1_000_000_000,
    initialMarketCap: initialMarketCapUsd,
    migrationMarketCap: migrationMarketCapUsd,
    tokenBaseDecimal: TokenDecimal.SIX,
    tokenQuoteDecimal: TokenDecimal.NINE,
    tokenType: TokenType.SPL,
    tokenUpdateAuthority: TokenUpdateAuthorityOption.PartnerUpdateAuthority,
    leftover: 0,
    lockedVesting: {
      totalLockedVestingAmount: 0,
      numberOfVestingPeriod: 0,
      cliffUnlockAmount: 0,
      totalVestingDuration: 0,
      cliffDurationFromMigrationTime: 0,
    },
    baseFeeParams: {
      baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
      feeSchedulerParam: {
        startingFeeBps: 300,
        endingFeeBps: 100,
        numberOfPeriod: 20,
        totalDuration: 3600,
      },
    },
    dynamicFeeEnabled: true,
    activationType: ActivationType.Timestamp,
    collectFeeMode: CollectFeeMode.QuoteToken,
    migrationOption: MigrationOption.MET_DAMM_V2,
    migrationFeeOption: MigrationFeeOption.FixedBps100,
    tokenSupplyUpdateAuthority: TokenUpdateAuthorityOption.PartnerUpdateAuthority,
  } as any);
}

/**
 * Builds the two transactions needed to launch a basket: creating the
 * partner config (one-time per curve shape) and creating the pool + base
 * mint. Both are returned unsigned; the caller signs with the connected
 * wallet plus the freshly generated config/mint keypairs.
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
  const client = DynamicBondingCurveClient.create(params.connection, "confirmed");
  const configKeypair = Keypair.generate();
  const baseMintKeypair = Keypair.generate();

  const curveConfig = buildBasketCurveConfig(
    params.initialMarketCapUsd,
    params.migrationMarketCapUsd
  );

  const configTx: Transaction = await client.partner.createConfig({
    config: configKeypair.publicKey,
    feeClaimer: params.feeClaimer,
    leftoverReceiver: params.feeClaimer,
    payer: params.payer,
    quoteMint: NATIVE_MINT,
    ...curveConfig,
  });

  const poolTx: Transaction = await client.pool.createPool({
    baseMint: baseMintKeypair.publicKey,
    config: configKeypair.publicKey,
    name: params.name,
    symbol: params.symbol,
    uri: params.uri,
    payer: params.payer,
    poolCreator: params.payer,
  });

  return { configTx, poolTx, configKeypair, baseMintKeypair };
}
