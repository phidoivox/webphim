import React from "react";

interface RatingBadgeProps {
  provider?: "TMDb" | "IMDb";
  rating?: number | string | null;
  className?: string;
}

export function RatingBadge({
  provider = "TMDb",
  rating = "8.0",
  className = "",
}: RatingBadgeProps) {
  if (rating === null || rating === undefined) return null;

  const scoreFormatted = typeof rating === "number" ? rating.toFixed(1) : rating;
  const isImdb = provider.toUpperCase() === "IMDB";

  return (
    <div
      className={`inline-flex items-stretch rounded-md overflow-hidden text-[10px] sm:text-[11px] font-bold shadow-xs ${className}`}
    >
      <span
        className={`px-1.5 py-0.5 font-black tracking-tight flex items-center ${
          isImdb ? "bg-amber-400 text-black" : "bg-sky-500 text-white"
        }`}
      >
        {provider}
      </span>
      <span
        className={`px-1.5 py-0.5 bg-stone-900/90 text-white font-black flex items-center border-y border-r ${
          isImdb ? "border-amber-400/40" : "border-sky-500/40"
        }`}
      >
        {scoreFormatted}
      </span>
    </div>
  );
}
