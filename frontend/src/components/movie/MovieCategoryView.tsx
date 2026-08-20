"use client";

import { useState } from "react";
import type { CountryItem, FilterParams, GenreItem, MovieSummary, PaginationMeta } from "@/types/movie";
import AdvancedFilterPanel from "@/components/movie/AdvancedFilterPanel";
import MovieCard from "@/components/movie/MovieCard";
import Pagination from "@/components/ui/Pagination";

interface MovieCategoryViewProps {
  title: string;
  genres?: GenreItem[];
  countries?: CountryItem[];
  movies: MovieSummary[];
  pagination: PaginationMeta;
  currentParams?: FilterParams;
  showTypeFilter?: boolean;
  showGenreFilter?: boolean;
  showCountryFilter?: boolean;
}

export default function MovieCategoryView({
  title,
  movies,
  pagination,
  currentParams = {},
}: MovieCategoryViewProps) {
  const [showFilter, setShowFilter] = useState(false);

  // Check if any filter is active other than default
  const hasActiveFilters = Boolean(
    currentParams.genre ||
    currentParams.country ||
    currentParams.year ||
    currentParams.lang ||
    (currentParams.sort && currentParams.sort !== "latest")
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-18 pb-12 sm:px-6 lg:px-8">
      {/* Tiêu đề & Nút Bộ lọc đơn giản như ảnh mẫu */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => setShowFilter((v) => !v)}
          className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            showFilter || hasActiveFilters
              ? "bg-white/15 text-amber-300 border border-amber-400/30"
              : "text-amber-400/90 hover:bg-white/10 hover:text-amber-300"
          }`}
        >
          <span className="text-[11px] text-amber-400">Δ</span>
          <span className="text-amber-400 font-bold">Bộ lọc</span>
          {hasActiveFilters && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* Khung Bộ lọc Nâng Cao (Đồng bộ chuẩn 100% với ảnh mẫu) */}
      {(showFilter || hasActiveFilters) && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <AdvancedFilterPanel
            isOpen={true}
            onClose={() => setShowFilter(false)}
            initialType={currentParams.type}
            initialGenre={currentParams.genre}
            initialCountry={currentParams.country}
          />
        </div>
      )}

      {/* Lưới Phim 8 cột rộng rãi chuẩn ảnh mẫu */}
      {movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 sm:gap-3.5 lg:gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {/* Phân trang */}
          {pagination.lastPage > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={pagination.currentPage}
                lastPage={pagination.lastPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-surface/60 py-16 text-center text-white/60">
          <p className="text-base font-medium">Không tìm thấy bộ phim nào phù hợp với bộ lọc.</p>
          <p className="mt-1 text-xs text-white/40">Vui lòng thử thay đổi các tiêu chí lọc khác.</p>
        </div>
      )}
    </div>
  );
}
