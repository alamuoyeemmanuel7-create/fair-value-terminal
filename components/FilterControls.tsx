"use client";

import { useState, useEffect } from "react";
import {
  FilterOptions,
  SortBy,
  SortOrder,
  getUniquePlatforms,
  getFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
  calculateStats,
} from "@/lib/filters";
import { CompanyComparison } from "@/lib/types";

interface FilterControlsProps {
  comparisons: CompanyComparison[];
  onFiltersChange: (filters: FilterOptions) => void;
  filteredComparisons: CompanyComparison[];
}

export function FilterControls({
  comparisons,
  onFiltersChange,
  filteredComparisons,
}: FilterControlsProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "spread",
    sortOrder: "desc",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState(getFilterPresets());
  const platforms = getUniquePlatforms(comparisons);
  const stats = calculateStats(filteredComparisons);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      saveFilterPreset(presetName, filters);
      setPresets(getFilterPresets());
      setPresetName("");
    }
  };

  const handleLoadPreset = (preset: any) => {
    setFilters(preset.filters);
    onFiltersChange(preset.filters);
  };

  const handleDeletePreset = (name: string) => {
    deleteFilterPreset(name);
    setPresets(getFilterPresets());
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      sortBy: "spread",
      sortOrder: "desc",
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="filter-controls">
      <div className="filter-row">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Company name…"
            value={filters.searchTerm || ""}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Platform</label>
          <select
            value={filters.platform || ""}
            onChange={(e) => handleFilterChange("platform", e.target.value || null)}
            className="filter-select"
          >
            <option value="">All platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by</label>
          <select
            value={filters.sortBy || "spread"}
            onChange={(e) => handleFilterChange("sortBy", e.target.value as SortBy)}
            className="filter-select"
          >
            <option value="spread">Spread</option>
            <option value="company">Company</option>
            <option value="change24h">24h Change</option>
            <option value="platform">Platform</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Order</label>
          <select
            value={filters.sortOrder || "desc"}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value as SortOrder)}
            className="filter-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <button
          className="toggle-advanced-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Hide" : "More"}
        </button>
      </div>

      {showAdvanced && (
        <div className="filter-row advanced">
          <div className="filter-group">
            <label>Min Spread %</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={filters.minSpread || ""}
              onChange={(e) =>
                handleFilterChange("minSpread", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="filter-input"
              placeholder="0"
            />
          </div>

          <div className="filter-group">
            <label>Max Spread %</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={filters.maxSpread || ""}
              onChange={(e) =>
                handleFilterChange("maxSpread", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="filter-input"
              placeholder="100"
            />
          </div>

          <button className="btn" onClick={handleReset} style={{ fontSize: 12 }}>
            Reset
          </button>
        </div>
      )}

      <div className="filter-presets">
        <div className="preset-input">
          <input
            type="text"
            placeholder="Preset name…"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="filter-input"
          />
          <button className="btn" onClick={handleSavePreset} style={{ fontSize: 11 }}>
            Save preset
          </button>
        </div>

        {presets.length > 0 && (
          <div className="presets-list">
            {presets.map((preset) => (
              <div key={preset.name} className="preset-btn">
                <button
                  onClick={() => handleLoadPreset(preset)}
                  className="preset-load"
                >
                  {preset.name}
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.name)}
                  className="preset-delete"
                  title="Delete"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="filter-stats">
        <span>
          {stats.count} asset{stats.count !== 1 ? "s" : ""} •{" "}
          <strong>Avg spread:</strong> {stats.avgSpread.toFixed(2)}% •{" "}
          <strong>Range:</strong> {stats.minSpread.toFixed(2)}%–{stats.maxSpread.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
