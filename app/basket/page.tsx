"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, sendAndConfirmRawTransaction } from "@solana/web3.js";
import { CompanyComparison } from "@/lib/types";
import { buildBasketLaunchTransactions, weightedBasketValuation } from "@/lib/meteora";

interface LegState {
  company: string;
  valuation: number;
  weightPct: number;
  include: boolean;
}

export default function BasketPage() {
  const { connection } = useConnection();
  const { publicKey, signAllTransactions } = useWallet();

  const [legs, setLegs] = useState<LegState[]>([]);
  const [symbol, setSymbol] = useState("AIBASKT");
  const [name, setName] = useState("AI Titans Basket");
  const [status, setStatus] = useState<string | null>(
    "⚠️ Basket launch is currently unavailable. This feature requires Meteora DBC SDK compatibility updates. The dashboard and trade pages are fully functional."
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: { comparisons: CompanyComparison[] }) => {
        const rows = d.comparisons
          .filter((c) => c.assets.some((a) => a.markValuation))
          .map((c) => {
            const withVal = c.assets.find((a) => a.markValuation);
            return {
              company: c.company,
              valuation: withVal?.markValuation ?? 0,
              weightPct: 0,
              include: false,
            };
          });
        setLegs(rows);
      });
  }, []);

  const included = legs.filter((l) => l.include);
  const totalWeight = included.reduce((s, l) => s + l.weightPct, 0);
  const impliedValuation = weightedBasketValuation(
    included.map((l) => ({
      company: l.company,
      weightPct: l.weightPct,
      referenceValuationUsd: l.valuation,
    }))
  );

  function toggle(i: number) {
    setLegs((prev) =>
      prev.map((l, idx) =>
        idx === i ? { ...l, include: !l.include, weightPct: l.include ? 0 : 25 } : l
      )
    );
  }

  function setWeight(i: number, w: number) {
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, weightPct: w } : l)));
  }

  async function launch() {
    setStatus("⚠️ Basket launch is currently unavailable due to Meteora SDK compatibility issues.");
  }

  return (
    <section className="panel">
      <h2>Launch a basket</h2>
      <p className="desc">
        Compose a weighted index of pre-IPO names from the live comparison
        table and mint it as a single token on a Meteora Dynamic Bonding
        Curve. The starting market cap is derived from the weighted mark
        valuation of the legs you pick, so it launches priced against what
        the underlying is actually marked at right now.
      </p>

      <div className="grid2">
        <div className="field">
          <label>Basket name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Symbol</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
      </div>

      <div className="row head">
        <div>Company</div>
        <div className="num hide-mobile">Mark valuation</div>
        <div className="num">Weight %</div>
      </div>
      {legs.map((l, i) => (
        <div className="row" key={l.company} style={{ opacity: l.include ? 1 : 0.5 }}>
          <div className="company">
            <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={l.include} onChange={() => toggle(i)} />
              {l.company}
            </label>
          </div>
          <div className="num hide-mobile">
            ${(l.valuation / 1_000_000_000).toFixed(2)}B
          </div>
          <div className="num">
            <input
              type="number"
              disabled={!l.include}
              value={l.weightPct}
              onChange={(e) => setWeight(i, Number(e.target.value))}
              style={{ width: 70, textAlign: "right" }}
            />
          </div>
        </div>
      ))}

      <p className="status" style={{ marginTop: 12 }}>
        Total weight: {totalWeight}% · Implied basket valuation:{" "}
        ${(impliedValuation / 1_000_000_000).toFixed(2)}B
      </p>

      <button className="btn primary" disabled={true} onClick={launch} style={{ marginTop: 12 }}>
        {busy ? "Launching…" : "Launch basket on Meteora DBC (Unavailable)"}
      </button>

      {status && <p className="status" style={{ marginTop: 12 }}>{status}</p>}
    </section>
  );
}
