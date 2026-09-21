"use client";

import { useState } from "react";
import { CompanyComparison, RawAsset } from "@/lib/types";
import { ArbitrageOpportunity } from "@/lib/arbitrage";
import {
  exportComparisons,
  exportOpportunities,
  exportAssets,
  generateComprehensiveReport,
  downloadFile,
  getTimestamp,
} from "@/lib/export";
import { spreadHistory } from "@/lib/spreadHistory";

interface ExportPanelProps {
  comparisons: CompanyComparison[];
  opportunities: ArbitrageOpportunity[];
  assets: RawAsset[];
}

export function ExportPanel({ comparisons, opportunities, assets }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportComparisons = async () => {
    setExporting(true);
    try {
      const csv = exportComparisons(comparisons);
      downloadFile(csv, `comparisons-${getTimestamp()}.csv`);
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  };

  const handleExportOpportunities = async () => {
    setExporting(true);
    try {
      const csv = exportOpportunities(opportunities);
      downloadFile(csv, `opportunities-${getTimestamp()}.csv`);
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  };

  const handleExportAssets = async () => {
    setExporting(true);
    try {
      const csv = exportAssets(assets);
      downloadFile(csv, `assets-${getTimestamp()}.csv`);
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  };

  const handleExportHistory = async () => {
    setExporting(true);
    try {
      // Get history for all companies
      const allHistory = comparisons.flatMap((c) =>
        spreadHistory.getHistory(c.company)
      );
      
      if (allHistory.length === 0) {
        alert("No history available yet");
        setExporting(false);
        return;
      }

      const csv = require("@/lib/export").exportSpreadHistory(allHistory);
      downloadFile(csv, `spread-history-${getTimestamp()}.csv`);
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  };

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const report = generateComprehensiveReport(comparisons, opportunities, assets);
      downloadFile(report, `report-${getTimestamp()}.txt`, "text/plain");
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  };

  return (
    <section className="panel export-panel">
      <h2>Export & reporting</h2>
      <p className="desc">
        Download data snapshots for analysis, record-keeping, or external reporting. All exports
        are generated client-side and include current market data.
      </p>

      <div className="export-grid">
        <div className="export-card">
          <h4>Current Comparisons</h4>
          <p className="card-desc">
            All cross-platform spreads at current market prices
          </p>
          <button
            className="btn primary"
            onClick={handleExportComparisons}
            disabled={exporting || comparisons.length === 0}
          >
            {exporting ? "Exporting…" : "Download CSV"}
          </button>
          <span className="card-meta">{comparisons.length} records</span>
        </div>

        <div className="export-card">
          <h4>Arbitrage Opportunities</h4>
          <p className="card-desc">
            All currently profitable trading opportunities
          </p>
          <button
            className="btn primary"
            onClick={handleExportOpportunities}
            disabled={exporting || opportunities.length === 0}
          >
            {exporting ? "Exporting…" : "Download CSV"}
          </button>
          <span className="card-meta">{opportunities.length} records</span>
        </div>

        <div className="export-card">
          <h4>Asset Details</h4>
          <p className="card-desc">
            Complete asset inventory with valuations and metrics
          </p>
          <button
            className="btn primary"
            onClick={handleExportAssets}
            disabled={exporting || assets.length === 0}
          >
            {exporting ? "Exporting…" : "Download CSV"}
          </button>
          <span className="card-meta">{assets.length} records</span>
        </div>

        <div className="export-card">
          <h4>Spread History</h4>
          <p className="card-desc">
            24-hour historical spread data for all tracked companies
          </p>
          <button
            className="btn primary"
            onClick={handleExportHistory}
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Download CSV"}
          </button>
          <span className="card-meta">Time series data</span>
        </div>

        <div className="export-card full-width">
          <h4>Comprehensive Report</h4>
          <p className="card-desc">
            Complete snapshot: summary stats, top opportunities, all comparisons, and assets
          </p>
          <button
            className="btn primary"
            onClick={handleExportReport}
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Download Report (TXT)"}
          </button>
          <span className="card-meta">Combined report</span>
        </div>
      </div>

      <div className="export-info">
        <strong>Privacy note:</strong> All exports are generated and downloaded directly to your
        device. No data is sent to any external servers.
      </div>
    </section>
  );
}
