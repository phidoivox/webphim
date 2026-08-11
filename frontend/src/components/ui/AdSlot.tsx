"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  /** Được gọi khi pre-roll kết thúc (đếm về 0) — parent bật autoPlay cho player. */
  onEnded?: () => void;
}

const SKIP_AFTER_SECONDS = 5;
const AUTO_END_SECONDS = 10;

export default function AdSlot({ onEnded }: AdSlotProps) {
  const [remaining, setRemaining] = useState(AUTO_END_SECONDS);
  const [dismissed, setDismissed] = useState(false);
  const firedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Báo parent một lần khi đếm về 0 — gọi callback ngoài effect, không setState đồng bộ
  useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      onEndedRef.current?.();
    }
  }, [remaining]);

  if (dismissed || remaining <= 0) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-base/95">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent text-lg font-bold text-accent">
        {remaining}
      </div>
      <p className="text-xs uppercase tracking-widest text-muted">Quảng cáo</p>
      <button
        type="button"
        disabled={remaining > SKIP_AFTER_SECONDS}
        onClick={() => setDismissed(true)}
        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
          remaining > SKIP_AFTER_SECONDS
            ? "cursor-not-allowed bg-elevated text-faint"
            : "bg-accent text-(--color-base) hover:bg-accent-hover"
        }`}
      >
        Bỏ qua ({remaining}s)
      </button>
    </div>
  );
}
