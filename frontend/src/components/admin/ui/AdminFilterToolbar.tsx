"use client";

import React, { useEffect, useState } from "react";
import {
  FilterIcon,
  RefreshCwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "@/components/ui/icons";

export interface FilterSelectOption {
  label: string;
  value: string;
}

export interface FilterSelectGroup {
  id: string;
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (val: string) => void;
}

export interface AdminFilterToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  debounceMs?: number;
  filterSelects?: FilterSelectGroup[];
  dateRangeOptions?: FilterSelectOption[];
  selectedDateRange?: string;
  onDateRangeChange?: (val: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  actionSlot?: React.ReactNode;
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  className?: string;
}

export default function AdminFilterToolbar({
  searchPlaceholder = "Tìm kiếm nhanh...",
  searchValue = "",
  onSearchChange,
  debounceMs = 350,
  filterSelects = [],
  dateRangeOptions,
  selectedDateRange,
  onDateRangeChange,
  onRefresh,
  refreshing = false,
  actionSlot,
  activeFiltersCount = 0,
  onClearFilters,
  className = "",
}: AdminFilterToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Sync external search value
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  // Debounce search update
  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (localSearch !== searchValue) {
        onSearchChange(localSearch);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localSearch, debounceMs, onSearchChange, searchValue]);

  const handleClearSearch = () => {
    setLocalSearch("");
    if (onSearchChange) onSearchChange("");
  };

  return (
    <div
      className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      {/* Left side: Search & Filter chips */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search input with icon & clear button */}
        {onSearchChange && (
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0f121a]/85 pl-10 pr-9 text-xs text-white placeholder-slate-500 shadow-sm backdrop-blur-md transition focus:border-accent/50 focus:bg-[#141724] focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                title="Xóa tìm kiếm"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Filter Dropdown Selects */}
        {filterSelects.map((filter) => (
          <div key={filter.id} className="relative">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              aria-label={filter.label}
              className="h-10 rounded-xl border border-white/10 bg-[#0f121a]/85 px-3.5 text-xs font-medium text-slate-300 shadow-sm backdrop-blur-md transition hover:border-white/20 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
            >
              {filter.options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-[#0f121a] text-slate-200 py-1"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Date Range Selector */}
        {dateRangeOptions && onDateRangeChange && (
          <div className="relative">
            <select
              value={selectedDateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              aria-label="Khoảng thời gian"
              className="h-10 rounded-xl border border-white/10 bg-[#0f121a]/85 px-3.5 text-xs font-medium text-slate-300 shadow-sm backdrop-blur-md transition hover:border-white/20 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
            >
              {dateRangeOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-[#0f121a] text-slate-200 py-1"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear Filters Button when active */}
        {activeFiltersCount > 0 && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
          >
            <XIcon className="h-3.5 w-3.5" />
            <span>Xóa lọc ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      {/* Right side: Refresh & Action Buttons */}
      <div className="flex items-center gap-2 self-end lg:self-auto">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0f121a]/85 text-slate-300 shadow-sm backdrop-blur-md transition hover:bg-white/5 hover:text-white disabled:opacity-50 cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCwIcon
              className={`h-4 w-4 ${refreshing ? "animate-spin text-accent" : ""}`}
            />
          </button>
        )}

        {actionSlot}
      </div>
    </div>
  );
}
