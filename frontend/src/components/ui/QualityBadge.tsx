import React from "react";

interface QualityBadgeProps {
  quality?: string | null;
  className?: string;
}

export function QualityBadge({ quality, className = "" }: QualityBadgeProps) {
  if (!quality) return null;

  return (
    <span
      className={`inline-flex items-center justify-center font-black text-[10px] sm:text-[11px] text-amber-950 px-1.5 py-0.5 rounded-md bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 border border-amber-400/50 shadow-xs uppercase tracking-wider ${className}`}
    >
      {quality}
    </span>
  );
}
