/**
 * Export & Reporting
 * Generate CSV exports and reports
 */

import { CompanyComparison, RawAsset } from "./types";
import { ArbitrageOpportunity } from "./arbitrage";
import { SpreadSnapshot } from "./spreadHistory";

/**
 * Convert data to CSV format
 */
function toCSV(headers: string[], rows: (string | number)[][]): string {
  const headerRow = headers.map((h) => `"${h}"`).join(",");
  const dataRows = rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return "";
          const str = cell.toString();
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(",")
    )
    .join("\n");
  return `${headerRow}\n${dataRows}`;
}

/**
 * Export current comparisons as CSV
 */
export function exportComparisons(comparisons: CompanyComparison[]): string {
  const headers = [
    "Company",
    "Platforms",
    "Cheaper Platform",
    "Richer Platform",
    "Spread %",
    "Basis",
    "Cheaper Price",
    "Richer Price",
  ];

  const rows = comparisons.map((c) => {
    const cheaper = c.assets.find((a) => a.platform === c.cheaper);
    const richer = c.assets.find((a) => a.platform === c.richer);

    return [
      c.company,
      c.assets.map((a) => a.platform).join("|"),
      c.cheaper || "",
      c.richer || "",
      c.spreadPct.toFixed(2),
      c.spreadBasis,
      cheaper?.markPrice.toFixed(2) || "",
      richer?.markPrice.toFixed(2) || "",
    ];
  });

  return toCSV(headers, rows);
}

/**
 * Export arbitrage opportunities as CSV
 */
export function exportOpportunities(opportunities: ArbitrageOpportunity[]): string {
  const headers = [
    "Company",
    "Buy Platform",
    "Buy Price",
    "Sell Platform",
    "Sell Price",
    "Spread %",
    "Est. Profit %",
    "Confidence Score",
  ];

  const rows = opportunities.map((o) => [
    o.company,
    o.buyPlatform,
    o.buyPrice.toFixed(2),
    o.sellPlatform,
    o.sellPrice.toFixed(2),
    o.spreadPct.toFixed(2),
    o.estimatedProfit.toFixed(2),
    o.confidenceScore,
  ]);

  return toCSV(headers, rows);
}

/**
 * Export spread history as CSV
 */
export function exportSpreadHistory(snapshots: SpreadSnapshot[]): string {
  const headers = ["Company", "Spread %", "Timestamp", "Basis"];

  const rows = snapshots.map((s) => [
    s.company,
    s.spreadPct.toFixed(2),
    new Date(s.timestamp).toISOString(),
    s.basis,
  ]);

  return toCSV(headers, rows);
}

/**
 * Export all assets with current prices
 */
export function exportAssets(assets: RawAsset[]): string {
  const headers = [
    "Company",
    "Platform",
    "Symbol",
    "Mint",
    "Mark Price",
    "Token Price",
    "Mark Valuation",
    "Implied Valuation",
    "Supply",
    "Holders",
  ];

  const rows = assets.map((a) => [
    a.company,
    a.platform,
    a.displaySymbol,
    a.mint,
    a.markPrice.toFixed(2),
    a.tokenPrice?.toFixed(2) || "",
    a.markValuation?.toFixed(2) || "",
    a.impliedValuation?.toFixed(2) || "",
    a.supply || "",
    a.holders || "",
  ]);

  return toCSV(headers, rows);
}

/**
 * Generate comprehensive report combining all data
 */
export function generateComprehensiveReport(
  comparisons: CompanyComparison[],
  opportunities: ArbitrageOpportunity[],
  assets: RawAsset[],
  timestamp: string = new Date().toISOString()
): string {
  const sections: string[] = [];

  // Header
  sections.push("FAIR VALUE TERMINAL REPORT");
  sections.push(`Generated: ${timestamp}\n`);

  // Summary stats
  sections.push("=== SUMMARY STATISTICS ===");
  sections.push(`Total Companies Tracked: ${comparisons.length}`);
  sections.push(`Total Assets: ${assets.length}`);
  sections.push(`Active Platforms: ${new Set(assets.map((a) => a.platform)).size}`);
  sections.push(`Profitable Opportunities: ${opportunities.length}`);
  sections.push("");

  // Top opportunities
  if (opportunities.length > 0) {
    sections.push("=== TOP 10 ARBITRAGE OPPORTUNITIES ===");
    sections.push(exportOpportunities(opportunities.slice(0, 10)));
    sections.push("");
  }

  // All comparisons
  sections.push("=== ALL COMPARISONS ===");
  sections.push(exportComparisons(comparisons));
  sections.push("");

  // Asset details
  sections.push("=== ASSET DETAILS ===");
  sections.push(exportAssets(assets));
  sections.push("");

  return sections.join("\n");
}

/**
 * Download file to user's computer
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/csv") {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate timestamp for filenames
 */
export function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").split("-").slice(0, -1).join("-");
}
