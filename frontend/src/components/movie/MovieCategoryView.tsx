"use client";

import { useState } from "react";
import type { CountryItem, FilterParams, GenreItem, MovieSummary, PaginationMeta } from "@/types/movie";
import AdvancedFilterPanel from "@/components/movie/AdvancedFilterPanel";
import MovieCard from "@/components/movie/MovieCard";
import Pagination from "@/components/ui/Pagination";

interface MovieCategoryViewProps {
  title: string;
  subtitle?: string;
  keyword?: string;
  genres?: GenreItem[];
  countries?: CountryItem[];
  movies: MovieSummary[];
  pagination?: PaginationMeta;
  currentParams?: FilterParams;
  showTypeFilter?: boolean;
  showGenreFilter?: boolean;
  showCountryFilter?: boolean;
  defaultFilterOpen?: boolean;
}

export default function MovieCategoryView({
  title,
  subtitle,
  keyword,
  genres,
  countries,
  movies,
  pagination,
  currentParams = {},
  showTypeFilter,
  showGenreFilter,
  showCountryFilter,
  defaultFilterOpen = false,
}: MovieCategoryViewProps) {
  const hasActiveFilters = Boolean(
    currentParams.type ||
    currentParams.genre ||
    currentParams.country ||
    currentParams.year ||
    currentParams.lang ||
    (currentParams.sort && currentParams.sort !== "latest")
  );

  const [isFilterOpen, setIsFilterOpen] = useState(defaultFilterOpen || hasActiveFilters);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-18 pb-12 sm:px-6 lg:px-8">
      {/* Tiêu đề & Nút bật tắt Bộ lọc */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl tracking-tight">
              {keyword ? (
                <>
                  Kết quả tìm kiếm:{" "}
                  <span className="text-accent">&ldquo;{keyword}&rdquo;</span>
                </>
              ) : (
                title
              )}
            </h1>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              {subtitle ||
                (keyword
                  ? `Tìm thấy ${pagination?.total ?? movies.length} kết quả phù hợp với từ khóa của bạn.`
                  : "Chọn các tiêu chí bên dưới hoặc nhập từ khóa để tìm phim.")}
            </p>
          </div>

          {/* Nút Bộ lọc */}
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              isFilterOpen || hasActiveFilters
                ? "border-amber-400/80 bg-amber-400/15 text-amber-300"
                : "border-white/15 bg-white/5 text-amber-400 hover:bg-white/10 hover:text-amber-300"
            }`}
          >
            <span className="text-[12px] text-amber-400">Δ</span>
            <span className="font-bold">Bộ lọc</span>
            {hasActiveFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Bảng Bộ lọc Nâng Cao */}
      <AdvancedFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        keyword={keyword}
        initialType={currentParams.type}
        initialGenre={currentParams.genre}
        initialCountry={currentParams.country}
      />

      {/* Lưới Phim 8 cột */}
      {movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 sm:gap-3.5 lg:gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {/* Phân trang */}
          {pagination && pagination.lastPage > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={pagination.currentPage}
                lastPage={pagination.lastPage}
              />
            </div>
          )}
        </>
      ) : keyword ? (
        <div className="rounded-2xl border border-white/10 bg-surface/60 py-16 text-center text-white/60">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl text-white/40">
            🔍
          </div>
          <p className="text-base font-semibold text-white sm:text-lg">
            Không tìm thấy bộ phim nào khớp với &ldquo;{keyword}&rdquo;
          </p>
          <p className="mt-1 text-xs text-white/40 sm:text-sm">
            Hãy thử tìm bằng từ khóa khác hoặc điều chỉnh lại các bộ lọc phía trên.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-surface/60 py-16 text-center text-white/60">
          <p className="text-base font-medium">Không tìm thấy bộ phim nào phù hợp với bộ lọc.</p>
          <p className="mt-1 text-xs text-white/40">Vui lòng thử thay đổi các tiêu chí lọc khác.</p>
        </div>
      )}
    </div>
  );
}
