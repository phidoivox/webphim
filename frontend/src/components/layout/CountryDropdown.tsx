"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "@/components/ui/icons";
import { COUNTRIES } from "@/data/countries";
import { useHoverDropdown } from "@/hooks/useHoverDropdown";
import { cn } from "@/lib/utils";

interface CountryDropdownProps {
  items?: Array<{ id: number | string; name: string; slug: string }>;
}

export default function CountryDropdown({ items }: CountryDropdownProps) {
  const { open, setOpen, containerRef, handleMouseEnter, handleMouseLeave } = useHoverDropdown();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCountry = searchParams?.get("country");

  const countryList = items && items.length > 0
    ? items.map((i) => ({ slug: i.slug, label: i.name }))
    : COUNTRIES;

  const isCountryActive = 
    (pathname === "/tim-kiem" && Boolean(currentCountry)) ||
    pathname.startsWith("/quoc-gia");

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex shrink-0 whitespace-nowrap items-center gap-1 rounded-lg px-2.5 py-1.5 xl:px-3 xl:py-2 text-sm font-semibold transition-all",
          open || isCountryActive
            ? "bg-white/15 text-accent font-bold"
            : "text-white/90 hover:bg-white/10 hover:text-white"
        )}
      >
        <span>Quốc gia</span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open ? "rotate-180 text-white" : "text-white/70"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-[420px] sm:w-[480px] rounded-xl border border-white/10 bg-[#0d0d12]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
              {countryList.map((c) => {
                const isActive = currentCountry === c.slug || pathname === `/quoc-gia/${c.slug}`;
                return (
                  <Link
                    key={c.slug}
                    href={`/tim-kiem?country=${c.slug}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "text-accent font-bold bg-white/10"
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
