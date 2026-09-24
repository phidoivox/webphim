"use client";

import { useState } from "react";
import MovieCard from "@/components/movie/MovieCard";
import AdvancedFilterPanel from "@/components/movie/AdvancedFilterPanel";
import Pagination from "@/components/ui/Pagination";
import type { MovieSummary, PaginationMeta } from "@/types/movie";

interface SearchClientViewProps {
  keyword: string;
  movies: MovieSummary[];
  meta?: PaginationMeta;
  initialParams?: {
    type?: string;
    genre?: string;
    country?: string;
    lang?: string;
    year?: string;
    sort?: string;
  };
}

export default function SearchClientView({
  keyword,
  movies,
  meta,
  initialParams = {},
}: SearchClientViewProps) {
  // Bộ lọc mở sẵn để người dùng dễ chọn như ảnh 2, hoặc có thể đóng/mở
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-18 pb-12 sm:px-6 lg:px-8">
      {/* Tiêu đề & Nút bật tắt Bộ lọc */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
              {keyword ? (
                <>
                  Kết quả tìm kiếm:{" "}
                  <span className="text-accent">&ldquo;{keyword}&rdquo;</span>
                </>
              ) : (
                "Tìm kiếm phim"
              )}
            </h1>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              {keyword
                ? `Tìm thấy ${meta?.total ?? movies.length} kết quả phù hợp với từ khóa của bạn.`
                : "Chọn các tiêu chí bên dưới hoặc nhập từ khóa để tìm phim."}
            </p>
          </div>

          {/* Nút Bộ lọc */}
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
              isFilterOpen
                ? "border-amber-400/80 bg-amber-400/15 text-amber-300"
                : "border-white/15 bg-white/5 text-amber-400 hover:bg-white/10 hover:text-amber-300"
            }`}
          >
            <span className="text-[12px] text-amber-400">Δ</span>
            <span className="font-bold">Bộ lọc</span>
          </button>
        </div>
      </div>

      {/* Bảng Bộ lọc Nâng Cao */}
      <AdvancedFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        keyword={keyword}
        initialType={initialParams.type}
        initialGenre={initialParams.genre}
        initialCountry={initialParams.country}
      />

      {/* Danh sách phim Grid 8 cột */}
      {movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 sm:gap-3.5 lg:gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {/* Phân trang */}
          {meta && meta.lastPage > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={meta.currentPage}
                lastPage={meta.lastPage}
              />
            </div>
          )}
        </>
      ) : keyword ? (
        <div className="rounded-2xl border border-white/10 bg-[#121319]/80 py-16 text-center text-white/60">
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
        <div className="rounded-2xl border border-white/10 bg-[#121319]/80 py-16 text-center text-white/60">
          <p className="text-base font-semibold text-white sm:text-lg">
            Vui lòng nhập từ khóa hoặc sử dụng bộ lọc bên trên để tìm kiếm phim.
          </p>
        </div>
      )}
    </div>
  );
}
