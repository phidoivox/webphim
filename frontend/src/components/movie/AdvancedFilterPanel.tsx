"use client";

import { COUNTRIES } from "@/data/countries";
import { GENRES } from "@/data/genres";
import { SearchIcon } from "@/components/ui/icons";
import { useFilterQuery } from "@/hooks/useFilterQuery";
import { cn } from "@/lib/utils";

interface AdvancedFilterPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  keyword?: string;
  initialType?: string;
  initialGenre?: string;
  initialCountry?: string;
}

const TYPE_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Phim lẻ", value: "single" },
  { label: "Phim bộ", value: "series" },
  { label: "TV Shows", value: "tv-show" },
];

const LANG_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Phụ đề", value: "vietsub" },
  { label: "Thuyết minh", value: "thuyet-minh" },
  { label: "Lồng tiếng", value: "long-tieng" },
];

const YEAR_OPTIONS = ["", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];

const SORT_OPTIONS = [
  { label: "Mới nhất", value: "latest" },
  { label: "Mới cập nhật", value: "updated" },
  { label: "Xem nhiều nhất", value: "views" },
  { label: "Đánh giá cao", value: "rating" },
];

export default function AdvancedFilterPanel({
  isOpen = true,
  onClose,
  keyword = "",
  initialType,
  initialGenre,
  initialCountry,
}: AdvancedFilterPanelProps) {
  const { searchParams, isPending, updateParam } = useFilterQuery();

  if (!isOpen) return null;

  // ✨ DERIVED STATE: Trạng thái đọc trực tiếp 100% từ URL (Single Source of Truth)
  const activeCountry = searchParams?.get("country") || initialCountry || "";
  const rawType = searchParams?.get("type") || initialType || "";
  const activeType = rawType === "tv-shows" ? "tv-show" : rawType;
  const activeGenre = searchParams?.get("genre") || initialGenre || "";
  const activeLang = searchParams?.get("lang") || "";
  const activeYear = searchParams?.get("year") || "";
  const activeSort = searchParams?.get("sort") || "latest";

  const handleUpdateFilter = (key: string, value: string) => {
    if (keyword && !searchParams?.get("q")) {
      updateParam("q", keyword);
    }
    updateParam(key, value);
  };

  const isCustomYearActive =
    activeYear !== "" && !YEAR_OPTIONS.includes(activeYear);

  return (
    <div
      className={cn(
        "relative mb-6 sm:mb-8 rounded-2xl border border-white/10 bg-[#0e0f14]/95 p-3.5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      <div className="space-y-3 sm:space-y-3.5">
        {/* Hàng 1: Quốc gia */}
        <div className="flex flex-col border-b border-white/10 border-dashed pb-3 sm:pb-3.5 sm:flex-row sm:items-start">
          <span className="mb-1.5 w-28 shrink-0 text-xs font-bold text-white/80 sm:mb-0 sm:pt-1 sm:text-sm">
            Quốc gia:
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => handleUpdateFilter("country", "")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition active:scale-95 sm:px-3 sm:text-sm cursor-pointer",
                activeCountry === ""
                  ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              )}
            >
              Tất cả
            </button>
            {COUNTRIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => handleUpdateFilter("country", c.slug)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition active:scale-95 sm:px-3 sm:text-sm cursor-pointer",
                  activeCountry === c.slug
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng 2: Loại phim */}
        <div className="flex flex-col border-b border-white/10 border-dashed pb-3 sm:pb-3.5 sm:flex-row sm:items-start">
          <span className="mb-1.5 w-28 shrink-0 text-xs font-bold text-white/80 sm:mb-0 sm:pt-1 sm:text-sm">
            Loại phim:
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1 sm:gap-1.5">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleUpdateFilter("type", t.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition active:scale-95 sm:px-3 sm:text-sm cursor-pointer",
                  activeType === t.value
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng 3: Thể loại */}
        <div className="flex flex-col border-b border-white/10 border-dashed pb-3.5 sm:flex-row sm:items-start">
          <span className="mb-2 w-28 shrink-0 text-xs font-semibold text-white/80 sm:mb-0 sm:pt-1 sm:text-sm">
            Thể loại:
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => handleUpdateFilter("genre", "")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm",
                activeGenre === ""
                  ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              )}
            >
              Tất cả
            </button>
            {GENRES.map((g) => (
              <button
                key={g.slug}
                type="button"
                onClick={() => handleUpdateFilter("genre", g.slug)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm",
                  activeGenre === g.slug
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng 4: Ngôn ngữ */}
        <div className="flex flex-col border-b border-white/10 border-dashed pb-3.5 sm:flex-row sm:items-start">
          <span className="mb-2 w-28 shrink-0 text-xs font-semibold text-white/80 sm:mb-0 sm:pt-1 sm:text-sm">
            Ngôn ngữ:
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1 sm:gap-1.5">
            {LANG_OPTIONS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => handleUpdateFilter("lang", l.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm",
                  activeLang === l.value
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng 5: Năm sản xuất */}
        <div className="flex flex-col border-b border-white/10 border-dashed pb-3.5 sm:flex-row sm:items-start">
          <span className="mb-2 w-28 shrink-0 text-xs font-semibold text-white/80 sm:mb-0 sm:pt-1 sm:text-sm">
            Năm sản xuất:
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1 sm:gap-1.5">
            {YEAR_OPTIONS.map((yr) => (
              <button
                key={yr || "all"}
                type="button"
                onClick={() => handleUpdateFilter("year", yr)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm",
                  activeYear === yr
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {yr ? yr : "Tất cả"}
              </button>
            ))}
            {/* Input nhập năm tùy chọn */}
            <div className="relative flex items-center">
              <SearchIcon className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-white/40" />
              <input
                type="number"
                min="1970"
                max="2030"
                value={isCustomYearActive ? activeYear : ""}
                onChange={(e) => handleUpdateFilter("year", e.target.value)}
                placeholder="Nhập năm"
                className={cn(
                  "h-7 w-24 rounded-full border pl-7 pr-2 text-xs transition placeholder:text-white/30 focus:outline-none sm:h-8 sm:w-28 sm:text-xs",
                  isCustomYearActive
                    ? "border-amber-400 bg-amber-400/10 text-amber-300"
                    : "border-white/10 bg-neutral-800/80 text-white focus:border-amber-400"
                )}
              />
            </div>
          </div>
        </div>

        {/* Hàng 6: Sắp xếp */}
        <div className="flex flex-col pb-2 sm:flex-row sm:items-start">
          <span className="mb-2 w-28 shrink-0 text-xs font-semibold text-white/80 sm:mb-0 sm:pt-1 sm:text-sm">
            Sắp xếp:
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1 sm:gap-1.5">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => handleUpdateFilter("sort", s.value === "latest" ? "" : s.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm",
                  activeSort === s.value
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nút đóng */}
        {onClose && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-neutral-800 px-6 py-2 text-xs font-semibold text-white/80 transition hover:bg-neutral-700 hover:text-white sm:text-sm"
            >
              Đóng bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
