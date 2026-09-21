"use client";

import { useState, useEffect } from "react";
import {
  ArbitrageOpportunity,
  calculateArbitrageProfit,
} from "@/lib/arbitrage";
import {
  getJupiterQuote,
  JupiterQuote,
  formatQuoteDisplay,
  buildExecutionLink,
} from "@/lib/jupiter";
import { RawAsset } from "@/lib/types";

interface ExecutionPanelProps {
  opportunity: ArbitrageOpportunity;
  assets: RawAsset[];
  onClose: () => void;
}

export function ExecutionPanel({
  opportunity,
  assets,
  onClose,
}: ExecutionPanelProps) {
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [slippage, setSlippage] = useState(100); // bps
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuote();
  }, [slippage]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);

    const buyAsset = assets.find((a) => a.platform === opportunity.buyPlatform);
    const sellAsset = assets.find(
      (a) => a.platform === opportunity.sellPlatform
    );

    if (!buyAsset || !sellAsset) {
      setError("Assets not found");
      setLoading(false);
      return;
    }

    if (!buyAsset.mint || !sellAsset.mint) {
      setError("Tokens not yet on-chain");
      setLoading(false);
      return;
    }

    const q = await getJupiterQuote(
      buyAsset.mint,
      sellAsset.mint,
      1000000,
      slippage
    );

    if (!q) {
      setError("No liquidity found on Jupiter");
      setLoading(false);
      return;
    }

    setQuote(q);
    setLoading(false);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);

    try {
      setError("Execution requires wallet connection. Demo mode only.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    }

    setExecuting(false);
  };

  const buyAsset = assets.find((a) => a.platform === opportunity.buyPlatform);
  const sellAsset = assets.find(
    (a) => a.platform === opportunity.sellPlatform
  );

  const displayQuote = quote ? formatQuoteDisplay(quote) : null;
  const profit = calculateArbitrageProfit(
    opportunity.buyPrice,
    opportunity.sellPrice,
    1000
  );

  return (
    <div className="execution-panel">
      <div className="execution-header">
        <h3>Execute {opportunity.company}</h3>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="execution-flow">
        <div className="flow-step">
          <div className="flow-label">
            <strong>Buy on {opportunity.buyPlatform}</strong>
            <span className="price">${opportunity.buyPrice.toFixed(2)}</span>
          </div>
          <div className="flow-arrow">v</div>
        </div>

        <div className="flow-step">
          <div className="flow-label">
            <strong>Swap via Jupiter</strong>
            {loading && <span className="loading">Loading quote…</span>}
            {quote && displayQuote && (
              <div className="quote-details">
                <span>Impact: {displayQuote.priceImpact}%</span>
              </div>
            )}
            {error && <span className="error">{error}</span>}
          </div>
          <div className="flow-arrow">v</div>
        </div>

        <div className="flow-step">
          <div className="flow-label">
            <strong>Sell on {opportunity.sellPlatform}</strong>
            <span className="price">${opportunity.sellPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="execution-details">
        <div className="detail-row">
          <span>Entry:</span>
          <strong>${opportunity.buyPrice.toFixed(2)}</strong>
        </div>
        <div className="detail-row">
          <span>Exit:</span>
          <strong>${opportunity.sellPrice.toFixed(2)}</strong>
        </div>
        <div className="detail-row">
          <span>Spread:</span>
          <strong className="up">{opportunity.spreadPct.toFixed(2)}%</strong>
        </div>
        <div className="detail-row">
          <span>Est. Profit (on $1k):</span>
          <strong className="up">+${profit.netProfit.toFixed(2)}</strong>
        </div>
        <div className="detail-row">
          <span>Confidence:</span>
          <div className="confidence-bar-small">
            <div
              className="confidence-fill-small"
              style={{
                width: `${opportunity.confidenceScore}%`,
                backgroundColor:
                  opportunity.confidenceScore >= 80
                    ? "#22c55e"
                    : opportunity.confidenceScore >= 70
                      ? "#f2b84b"
                      : "#ef4444",
              }}
            />
          </div>
          <span>{opportunity.confidenceScore}</span>
        </div>
      </div>

      <div className="execution-settings">
        <label>
          Slippage tolerance ({(slippage / 100).toFixed(1)}%)
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={slippage}
            onChange={(e) => setSlippage(parseInt(e.target.value))}
          />
        </label>
      </div>

      <div className="execution-actions">
        <button
          className="btn primary"
          onClick={handleExecute}
          disabled={executing || loading || !quote}
        >
          {executing ? "Executing…" : "Execute Trade"}
        </button>
        {buyAsset && (
          <a
            href={buildExecutionLink(
              opportunity.buyPlatform,
              opportunity.company,
              buyAsset.mint
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Buy on {opportunity.buyPlatform}
          </a>
        )}
        {sellAsset && (
          <a
            href={buildExecutionLink(
              opportunity.sellPlatform,
              opportunity.company,
              sellAsset.mint
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Sell on {opportunity.sellPlatform}
          </a>
        )}
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
