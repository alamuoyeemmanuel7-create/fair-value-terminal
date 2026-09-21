"use client";

import { useState, useEffect } from "react";
import { portfolioManager, PortfolioMetrics, PortfolioAlert } from "@/lib/portfolio";
import { CompanyComparison } from "@/lib/types";

interface PortfolioPanelProps {
  comparisons: CompanyComparison[];
}

export function PortfolioPanel({ comparisons }: PortfolioPanelProps) {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    updatePortfolio();
  }, [comparisons]);

  const updatePortfolio = () => {
    // Update prices from current comparisons
    const priceMap = new Map<string, number>();
    for (const comp of comparisons) {
      for (const asset of comp.assets) {
        priceMap.set(asset.mint, asset.markPrice);
        priceMap.set(asset.company, asset.markPrice);
      }
    }

    portfolioManager.updatePrices(priceMap);

    const newMetrics = portfolioManager.calculateMetrics();
    const newAlerts = portfolioManager.generateAlerts();

    setMetrics(newMetrics);
    setAlerts(newAlerts);
  };

  const positions = portfolioManager.getPositions();

  return (
    <section className="panel portfolio-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Portfolio analytics</h2>
        <button
          className="btn"
          onClick={() => setShowForm(!showForm)}
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          {showForm ? "Cancel" : "+ Add position"}
        </button>
      </div>

      {!metrics || positions.length === 0 ? (
        <p className="desc">
          No positions tracked yet. Add holdings to see real-time P&L, exposure analysis, and
          rebalancing recommendations.
        </p>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="portfolio-summary">
            <div className="metric-box">
              <span className="metric-label">Portfolio Value</span>
              <span className="metric-value">${metrics.totalValue.toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Total Gain/Loss</span>
              <span
                className="metric-value"
                style={{
                  color: metrics.totalGain >= 0 ? "#22c55e" : "#ef4444",
                }}
              >
                {metrics.totalGain >= 0 ? "+" : ""}
                ${metrics.totalGain.toFixed(2)} ({metrics.totalGainPct.toFixed(1)}%)
              </span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Cost Basis</span>
              <span className="metric-value">${metrics.totalCostBasis.toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Unrealized P&L</span>
              <span
                className="metric-value"
                style={{
                  color: metrics.unrealizedPnL >= 0 ? "#22c55e" : "#ef4444",
                }}
              >
                ${metrics.unrealizedPnL.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="portfolio-alerts">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`alert-box alert-${alert.severity}`}
                >
                  <span className="alert-type">{alert.type.toUpperCase()}</span>
                  <span className="alert-message">{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Exposure breakdown */}
          <div className="exposure-grid">
            <div className="exposure-section">
              <h4>Exposure by Platform</h4>
              {Object.entries(metrics.exposureByPlatform).map(([platform, pct]) => (
                <div key={platform} className="exposure-item">
                  <span>{platform}</span>
                  <div className="exposure-bar">
                    <div
                      className="exposure-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="exposure-pct">{pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>

            <div className="exposure-section">
              <h4>Exposure by Company</h4>
              {Object.entries(metrics.exposureByCompany)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([company, pct]) => (
                  <div key={company} className="exposure-item">
                    <span>{company}</span>
                    <div className="exposure-bar">
                      <div
                        className="exposure-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="exposure-pct">{pct.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top performers */}
          <div className="performers">
            {metrics.bestPerformer && (
              <div className="performer best">
                <span className="performer-label">Best performer</span>
                <div>
                  <strong>{metrics.bestPerformer.company}</strong>
                  <span
                    style={{
                      color: "#22c55e",
                      marginLeft: 8,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    +{metrics.bestPerformer.gainPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            {metrics.worstPerformer && (
              <div className="performer worst">
                <span className="performer-label">Worst performer</span>
                <div>
                  <strong>{metrics.worstPerformer.company}</strong>
                  <span
                    style={{
                      color: "#ef4444",
                      marginLeft: 8,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {metrics.worstPerformer.gainPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Positions table */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 12 }}>Open positions</h4>
            <div className="positions-table">
              <div className="row head">
                <div>Company</div>
                <div className="num">Qty</div>
                <div className="num">Entry</div>
                <div className="num">Current</div>
                <div className="num">Gain/Loss</div>
                <div className="num">Value</div>
              </div>
              {positions.map((pos) => {
                const gainLoss = (pos.currentPrice - pos.entryPrice) / pos.entryPrice;
                const gainLossPct = gainLoss * 100;
                const value = pos.quantity * pos.currentPrice;

                return (
                  <div className="row" key={`${pos.mint}-${pos.platform}`}>
                    <div className="company">
                      {pos.company}
                      <span className="tag" style={{ fontSize: 10 }}>
                        {pos.platform}
                      </span>
                    </div>
                    <div className="num">{pos.quantity.toFixed(2)}</div>
                    <div className="num">${pos.entryPrice.toFixed(2)}</div>
                    <div className="num">${pos.currentPrice.toFixed(2)}</div>
                    <div
                      className="num"
                      style={{
                        color: gainLoss >= 0 ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                      }}
                    >
                      {gainLoss >= 0 ? "+" : ""}
                      {gainLossPct.toFixed(1)}%
                    </div>
                    <div className="num">${value.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
