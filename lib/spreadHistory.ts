/**
 * Spread History Manager
 * Tracks historical spread data with timestamps for trending analysis
 */

export interface SpreadSnapshot {
  company: string;
  spreadPct: number;
  timestamp: number; // Unix timestamp in ms
  basis: "valuation" | "price";
}

const HISTORY_KEY = "spread_history";
const MAX_HISTORY_ITEMS = 1440; // ~24 hours at 1-minute intervals

class SpreadHistoryManager {
  private history: SpreadSnapshot[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
        // Trim old entries
        const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
        this.history = this.history.filter((s) => s.timestamp > cutoff);
      }
    } catch (err) {
      console.error("Failed to load spread history:", err);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch (err) {
      console.error("Failed to save spread history:", err);
    }
  }

  /**
   * Record a new spread snapshot for a company
   */
  recordSpread(company: string, spreadPct: number, basis: "valuation" | "price") {
    const snapshot: SpreadSnapshot = {
      company,
      spreadPct,
      timestamp: Date.now(),
      basis,
    };

    this.history.push(snapshot);

    // Keep only recent history
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(-MAX_HISTORY_ITEMS);
    }

    this.saveToStorage();
  }

  /**
   * Get all history for a specific company
   */
  getHistory(company: string): SpreadSnapshot[] {
    return this.history.filter((s) => s.company === company);
  }

  /**
   * Get history for a time window (in minutes)
   */
  getHistoryWindow(company: string, minutesBack: number): SpreadSnapshot[] {
    const cutoff = Date.now() - minutesBack * 60 * 1000;
    return this.getHistory(company).filter((s) => s.timestamp > cutoff);
  }

  /**
   * Calculate trend data
   */
  calculateTrend(company: string) {
    const now24h = this.getHistoryWindow(company, 1440);
    const now7d = this.getHistoryWindow(company, 10080);
    const now1h = this.getHistoryWindow(company, 60);

    if (now24h.length === 0) return null;

    const current = now24h[now24h.length - 1];
    const avg24h = now24h.reduce((sum, s) => sum + s.spreadPct, 0) / now24h.length;
    const max24h = Math.max(...now24h.map((s) => s.spreadPct));
    const min24h = Math.min(...now24h.map((s) => s.spreadPct));

    const older24h = now24h[0];
    const change24h = current.spreadPct - older24h.spreadPct;

    const avg7d = now7d.length > 0
      ? now7d.reduce((sum, s) => sum + s.spreadPct, 0) / now7d.length
      : avg24h;

    const trend1h = now1h.length >= 2
      ? now1h[now1h.length - 1].spreadPct - now1h[0].spreadPct
      : 0;

    return {
      current: current.spreadPct,
      avg24h,
      avg7d,
      max24h,
      min24h,
      change24h,
      trend1h,
      direction: change24h > 0 ? "up" : change24h < 0 ? "down" : "stable",
    };
  }

  /**
   * Get sparkline data (normalized to 0-1 range for visualization)
   */
  getSparklineData(company: string, points: number = 50): number[] {
    const history = this.getHistoryWindow(company, 1440); // 24 hours
    if (history.length === 0) return [];

    // Interpolate to exact number of points
    const step = Math.max(1, Math.floor(history.length / points));
    const sampled = [];
    for (let i = 0; i < history.length; i += step) {
      sampled.push(history[i].spreadPct);
    }

    if (sampled.length === 0) return [];

    const min = Math.min(...sampled);
    const max = Math.max(...sampled);
    const range = max - min || 1;

    return sampled.map((v) => (v - min) / range);
  }

  /**
   * Clear all history
   */
  clearHistory() {
    this.history = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem(HISTORY_KEY);
    }
  }
}

export const spreadHistory = new SpreadHistoryManager();
