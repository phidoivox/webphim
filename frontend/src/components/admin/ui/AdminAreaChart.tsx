"use client";

import React, { useId, useState } from "react";
import { ActivityIcon } from "@/components/ui/icons";

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  date?: string;
}

export interface AdminAreaChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryColor?: string;
  height?: number;
  timeRanges?: Array<{ label: string; value: string }>;
  selectedTimeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  unit?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Generate smooth cubic bezier SVG path from coordinate points
 */
function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toLocaleString();
}

export default function AdminAreaChart({
  data,
  title = "Biểu Đồ Lượt Xem",
  subtitle = "Lưu lượng truy cập và lượt xem phim",
  primaryLabel = "Lượt xem",
  primaryColor = "#ff5c1a",
  height = 260,
  timeRanges = [
    { label: "7 ngày", value: "7d" },
    { label: "14 ngày", value: "14d" },
    { label: "30 ngày", value: "30d" },
  ],
  selectedTimeRange = "7d",
  onTimeRangeChange,
  unit = "lượt",
  loading = false,
  className = "",
}: AdminAreaChartProps) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Fallback / safe data
  const safeData = data.length > 0 ? data : [{ label: "Hôm nay", value: 0 }];

  // Compute boundaries
  const values = safeData.map((d) => d.value);
  const rawMax = Math.max(...values, 10);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const maxY = Math.ceil((rawMax * 1.15) / magnitude) * magnitude;
  const minY = 0;

  // Layout measurements for SVG coordinate space
  const svgWidth = 800;
  const svgHeight = height;
  const padLeft = 45;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 30;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Map data to SVG points
  const points = safeData.map((d, index) => {
    const x =
      padLeft +
      (safeData.length === 1
        ? chartWidth / 2
        : (index / (safeData.length - 1)) * chartWidth);
    const y = padTop + chartHeight - ((d.value - minY) / (maxY - minY)) * chartHeight;
    return { x, y, data: d, index };
  });

  // Smooth line path
  const linePath = getSmoothPath(points);

  // Closed area path for gradient fill
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath =
    points.length > 1
      ? `${linePath} L ${lastPoint.x.toFixed(1)},${(padTop + chartHeight).toFixed(
          1
        )} L ${firstPoint.x.toFixed(1)},${(padTop + chartHeight).toFixed(1)} Z`
      : "";

  // Y-axis grid ticks (4 grid lines)
  const yTicks = [0, 0.33, 0.66, 1].map((ratio) => ({
    val: Math.round(minY + ratio * (maxY - minY)),
    y: padTop + chartHeight - ratio * chartHeight,
  }));

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-5 ${className}`}
    >
      {/* Header with Title & Time Range Filter Buttons */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pb-3.5 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Time range pills */}
        {timeRanges && timeRanges.length > 0 && onTimeRangeChange && (
          <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.06]">
            {timeRanges.map((tr) => (
              <button
                key={tr.value}
                type="button"
                onClick={() => onTimeRangeChange(tr.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  selectedTimeRange === tr.value
                    ? "bg-white/10 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="relative mt-3 w-full" style={{ minHeight: height }}>
        {loading ? (
          <div
            className="flex w-full items-center justify-center animate-pulse"
            style={{ height }}
          >
            <div className="h-28 w-3/4 rounded-lg bg-white/5 border border-white/5" />
          </div>
        ) : (
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
              style={{ maxHeight: height }}
              onMouseLeave={() => setHoverIndex(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

                // Find closest point by x coordinate
                let closestIndex = 0;
                let minDiff = Infinity;
                points.forEach((p, idx) => {
                  const diff = Math.abs(p.x - mouseX);
                  if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = idx;
                  }
                });
                setHoverIndex(closestIndex);
              }}
            >
              <defs>
                {/* Clean Subtle Area Gradient Fill */}
                <linearGradient id={`grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity="0.12" />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines & Y Axis Ticks */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={tick.y}
                    x2={svgWidth - padRight}
                    y2={tick.y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeDasharray={i === 0 ? "none" : "3 3"}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={tick.y + 3.5}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] tabular-nums font-mono"
                  >
                    {formatNumber(tick.val)}
                  </text>
                </g>
              ))}

              {/* X Axis Labels */}
              {points.map((p, i) => {
                const step = Math.ceil(points.length / 7);
                const shouldShow = i % step === 0 || i === points.length - 1;
                if (!shouldShow) return null;

                return (
                  <text
                    key={i}
                    x={p.x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {p.data.label}
                  </text>
                );
              })}

              {/* Gradient Area Fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill={`url(#grad-${gradientId})`}
                  className="transition-all duration-300"
                />
              )}

              {/* Main Curve Stroke */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Hover Cursor Guides & Dot */}
              {activePoint && (
                <g className="transition-all duration-100">
                  {/* Vertical Crosshair Guide */}
                  <line
                    x1={activePoint.x}
                    y1={padTop}
                    x2={activePoint.x}
                    y2={padTop + chartHeight}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />

                  {/* Marker Dot */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="4"
                    fill="#ffffff"
                    stroke={primaryColor}
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Clean Floating Tooltip */}
            {activePoint && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-white/15 bg-[#141824]/95 px-3 py-2 shadow-xl backdrop-blur-md transition-all duration-150"
                style={{
                  left: `${(activePoint.x / svgWidth) * 100}%`,
                  top: `${(activePoint.y / svgHeight) * 100}%`,
                  marginTop: "-10px",
                }}
              >
                <div className="text-[10px] font-medium text-slate-400 font-mono">
                  {activePoint.data.date || activePoint.data.label}
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-300">{primaryLabel}:</span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {activePoint.data.value.toLocaleString()} {unit}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
