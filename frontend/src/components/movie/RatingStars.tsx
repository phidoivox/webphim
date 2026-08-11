"use client";

import { useState } from "react";
import { StarIcon } from "@/components/ui/icons";

interface RatingStarsProps {
  value: number; // rating hiện tại (0–5)
  interactive?: boolean; // cho phép click chấm điểm
  onChange?: (value: number) => void;
  className?: string;
}

export default function RatingStars({ value, interactive = false, onChange, className }: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? Math.round(value);

  return (
    <div className={`flex items-center gap-0.5 ${className ?? ""}`} aria-label={`Đánh giá ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(null)}
          onClick={() => interactive && onChange?.(i)}
          aria-label={`${i} sao`}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <StarIcon className={`h-4 w-4 transition-colors ${i <= active ? "fill-accent text-accent" : "text-faint"}`} />
        </button>
      ))}
    </div>
  );
}
