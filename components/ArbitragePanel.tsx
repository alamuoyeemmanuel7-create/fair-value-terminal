/**
 * Arbitrage Opportunities Panel
 * Displays detected profitable trading opportunities
 */

import { useState } from "react";
import { ArbitrageOpportunity } from "@/lib/arbitrage";
import { ExecutionPanel } from "./ExecutionPanel";
import { RawAsset } from "@/lib/types";

interface ArbitragePanelProps {
  opportunities: ArbitrageOpportunity[];
  assets?: RawAsset[];
  loading?: boolean;
}

export function ArbitragePanel({ opportunities, assets = [], loading }: ArbitragePanelProps) {
  const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunity | null>(null);
  if (loading) {
    return (
      <section className="panel">
        <h2>Arbitrage opportunities</h2>
        <div className="status">Analyzing spreads…</div>
      </section>
    );
  }

  if (opportunities.length === 0) {
    return (
      <section className="panel">
        <h2>Arbitrage opportunities</h2>
        <p className="desc">
          No profitable arbitrage opportunities detected at current spreads. The
          market is pricing these assets fairly, or spreads are too narrow to
          cover transaction costs.
        </p>
      </section>
    );
  }

  if (selectedOpp) {
    return (
      <ExecutionPanel
        opportunity={selectedOpp}
        assets={assets}
        onClose={() => setSelectedOpp(null)}
      />
    );
  }

  return (
    <section className="panel">
      <h2>Arbitrage opportunities</h2>
      <p className="desc">
        These trades could be profitable after accounting for estimated gas fees
        (~$0.75 per round-trip). Sorted by potential profit. Confidence score
        reflects data quality and spread reliability.
      </p>

      <div>
        <div className="row head">
          <div>Company</div>
          <div className="num">Buy</div>
          <div className="num">Sell</div>
          <div className="num">Spread</div>
          <div className="num hide-mobile">Est. Profit</div>
          <div className="num hide-mobile">Confidence</div>
        </div>

        {opportunities.map((opp, idx) => (
          <div
            className="row arb-row clickable"
            key={`${opp.company}-${idx}`}
            onClick={() => setSelectedOpp(opp)}
            style={{ cursor: "pointer" }}
          >
            <div className="company">
              {opp.company}
              <span className="tag" style={{ fontSize: 11 }}>
                {opp.reason}
              </span>
            </div>
            <div className="num">
              <span className="pill">{opp.buyPlatform}</span>
              <span className="arb-price">${opp.buyPrice.toFixed(2)}</span>
            </div>
            <div className="num">
              <span className="pill">{opp.sellPlatform}</span>
              <span className="arb-price">${opp.sellPrice.toFixed(2)}</span>
            </div>
            <div className="spread up">{opp.spreadPct.toFixed(2)}%</div>
            <div className="num hide-mobile">
              <span
                className="arb-profit"
                style={{
                  color: opp.estimatedProfit > 2 ? "#22c55e" : "#f2b84b",
                }}
              >
                +{opp.estimatedProfit.toFixed(2)}%
              </span>
            </div>
            <div className="num hide-mobile">
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${opp.confidenceScore}%`,
                    backgroundColor:
                      opp.confidenceScore >= 80
                        ? "#22c55e"
                        : opp.confidenceScore >= 70
                          ? "#f2b84b"
                          : "#ef4444",
                  }}
                />
              </div>
              <span className="confidence-text">{opp.confidenceScore}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="status" style={{ marginTop: 16, fontSize: 12 }}>
        {opportunities.length} profitable opportunity{opportunities.length !== 1 ? "ies" : ""} detected
      </p>
    </section>
  );
}
