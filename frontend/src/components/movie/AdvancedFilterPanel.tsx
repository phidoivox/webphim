"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COUNTRIES } from "@/data/countries";
import { GENRES } from "@/data/genres";
import { SearchIcon } from "@/components/ui/icons";

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
  { label: "TV Shows", value: "tv-shows" },
  { label: "Hoạt hình", value: "hoat-hinh" },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selectedCountry, setSelectedCountry] = useState(
    () => searchParams?.get("country") || initialCountry || ""
  );
  const [selectedType, setSelectedType] = useState(
    () => searchParams?.get("type") || initialType || ""
  );
  const [selectedGenre, setSelectedGenre] = useState(
    () => searchParams?.get("genre") || initialGenre || ""
  );
  const [selectedLang, setSelectedLang] = useState(() => searchParams?.get("lang") || "");
  const [selectedYear, setSelectedYear] = useState(() => searchParams?.get("year") || "");
  const [customYear, setCustomYear] = useState("");
  const [selectedSort, setSelectedSort] = useState(() => searchParams?.get("sort") || "latest");

  if (!isOpen) return null;

  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    const currentQ = keyword || searchParams?.get("q") || "";
    if (currentQ) params.set("q", currentQ);

    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedType) params.set("type", selectedType);
    if (selectedGenre) params.set("genre", selectedGenre);
    if (selectedLang) params.set("lang", selectedLang);

    const activeYear = customYear.trim() || selectedYear;
    if (activeYear) params.set("year", activeYear);

    if (selectedSort && selectedSort !== "latest") params.set("sort", selectedSort);

    // Target route
    const targetUrl = `/tim-kiem?${params.toString()}`;

    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const isCustomYearActive =
    customYear.trim() !== "" ||
    (selectedYear !== "" && !YEAR_OPTIONS.includes(selectedYear));

  return (
    <div
      className={`relative mb-8 rounded-2xl border border-white/10 bg-[#0e0f14]/95 p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        isPending ? "opacity-60" : "opacity-100"
      }`}
    >
      <div className="space-y-3.5">
        {/* Hàng 1: Quốc gia */}
        <div className="flex flex-col border-b border-white/10 border-dashed pb-3.5 sm:flex-row sm:items-start">
          <span className="mb-2 w-28 shrink-0 text-xs font-semibold text-white/80 sm:mb-0 sm:pt-1 sm:text-sm">
            Quốc gia:
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCountry("")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                selectedCountry === ""
                  ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              Tất cả
            </button>
            {COUNTRIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setSelectedCountry(c.slug)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  selectedCountry === c.slug
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng 2: Loại phim */}
        <div className="flex flex-col border-b border-white/10 border-dashed pb-3.5 sm:flex-row sm:items-start">
          <span className="mb-2 w-28 shrink-0 text-xs font-semibold text-white/80 sm:mb-0 sm:pt-1 sm:text-sm">
            Loại phim:
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-1 sm:gap-1.5">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  selectedType === t.value
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
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
              onClick={() => setSelectedGenre("")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                selectedGenre === ""
                  ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              Tất cả
            </button>
            {GENRES.map((g) => (
              <button
                key={g.slug}
                type="button"
                onClick={() => setSelectedGenre(g.slug)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  selectedGenre === g.slug
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
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
                onClick={() => setSelectedLang(l.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  selectedLang === l.value
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
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
                onClick={() => {
                  setSelectedYear(yr);
                  setCustomYear("");
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  selectedYear === yr && !customYear
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
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
                value={customYear}
                onChange={(e) => {
                  setCustomYear(e.target.value);
                  setSelectedYear("");
                }}
                placeholder="Nhập năm"
                className={`h-7 w-24 rounded-full border pl-7 pr-2 text-xs transition placeholder:text-white/30 focus:outline-none sm:h-8 sm:w-28 sm:text-xs ${
                  isCustomYearActive
                    ? "border-amber-400 bg-amber-400/10 text-amber-300"
                    : "border-white/10 bg-neutral-800/80 text-white focus:border-amber-400"
                }`}
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
                onClick={() => setSelectedSort(s.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  selectedSort === s.value
                    ? "border border-amber-400/80 bg-amber-400/15 font-semibold text-amber-300 shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleApplyFilter}
            className="flex items-center gap-1.5 rounded-full bg-amber-400 px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 sm:text-sm"
          >
            Lọc kết quả &rarr;
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-neutral-800 px-6 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-neutral-700 hover:text-white sm:text-sm"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
