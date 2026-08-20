"use client";

import React from "react";
import { TrendingDownIcon, TrendingUpIcon } from "@/components/ui/icons";

export interface AdminKpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  delta?: string | number;
  deltaType?: "increase" | "decrease" | "neutral";
  periodLabel?: string;
  subValue?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function AdminKpiCard({
  title,
  value,
  icon: Icon,
  delta,
  deltaType,
  periodLabel = "vs tháng trước",
  subValue,
  loading = false,
  onClick,
  className = "",
}: AdminKpiCardProps) {
  // Auto detect delta type if not explicitly passed
  const resolvedDeltaType =
    deltaType ??
    (typeof delta === "string" && delta.startsWith("-")
      ? "decrease"
      : typeof delta === "string" && delta.startsWith("+")
      ? "increase"
      : "neutral");

  if (loading) {
    return (
      <div
        className={`rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-5 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-7 w-7 rounded-lg bg-white/10" />
        </div>
        <div className="mt-3 h-7 w-24 rounded bg-white/10" />
        <div className="mt-2 h-3 w-28 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-5 transition-colors duration-150 ${
        onClick
          ? "cursor-pointer hover:border-white/20 hover:bg-[#121620] active:scale-[0.99]"
          : "hover:border-white/[0.14]"
      } ${className}`}
    >
      {/* Top row: Label & Neutral Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400 truncate">
          {title}
        </span>
        {Icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Value row */}
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-white tabular-nums">
          {value}
        </span>
      </div>

      {/* Bottom meta row: Delta or subValue */}
      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
        {delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${
              resolvedDeltaType === "increase"
                ? "text-emerald-400"
                : resolvedDeltaType === "decrease"
                ? "text-rose-400"
                : "text-slate-400"
            }`}
          >
            {resolvedDeltaType === "increase" ? (
              <TrendingUpIcon className="h-3 w-3 shrink-0" />
            ) : resolvedDeltaType === "decrease" ? (
              <TrendingDownIcon className="h-3 w-3 shrink-0" />
            ) : null}
            {delta}
          </span>
        )}

        {periodLabel && delta !== undefined && (
          <span className="text-slate-500 text-[11px] font-normal">{periodLabel}</span>
        )}

        {subValue && (
          <span className="text-slate-500 text-[11px] font-normal">{subValue}</span>
        )}
      </div>
    </div>
  );
}
