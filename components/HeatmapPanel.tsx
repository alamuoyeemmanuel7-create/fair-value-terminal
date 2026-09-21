"use client";

import { useMemo } from "react";
import { CompanyComparison } from "@/lib/types";
import {
  buildHeatmap,
  getHeatmapColor,
  analyzeHeatmapPatterns,
} from "@/lib/heatmap";

interface HeatmapPanelProps {
  comparisons: CompanyComparison[];
}

export function HeatmapPanel({ comparisons }: HeatmapPanelProps) {
  const heatmapData = useMemo(() => buildHeatmap(comparisons), [comparisons]);
  const patterns = useMemo(() => analyzeHeatmapPatterns(heatmapData), [heatmapData]);

  if (heatmapData.companies.length === 0) {
    return null;
  }

  const { companies, platforms, matrix } = heatmapData;
  const maxSpread = Math.max(...matrix.flat().filter((v) => v !== null).map((v) => Math.abs(v || 0))) || 20;

  return (
    <section className="panel heatmap-panel">
      <h2>Price heatmap</h2>
      <p className="desc">
        Visual matrix of prices across platforms. Darker colors indicate larger spreads. Use this
        to spot pricing patterns, platform biases, and arbitrage clusters.
      </p>

      {/* Heatmap grid */}
      <div className="heatmap-container">
        <div className="heatmap-grid">
          {/* Header row with platforms */}
          <div className="heatmap-cell header-corner" />
          {platforms.map((platform) => (
            <div
              key={`header-${platform}`}
              className="heatmap-cell header-platform"
            >
              {platform}
            </div>
          ))}

          {/* Data rows */}
          {companies.map((company, companyIdx) => (
            <div key={`row-${company}`}>
              {/* Company label */}
              <div className="heatmap-cell header-company">{company}</div>

              {/* Price cells */}
              {platforms.map((platform, platformIdx) => {
                const price = matrix[companyIdx][platformIdx];
                const color =
                  price !== null ? getHeatmapColor(price, maxSpread) : "#1a1a1a";

                return (
                  <div
                    key={`cell-${company}-${platform}`}
                    className="heatmap-cell price-cell"
                    style={{ backgroundColor: color }}
                    title={price !== null ? `$${price.toFixed(2)}` : "No data"}
                  >
                    {price !== null && (
                      <span className="price-text">${price.toFixed(2)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="legend-label">Spread magnitude:</span>
        <div
          className="legend-color"
          style={{ backgroundColor: "#6482f6" }}
        />
        <span>Low</span>
        <div
          className="legend-color"
          style={{ backgroundColor: "#f2b84b" }}
        />
        <span>Medium</span>
        <div
          className="legend-color"
          style={{ backgroundColor: "#ef4444" }}
        />
        <span>High</span>
      </div>

      {/* Insights */}
      <div className="heatmap-insights">
        <h4>Market insights</h4>

        {patterns.topSpreads.length > 0 && (
          <div className="insight-box">
            <strong>Highest spreads:</strong>
            <ul>
              {patterns.topSpreads.slice(0, 3).map((spread) => (
                <li key={`${spread.company}-${spread.platform}`}>
                  {spread.company} on {spread.platform}:{" "}
                  {spread.spreadToPlatformAvg.toFixed(1)}%
                </li>
              ))}
            </ul>
          </div>
        )}

        {patterns.mostConsistentCompany && (
          <div className="insight-box">
            <strong>Most consistent pricing:</strong>
            <p>
              {patterns.mostConsistentCompany} (spread: {patterns.mostConsistentSpread.toFixed(2)}%)
            </p>
          </div>
        )}

        {patterns.leastConsistentCompany && (
          <div className="insight-box">
            <strong>Most volatile pricing:</strong>
            <p>
              {patterns.leastConsistentCompany} (spread: {patterns.leastConsistentSpread.toFixed(2)}%)
            </p>
          </div>
        )}

        <div className="insight-box">
          <strong>Platform average prices:</strong>
          <ul>
            {Object.entries(patterns.platformAveragePrices)
              .sort(([, a], [, b]) => b - a)
              .map(([platform, avg]) => (
                <li key={platform}>
                  {platform}: ${avg.toFixed(2)}
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Color intensity note */}
      <p className="heatmap-note">
        Cell colors represent price magnitude. Green/blue = lower prices (better buys), red = higher
        prices (premium). Intensity increases with spread from platform average.
      </p>
    </section>
  );
}
