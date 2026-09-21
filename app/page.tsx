"use client";

import { useEffect, useState } from "react";
import { CompanyComparison, PythEquityComparison, SpreadTrend } from "@/lib/types";
import { ArbitrageOpportunity, detectOpportunities } from "@/lib/arbitrage";
import { FilterOptions, applyFilters } from "@/lib/filters";
import { alertManager, sendNotification } from "@/lib/alerts";
import { Sparkline } from "@/components/Sparkline";
import { ArbitragePanel } from "@/components/ArbitragePanel";
import { AlertsPanel } from "@/components/AlertsPanel";
import { FilterControls } from "@/components/FilterControls";
import { PortfolioPanel } from "@/components/PortfolioPanel";
import { ExportPanel } from "@/components/ExportPanel";
import { HeatmapPanel } from "@/components/HeatmapPanel";
import { spreadHistory } from "@/lib/spreadHistory";

interface DashboardResponse {
  comparisons: CompanyComparison[];
  fetchedAt: string;
  error?: string;
}

interface PythResponse {
  results: PythEquityComparison[];
  error?: string;
}

function fmtMoney(n?: number) {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toFixed(2)}`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [pyth, setPyth] = useState<PythResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<Map<string, SpreadTrend>>(new Map());
  const [sparklineData, setSparklineData] = useState<Map<string, number[]>>(new Map());
  const [arbitrage, setArbitrage] = useState<ArbitrageOpportunity[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({ sortBy: "spread", sortOrder: "desc" });
  const [filteredComparisons, setFilteredComparisons] = useState<CompanyComparison[]>([]);

  async function load() {
    setLoading(true);
    const [d, p] = await Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/pyth-benchmark").then((r) => r.json()),
    ]);
    setData(d);
    setPyth(p);

    // Record spreads in history
    if (d.comparisons) {
      for (const comp of d.comparisons) {
        spreadHistory.recordSpread(comp.company, comp.spreadPct, comp.spreadBasis);
      }

      // Calculate trends
      const newTrends = new Map<string, SpreadTrend>();
      const newSparklines = new Map<string, number[]>();
      for (const comp of d.comparisons) {
        const trend = spreadHistory.calculateTrend(comp.company);
        if (trend) {
          newTrends.set(comp.company, trend);
          newSparklines.set(comp.company, spreadHistory.getSparklineData(comp.company));
        }
      }
      setTrends(newTrends);
      setSparklineData(newSparklines);
      // Apply filters and sorting
      const filtered = applyFilters(d.comparisons, filters, newTrends);
      setFilteredComparisons(filtered);

      // Detect arbitrage opportunities
      const opportunities = detectOpportunities(d.comparisons);
      setArbitrage(opportunities);

      // Check alerts
      for (const comp of d.comparisons) {
        const alert = alertManager.checkSpreadAlert(comp.company, comp.spreadPct);
        if (alert) {
          sendNotification("Fair Value Alert", {
            body: alert.message,
            tag: alert.ruleId,
            icon: "/solana-icon.png",
          });
        }
      }

      for (const opp of opportunities) {
        const alert = alertManager.checkOpportunityAlert(opp.company, opp.estimatedProfit);
        if (alert) {
          sendNotification("Arbitrage Opportunity!", {
            body: alert.message,
            tag: alert.ruleId,
            icon: "/solana-icon.png",
          });
        }
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <PortfolioPanel comparisons={data?.comparisons || []} />
      <AlertsPanel companies={data?.comparisons?.map((c) => c.company) || []} />
      <FilterControls
        comparisons={data?.comparisons || []}
        onFiltersChange={setFilters}
        filteredComparisons={filteredComparisons}
      />
      <ArbitragePanel opportunities={arbitrage} assets={data?.assets || []} loading={loading} />
      <ExportPanel comparisons={data?.comparisons || []} opportunities={arbitrage} assets={data?.assets || []} />
      <HeatmapPanel comparisons={data?.comparisons || []} />

      <section className="panel">
        <h2>Cross-platform mark divergence</h2>
        <p className="desc">
          Same underlying company, priced independently by two different
          issuers on two different bonding curves. When PreStocks and
          Tessera disagree on what a company is worth, one of them is the
          better entry — this ranks the disagreements from widest to
          narrowest, refreshed every 30 seconds.
        </p>

        {loading && <div className="status">Loading live prices…</div>}
        {data?.error && <div className="err">{data.error}</div>}

        {data && !data.error && (
          <div>
            <div className="row head">
              <div>Company</div>
              <div className="num">Cheaper platform</div>
              <div className="num">Richer platform</div>
              <div className="num hide-mobile">Basis</div>
              <div className="num">Spread</div>
              <div className="num hide-mobile">24h Trend</div>
            </div>
            {filteredComparisons.map((c) => {
              const trend = trends.get(c.company);
              const sparkline = sparklineData.get(c.company) || [];
              return (
                <div className="row" key={c.company}>
                  <div className="company">
                    {c.company}
                    <span className="tag">
                      {c.assets.map((a) => a.platform).join(" · ")}
                    </span>
                  </div>
                  <div className="num">
                    {c.cheaper ? (
                      <span className="pill">{c.cheaper}</span>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className="num">
                    {c.richer ? <span className="pill">{c.richer}</span> : "—"}
                  </div>
                  <div className="num hide-mobile">
                    {c.spreadBasis === "valuation" ? "valuation" : "price"}
                  </div>
                  <div
                    className={`spread ${
                      Math.abs(c.spreadPct) > 15 ? "up" : ""
                    }`}
                  >
                    {c.spreadPct.toFixed(1)}%
                  </div>
                  <div className="num hide-mobile">
                    {trend ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Sparkline
                          data={sparkline}
                          trend={trend.direction}
                          width={50}
                          height={18}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color:
                              trend.direction === "up"
                                ? "#ef4444"
                                : trend.direction === "down"
                                  ? "#22c55e"
                                  : "#999",
                          }}
                        >
                          {Math.abs(trend.change24h).toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="status" style={{ marginTop: 16 }}>
          Last updated {data ? new Date(data.fetchedAt).toLocaleTimeString() : "…"}
        </p>
      </section>

      <section className="panel">
        <h2>Public-equity wrapper benchmark (Pyth)</h2>
        <p className="desc">
          These are public companies, so Pyth has a real, continuous equity
          feed to check the tokenized wrapper against. This is the control
          group: it shows how much basis risk exists even when ground truth
          is available every second. Pre-IPO names above have no equivalent
          public feed at all — treat their spreads with that in mind.
        </p>

        {pyth?.error && <div className="err">{pyth.error}</div>}

        {pyth && !pyth.error && (
          <div>
            <div className="row head">
              <div>Symbol</div>
              <div className="num">Equity feed</div>
              <div className="num">xStock feed</div>
              <div className="num">Spread</div>
            </div>
            {pyth.results.map((r) => (
              <div className="row" key={r.symbol}>
                <div className="company">{r.symbol}</div>
                <div className="num">{fmtMoney(r.equityPrice ?? undefined)}</div>
                <div className="num">{fmtMoney(r.xStockPrice ?? undefined)}</div>
                <div className="spread">
                  {r.spreadPct !== null ? `${r.spreadPct.toFixed(2)}%` : "no feed"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
