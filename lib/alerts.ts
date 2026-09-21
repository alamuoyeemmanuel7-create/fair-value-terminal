/**
 * Alert Management System
 * Tracks alert settings and triggers notifications when thresholds are crossed
 */

export interface AlertRule {
  id: string;
  company: string;
  type: "spread_above" | "spread_below" | "opportunity";
  threshold: number; // % for spread alerts, % profit for opportunity alerts
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
}

export interface AlertEvent {
  ruleId: string;
  company: string;
  type: "spread_above" | "spread_below" | "opportunity";
  currentValue: number;
  threshold: number;
  timestamp: number;
  message: string;
}

const ALERTS_STORAGE_KEY = "alert_rules";
const ALERT_HISTORY_KEY = "alert_history";
const ALERT_COOLDOWN_MS = 60000; // Don't re-trigger same alert within 1 minute

class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private history: AlertEvent[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (stored) {
        const rules = JSON.parse(stored) as AlertRule[];
        for (const rule of rules) {
          this.rules.set(rule.id, rule);
        }
      }

      const historyStored = localStorage.getItem(ALERT_HISTORY_KEY);
      if (historyStored) {
        this.history = JSON.parse(historyStored);
        // Keep only last 24 hours
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        this.history = this.history.filter((h) => h.timestamp > cutoff);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        ALERTS_STORAGE_KEY,
        JSON.stringify(Array.from(this.rules.values()))
      );
      localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(this.history));
    } catch (err) {
      console.error("Failed to save alerts:", err);
    }
  }

  /**
   * Create a new alert rule
   */
  createRule(
    company: string,
    type: "spread_above" | "spread_below" | "opportunity",
    threshold: number
  ): AlertRule {
    const id = `${company}-${type}-${Date.now()}`;
    const rule: AlertRule = {
      id,
      company,
      type,
      threshold,
      enabled: true,
      createdAt: Date.now(),
    };
    this.rules.set(id, rule);
    this.saveToStorage();
    return rule;
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules for a specific company
   */
  getRulesForCompany(company: string): AlertRule[] {
    return Array.from(this.rules.values()).filter((r) => r.company === company);
  }

  /**
   * Delete an alert rule
   */
  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.saveToStorage();
  }

  /**
   * Toggle alert rule enabled/disabled
   */
  toggleRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      this.saveToStorage();
    }
  }

  /**
   * Check if a spread value triggers any alert rules
   */
  checkSpreadAlert(company: string, spreadPct: number): AlertEvent | null {
    const rules = this.getRulesForCompany(company).filter((r) => r.enabled);

    for (const rule of rules) {
      if (rule.type === "spread_above" && spreadPct > rule.threshold) {
        // Check cooldown
        if (
          rule.lastTriggered &&
          Date.now() - rule.lastTriggered < ALERT_COOLDOWN_MS
        ) {
          continue;
        }

        const event: AlertEvent = {
          ruleId: rule.id,
          company,
          type: "spread_above",
          currentValue: spreadPct,
          threshold: rule.threshold,
          timestamp: Date.now(),
          message: `${company} spread is ${spreadPct.toFixed(1)}% (threshold: ${rule.threshold}%)`,
        };

        rule.lastTriggered = Date.now();
        this.history.push(event);
        this.saveToStorage();

        return event;
      } else if (rule.type === "spread_below" && spreadPct < rule.threshold) {
        // Check cooldown
        if (
          rule.lastTriggered &&
          Date.now() - rule.lastTriggered < ALERT_COOLDOWN_MS
        ) {
          continue;
        }

        const event: AlertEvent = {
          ruleId: rule.id,
          company,
          type: "spread_below",
          currentValue: spreadPct,
          threshold: rule.threshold,
          timestamp: Date.now(),
          message: `${company} spread is ${spreadPct.toFixed(1)}% (threshold: ${rule.threshold}%)`,
        };

        rule.lastTriggered = Date.now();
        this.history.push(event);
        this.saveToStorage();

        return event;
      }
    }

    return null;
  }

  /**
   * Check if an arbitrage opportunity triggers an alert
   */
  checkOpportunityAlert(company: string, profit: number): AlertEvent | null {
    const rules = this.getRulesForCompany(company)
      .filter((r) => r.type === "opportunity" && r.enabled);

    for (const rule of rules) {
      if (profit > rule.threshold) {
        // Check cooldown
        if (
          rule.lastTriggered &&
          Date.now() - rule.lastTriggered < ALERT_COOLDOWN_MS
        ) {
          continue;
        }

        const event: AlertEvent = {
          ruleId: rule.id,
          company,
          type: "opportunity",
          currentValue: profit,
          threshold: rule.threshold,
          timestamp: Date.now(),
          message: `${company} opportunity detected: +${profit.toFixed(2)}% profit`,
        };

        rule.lastTriggered = Date.now();
        this.history.push(event);
        this.saveToStorage();

        return event;
      }
    }

    return null;
  }

  /**
   * Get alert history
   */
  getHistory(): AlertEvent[] {
    return [...this.history];
  }

  /**
   * Clear alert history
   */
  clearHistory(): void {
    this.history = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem(ALERT_HISTORY_KEY);
    }
  }
}

export const alertManager = new AlertManager();

/**
 * Send browser notification (requires permission)
 */
export async function sendNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, options);
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(title, options);
    }
  }
}
