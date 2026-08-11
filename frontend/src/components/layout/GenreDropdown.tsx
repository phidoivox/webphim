"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@/components/ui/icons";
import { GENRES } from "@/data/genres";

export default function GenreDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          open ? "bg-elevated text-ink" : "text-muted hover:bg-elevated hover:text-ink"
        }`}
      >
        Thể loại
        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-52 rounded-lg border border-elevated bg-elevated p-2 shadow-xl">
          {GENRES.map((g) => (
            <Link
              key={g.slug}
              href={`/the-loai/${g.slug}`}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              {g.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
