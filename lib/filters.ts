/**
 * Filtering and Sorting Utilities
 * Provides advanced filtering and sorting for comparison data
 */

import { CompanyComparison } from "./types";

export type SortBy = "spread" | "company" | "change24h" | "platform";
export type SortOrder = "asc" | "desc";

export interface FilterOptions {
  minSpread?: number;
  maxSpread?: number;
  platform?: string | null; // Filter by specific platform
  searchTerm?: string; // Company name search
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

/**
 * Apply filters to comparisons
 */
export function applyFilters(
  comparisons: CompanyComparison[],
  filters: FilterOptions,
  trends: Map<string, any> // Trend data for sorting
): CompanyComparison[] {
  let filtered = [...comparisons];

  // Filter by spread range
  if (filters.minSpread !== undefined) {
    filtered = filtered.filter((c) => Math.abs(c.spreadPct) >= filters.minSpread!);
  }
  if (filters.maxSpread !== undefined) {
    filtered = filtered.filter((c) => Math.abs(c.spreadPct) <= filters.maxSpread!);
  }

  // Filter by platform
  if (filters.platform) {
    filtered = filtered.filter((c) =>
      c.assets.some((a) => a.platform === filters.platform)
    );
  }

  // Filter by company name search
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter((c) => c.company.toLowerCase().includes(term));
  }

  // Sort
  const sortBy = filters.sortBy || "spread";
  const sortOrder = filters.sortOrder || "desc";

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "spread":
        comparison = Math.abs(a.spreadPct) - Math.abs(b.spreadPct);
        break;
      case "company":
        comparison = a.company.localeCompare(b.company);
        break;
      case "change24h": {
        const trendA = trends.get(a.company);
        const trendB = trends.get(b.company);
        const changeA = trendA?.change24h ?? 0;
        const changeB = trendB?.change24h ?? 0;
        comparison = changeA - changeB;
        break;
      }
      case "platform":
        comparison = (a.cheaper || "").localeCompare(b.cheaper || "");
        break;
      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  return filtered;
}

/**
 * Get unique platforms from comparisons
 */
export function getUniquePlatforms(comparisons: CompanyComparison[]): string[] {
  const platforms = new Set<string>();
  for (const comp of comparisons) {
    for (const asset of comp.assets) {
      platforms.add(asset.platform);
    }
  }
  return Array.from(platforms).sort();
}

/**
 * Calculate statistics for filtered data
 */
export function calculateStats(comparisons: CompanyComparison[]) {
  if (comparisons.length === 0) {
    return {
      count: 0,
      avgSpread: 0,
      maxSpread: 0,
      minSpread: 0,
      medianSpread: 0,
    };
  }

  const spreads = comparisons.map((c) => Math.abs(c.spreadPct));
  const sorted = [...spreads].sort((a, b) => a - b);

  return {
    count: comparisons.length,
    avgSpread: spreads.reduce((a, b) => a + b, 0) / spreads.length,
    maxSpread: Math.max(...spreads),
    minSpread: Math.min(...spreads),
    medianSpread:
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)],
  };
}

/**
 * Save filter presets to localStorage
 */
export interface FilterPreset {
  name: string;
  filters: FilterOptions;
  createdAt: number;
}

const PRESETS_KEY = "filter_presets";

export function saveFilterPreset(name: string, filters: FilterOptions): FilterPreset {
  const preset: FilterPreset = {
    name,
    filters,
    createdAt: Date.now(),
  };

  if (typeof window === "undefined") return preset;

  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    const presets: FilterPreset[] = stored ? JSON.parse(stored) : [];
    const existing = presets.findIndex((p) => p.name === name);
    if (existing >= 0) {
      presets[existing] = preset;
    } else {
      presets.push(preset);
    }
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (err) {
    console.error("Failed to save filter preset:", err);
  }

  return preset;
}

export function getFilterPresets(): FilterPreset[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Failed to load filter presets:", err);
    return [];
  }
}

export function deleteFilterPreset(name: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    let presets: FilterPreset[] = stored ? JSON.parse(stored) : [];
    presets = presets.filter((p) => p.name !== name);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (err) {
    console.error("Failed to delete filter preset:", err);
  }
}
