/**
 * Portfolio Analytics
 * Tracks holdings, cost basis, P&L, and exposure
 */

export interface Position {
  company: string;
  platform: string;
  mint: string;
  quantity: number;
  entryPrice: number; // USD per token
  currentPrice: number; // USD per token
  entryTimestamp: number;
}

export interface PortfolioMetrics {
  totalValue: number; // Current value of all positions
  totalCostBasis: number; // Total invested
  totalGain: number; // USD
  totalGainPct: number; // %
  realizedPnL: number; // Closed positions
  unrealizedPnL: number; // Open positions
  largestPosition: Position | null;
  bestPerformer: { company: string; gainPct: number } | null;
  worstPerformer: { company: string; gainPct: number } | null;
  exposureByPlatform: Record<string, number>; // % breakdown
  exposureByCompany: Record<string, number>; // % breakdown
}

export interface PortfolioAlert {
  type: "concentration" | "loss" | "gain" | "imbalance";
  severity: "low" | "medium" | "high";
  message: string;
}

const PORTFOLIO_KEY = "portfolio_positions";
const CLOSED_POSITIONS_KEY = "closed_positions";

class PortfolioManager {
  private positions: Map<string, Position> = new Map();
  private closedPositions: Position[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(PORTFOLIO_KEY);
      if (stored) {
        const positions = JSON.parse(stored) as Position[];
        for (const pos of positions) {
          this.positions.set(`${pos.mint}-${pos.platform}`, pos);
        }
      }

      const closedStored = localStorage.getItem(CLOSED_POSITIONS_KEY);
      if (closedStored) {
        this.closedPositions = JSON.parse(closedStored);
      }
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        PORTFOLIO_KEY,
        JSON.stringify(Array.from(this.positions.values()))
      );
      localStorage.setItem(CLOSED_POSITIONS_KEY, JSON.stringify(this.closedPositions));
    } catch (err) {
      console.error("Failed to save portfolio:", err);
    }
  }

  /**
   * Add or update a position
   */
  addPosition(position: Position): void {
    const key = `${position.mint}-${position.platform}`;
    this.positions.set(key, position);
    this.saveToStorage();
  }

  /**
   * Remove a position (mark as closed)
   */
  closePosition(mint: string, platform: string, exitPrice: number): void {
    const key = `${mint}-${platform}`;
    const pos = this.positions.get(key);
    if (pos) {
      this.closedPositions.push({
        ...pos,
        currentPrice: exitPrice,
      });
      this.positions.delete(key);
      this.saveToStorage();
    }
  }

  /**
   * Get all open positions
   */
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Update current price for all positions
   */
  updatePrices(priceMap: Map<string, number>): void {
    for (const [key, pos] of this.positions) {
      const newPrice = priceMap.get(pos.mint) || priceMap.get(pos.company);
      if (newPrice) {
        pos.currentPrice = newPrice;
      }
    }
    this.saveToStorage();
  }

  /**
   * Calculate portfolio metrics
   */
  calculateMetrics(): PortfolioMetrics {
    const positions = this.getPositions();

    if (positions.length === 0) {
      return {
        totalValue: 0,
        totalCostBasis: 0,
        totalGain: 0,
        totalGainPct: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        largestPosition: null,
        bestPerformer: null,
        worstPerformer: null,
        exposureByPlatform: {},
        exposureByCompany: {},
      };
    }

    // Calculate metrics
    const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);
    const totalCostBasis = positions.reduce((sum, p) => sum + p.quantity * p.entryPrice, 0);
    const totalGain = totalValue - totalCostBasis;
    const totalGainPct = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

    // Realized P&L from closed positions
    const realizedPnL = this.closedPositions.reduce((sum, p) => {
      const gainPerToken = p.currentPrice - p.entryPrice;
      return sum + gainPerToken * p.quantity;
    }, 0);

    const unrealizedPnL = totalGain;

    // Largest position
    const largestPosition = positions.reduce((largest, p) =>
      p.quantity * p.currentPrice > (largest?.quantity ?? 0) * (largest?.currentPrice ?? 0)
        ? p
        : largest
    );

    // Best/worst performer
    const performerData = positions.map((p) => ({
      company: p.company,
      gainPct: ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100,
    }));

    const bestPerformer = performerData.reduce((best, curr) =>
      curr.gainPct > best.gainPct ? curr : best
    );

    const worstPerformer = performerData.reduce((worst, curr) =>
      curr.gainPct < worst.gainPct ? curr : worst
    );

    // Exposure breakdown
    const exposureByPlatform: Record<string, number> = {};
    const exposureByCompany: Record<string, number> = {};

    for (const pos of positions) {
      const value = pos.quantity * pos.currentPrice;
      exposureByPlatform[pos.platform] = (exposureByPlatform[pos.platform] || 0) + value;
      exposureByCompany[pos.company] = (exposureByCompany[pos.company] || 0) + value;
    }

    // Normalize to percentages
    for (const platform in exposureByPlatform) {
      exposureByPlatform[platform] = (exposureByPlatform[platform] / totalValue) * 100;
    }
    for (const company in exposureByCompany) {
      exposureByCompany[company] = (exposureByCompany[company] / totalValue) * 100;
    }

    return {
      totalValue,
      totalCostBasis,
      totalGain,
      totalGainPct,
      realizedPnL,
      unrealizedPnL,
      largestPosition,
      bestPerformer: bestPerformer.gainPct !== -Infinity ? bestPerformer : null,
      worstPerformer: worstPerformer.gainPct !== Infinity ? worstPerformer : null,
      exposureByPlatform,
      exposureByCompany,
    };
  }

  /**
   * Generate alerts for portfolio
   */
  generateAlerts(): PortfolioAlert[] {
    const alerts: PortfolioAlert[] = [];
    const metrics = this.calculateMetrics();
    const positions = this.getPositions();

    // Concentration risk
    if (metrics.largestPosition) {
      const largestExposure =
        (metrics.largestPosition.quantity * metrics.largestPosition.currentPrice) /
        metrics.totalValue;
      if (largestExposure > 0.5) {
        alerts.push({
          type: "concentration",
          severity: "high",
          message: `${metrics.largestPosition.company} represents ${(largestExposure * 100).toFixed(0)}% of portfolio`,
        });
      } else if (largestExposure > 0.35) {
        alerts.push({
          type: "concentration",
          severity: "medium",
          message: `${metrics.largestPosition.company} represents ${(largestExposure * 100).toFixed(0)}% of portfolio`,
        });
      }
    }

    // Loss positions
    const lossingPositions = positions.filter(
      (p) => (p.currentPrice - p.entryPrice) / p.entryPrice < -0.1
    );
    if (lossingPositions.length > 0) {
      alerts.push({
        type: "loss",
        severity: "medium",
        message: `${lossingPositions.length} position${lossingPositions.length > 1 ? "s" : ""} down >10%`,
      });
    }

    // Large gains (take profit alert)
    const gainingPositions = positions.filter(
      (p) => (p.currentPrice - p.entryPrice) / p.entryPrice > 0.3
    );
    if (gainingPositions.length > 0) {
      alerts.push({
        type: "gain",
        severity: "low",
        message: `${gainingPositions.length} position${gainingPositions.length > 1 ? "s" : ""} up >30%`,
      });
    }

    return alerts;
  }

  /**
   * Clear all positions
   */
  clearPositions(): void {
    this.positions.clear();
    this.closedPositions = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem(PORTFOLIO_KEY);
      localStorage.removeItem(CLOSED_POSITIONS_KEY);
    }
  }
}

export const portfolioManager = new PortfolioManager();
