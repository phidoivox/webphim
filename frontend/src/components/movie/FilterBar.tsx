"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { CountryItem, FilterParams, GenreItem } from "@/types/movie";
import { GENRES } from "@/data/genres";
import { COUNTRIES } from "@/data/countries";

interface FilterBarProps {
  genres: GenreItem[];
  countries: CountryItem[];
  currentParams?: FilterParams;
  showTypeFilter?: boolean;
  showGenreFilter?: boolean;
  showCountryFilter?: boolean;
}

const TYPE_OPTIONS = [
  { value: "", label: "Tất cả định dạng" },
  { value: "series", label: "Phim bộ" },
  { value: "single", label: "Phim lẻ" },
  { value: "tv-show", label: "TV Show" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Mới cập nhật" },
  { value: "views", label: "Xem nhiều nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "year", label: "Năm sản xuất" },
];

const YEARS = Array.from({ length: 12 }, (_, i) => 2026 - i);

export default function FilterBar({
  genres = [],
  countries = [],
  currentParams = {},
  showTypeFilter = true,
  showGenreFilter = true,
  showCountryFilter = true,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const effectiveGenres =
    genres && genres.length > 0
      ? genres
      : GENRES.map((g, idx) => ({ id: idx + 1, name: g.label, slug: g.slug }));

  const effectiveCountries =
    countries && countries.length > 0
      ? countries
      : COUNTRIES.map((c, idx) => ({ id: idx + 1, name: c.label, slug: c.slug }));

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset về trang 1 khi đổi bộ lọc

    const qs = params.toString();
    const targetUrl = `${pathname}${qs ? `?${qs}` : ""}`;

    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const currentType = currentParams.type || searchParams?.get("type") || "";
  const currentGenre = currentParams.genre || searchParams?.get("genre") || "";
  const currentCountry = currentParams.country || searchParams?.get("country") || "";
  const currentYear = currentParams.year || searchParams?.get("year") || "";
  const currentSort = currentParams.sort || searchParams?.get("sort") || "latest";

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-neutral-900/60 p-4 backdrop-blur-md transition-opacity duration-200 sm:p-5 ${
        isPending ? "opacity-60" : "opacity-100"
      }`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {/* Bộ lọc định dạng */}
        {showTypeFilter && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
              Định dạng
            </label>
            <select
              value={currentType}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-800/90 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bộ lọc thể loại */}
        {showGenreFilter && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
              Thể loại
            </label>
            <select
              value={currentGenre}
              onChange={(e) => handleFilterChange("genre", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-800/90 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="" className="bg-neutral-900 text-white">
                Tất cả thể loại
              </option>
              {effectiveGenres.map((g) => (
                <option key={g.slug || g.id} value={g.slug} className="bg-neutral-900 text-white">
                  {g.name} {"moviesCount" in g && g.moviesCount ? `(${g.moviesCount})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bộ lọc quốc gia */}
        {showCountryFilter && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
              Quốc gia
            </label>
            <select
              value={currentCountry}
              onChange={(e) => handleFilterChange("country", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-800/90 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="" className="bg-neutral-900 text-white">
                Tất cả quốc gia
              </option>
              {effectiveCountries.map((c) => (
                <option key={c.slug || c.id} value={c.slug} className="bg-neutral-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bộ lọc năm */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
            Năm phát hành
          </label>
          <select
            value={currentYear}
            onChange={(e) => handleFilterChange("year", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-neutral-800/90 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="" className="bg-neutral-900 text-white">
              Tất cả các năm
            </option>
            {YEARS.map((yr) => (
              <option key={yr} value={String(yr)} className="bg-neutral-900 text-white">
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Sắp xếp */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
            Sắp xếp
          </label>
          <select
            value={currentSort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-neutral-800/90 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="bg-neutral-900 text-white">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
