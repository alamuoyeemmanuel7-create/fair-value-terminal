"use client";

import { useState, useEffect } from "react";
import { AlertRule, alertManager } from "@/lib/alerts";

export function AlertsPanel({ companies }: { companies: string[] }) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: companies[0] || "",
    type: "spread_above" as const,
    threshold: 10,
  });

  useEffect(() => {
    setRules(alertManager.getRules());
  }, []);

  const handleAddRule = () => {
    alertManager.createRule(
      formData.company,
      formData.type,
      formData.threshold
    );
    setRules(alertManager.getRules());
    setShowForm(false);
    setFormData({
      company: companies[0] || "",
      type: "spread_above",
      threshold: 10,
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    alertManager.deleteRule(ruleId);
    setRules(alertManager.getRules());
  };

  const handleToggleRule = (ruleId: string) => {
    alertManager.toggleRule(ruleId);
    setRules(alertManager.getRules());
  };

  const typeLabel = {
    spread_above: "Spread above",
    spread_below: "Spread below",
    opportunity: "Opportunity profit above",
  };

  return (
    <section className="panel alerts-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Alert rules</h2>
        <button
          className="btn"
          onClick={() => setShowForm(!showForm)}
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          {showForm ? "Cancel" : "+ Add alert"}
        </button>
      </div>

      {showForm && (
        <div className="alert-form">
          <div className="field">
            <label>Company</label>
            <select
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
            >
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Alert type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "spread_above" | "spread_below" | "opportunity",
                })
              }
            >
              <option value="spread_above">Spread goes above %</option>
              <option value="spread_below">Spread goes below %</option>
              <option value="opportunity">Arbitrage profit above %</option>
            </select>
          </div>

          <div className="field">
            <label>Threshold ({formData.type === "opportunity" ? "% profit" : "% spread"})</label>
            <input
              type="number"
              value={formData.threshold}
              onChange={(e) =>
                setFormData({ ...formData, threshold: parseFloat(e.target.value) })
              }
              step="0.1"
            />
          </div>

          <button className="btn primary" onClick={handleAddRule} style={{ width: "100%" }}>
            Create alert
          </button>
        </div>
      )}

      {rules.length === 0 && !showForm && (
        <p className="desc">
          No alert rules configured. Create one to get notified when spreads or opportunities hit your thresholds.
        </p>
      )}

      {rules.length > 0 && (
        <div className="alerts-list">
          {rules.map((rule) => (
            <div key={rule.id} className="alert-item">
              <div style={{ flex: 1 }}>
                <div className="alert-title">
                  {rule.company} — {typeLabel[rule.type]} {rule.threshold}%
                </div>
                <div className="alert-meta">
                  Created {new Date(rule.createdAt).toLocaleDateString()}
                  {rule.lastTriggered && (
                    <>
                      {" · Last triggered "}
                      {new Date(rule.lastTriggered).toLocaleTimeString()}
                    </>
                  )}
                </div>
              </div>
              <div className="alert-actions">
                <button
                  className={`toggle-btn ${rule.enabled ? "enabled" : "disabled"}`}
                  onClick={() => handleToggleRule(rule.id)}
                  title={rule.enabled ? "Disable" : "Enable"}
                >
                  {rule.enabled ? "On" : "Off"}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteRule(rule.id)}
                  title="Delete"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
