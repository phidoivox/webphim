"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage,
  lastPage,
  onPageChange,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (lastPage <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  };

  // Tạo dải số trang logic với ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Số trang hiển thị quanh currentPage

    for (let i = 1; i <= lastPage; i++) {
      if (
        i === 1 ||
        i === lastPage ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  const handlePageClick = (e: React.MouseEvent, page: number) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(page);
    }
  };

  return (
    <nav
      className="flex items-center justify-center gap-1.5 py-8"
      aria-label="Phân trang danh sách phim"
    >
      {/* Nút Trước */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          onClick={(e) => handlePageClick(e, currentPage - 1)}
          className="flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm font-medium text-white/80 transition hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-400"
          aria-label="Trang trước"
        >
          &larr; Trước
        </Link>
      ) : (
        <span className="flex h-10 cursor-not-allowed items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] px-3.5 text-sm font-medium text-white/30">
          &larr; Trước
        </span>
      )}

      {/* Dải số trang */}
      <div className="flex items-center gap-1">
        {pages.map((p, index) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-10 w-8 items-center justify-center text-sm font-semibold text-white/40"
              >
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              href={createPageUrl(pageNum)}
              onClick={(e) => handlePageClick(e, pageNum)}
              className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "border border-white/10 bg-white/5 text-white/80 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-400"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Nút Tiếp */}
      {currentPage < lastPage ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          onClick={(e) => handlePageClick(e, currentPage + 1)}
          className="flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm font-medium text-white/80 transition hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-400"
          aria-label="Trang tiếp"
        >
          Tiếp &rarr;
        </Link>
      ) : (
        <span className="flex h-10 cursor-not-allowed items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] px-3.5 text-sm font-medium text-white/30">
          Tiếp &rarr;
        </span>
      )}
    </nav>
  );
}
