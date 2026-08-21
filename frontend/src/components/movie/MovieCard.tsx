"use client";

import { useState, useRef, useOptimistic, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MovieSummary } from "@/types/movie";
import { HeartIcon, InfoIcon, PlayIcon } from "@/components/ui/icons";
import { useBookmark } from "@/hooks/useBookmark";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: MovieSummary;
  className?: string;
}

export default function MovieCard({ movie, className = "w-full" }: MovieCardProps) {
  const isSeries = movie.type === "series" || movie.type === "tv-show";
  const [isHovered, setIsHovered] = useState(false);
  const [popoverSide, setPopoverSide] = useState<"left" | "right">("right");
  const { isFavorite: baseFavorite, toggleBookmark } = useBookmark(movie.id);

  // React 19 Optimistic state for 0ms favorite feedback
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(
    Boolean(baseFavorite),
    (current) => !current
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      setOptimisticFavorite(null);
      await toggleBookmark(
        {
          id: movie.id,
          name: movie.name,
          originName: movie.originName,
          slug: movie.slug,
          posterUrl: movie.posterUrl,
          thumbUrl: movie.thumbUrl,
          year: movie.year,
          quality: typeof movie.quality === "string" ? movie.quality : undefined,
          ratingAvg: movie.ratingAvg,
          genres: movie.genres,
        },
        "favorite"
      );
    });
  };

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 320;

        // Nếu không đủ chỗ bên phải màn hình (sát mép phải) -> Mở sang BÊN TRÁI
        // Ngược lại -> Mở sang BÊN PHẢI cạnh thẻ
        if (rect.right + popoverWidth > window.innerWidth - 20) {
          setPopoverSide("left");
        } else {
          setPopoverSide("right");
        }
        setIsHovered(true);
      }
    }, 220);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 180);
  };

  const formattedGenres =
    Array.isArray(movie.genres) && movie.genres.length > 0
      ? movie.genres.slice(0, 4).join(" • ")
      : isSeries
      ? "Phim Bộ • Truyền Hình"
      : "Phim Lẻ • Chiếu Rạp";

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("@container relative w-full", className)}
    >

      <Link href={`/phim/${movie.slug}`} className="group block w-full">
        {/* Poster Box */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface shadow-md border border-white/5">
          <Image
            src={movie.posterUrl || movie.thumbUrl}
            alt={movie.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Top-Right Badge (Song Ngữ / Mới) */}
          {movie.isNew && (
            <span className="absolute right-1.5 top-1.5 z-10 rounded bg-accent px-1.5 py-0.5 text-[8px] @[140px]:text-[9px] @[180px]:text-[10px] font-bold text-white shadow">
              MỚI
            </span>
          )}

          {/* Bottom-Center Badge (PĐ. Full / PĐ. Tập...) */}
          <div className="absolute bottom-1.5 inset-x-0 z-10 flex items-center justify-center gap-1 px-1">
            {isSeries ? (
              <span className="rounded bg-black/80 px-1.5 @[140px]:px-2 py-0.5 text-[9px] @[140px]:text-[10px] font-semibold text-white/95 shadow-md border border-white/10 backdrop-blur-xs">
                {movie.episodeCurrent
                  ? `PĐ. ${movie.episodeCurrent.replace(/tập\s*/i, "").trim()}`
                  : "PĐ. Full"}
              </span>
            ) : (
              <span className="rounded bg-black/80 px-1.5 @[140px]:px-2 py-0.5 text-[9px] @[140px]:text-[10px] font-semibold text-white/95 shadow-md border border-white/10 backdrop-blur-xs">
                {movie.episodeCurrent?.toLowerCase().includes("full")
                  ? movie.episodeCurrent
                  : "PĐ. Full"}
              </span>
            )}
          </div>

          {/* Hover Overlay Play Icon */}
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex h-8 w-8 @[150px]:h-10 @[150px]:w-10 items-center justify-center rounded-full bg-accent text-white shadow-[0_0_20px_rgba(255,92,26,0.6)] transition-transform duration-200 group-hover:scale-110">
              <PlayIcon className="h-4 w-4 @[150px]:h-5 @[150px]:w-5" />
            </span>
          </div>
        </div>

        {/* Info Lines (Centered like screenshot) */}
        <div className="mt-1.5 px-0.5 text-center">
          <p className="truncate text-[11px] @[140px]:text-xs @[180px]:text-sm font-semibold text-white group-hover:text-accent transition-colors">
            {movie.name}
          </p>
          <p className="truncate text-[10px] @[140px]:text-[11px] @[180px]:text-xs text-white/50">
            {movie.originName || movie.year || `${movie.quality || "HD"}`}
          </p>
        </div>
      </Link>

      {/* POPUP PREVIEW HOVER BÊN CẠNH (BÊN PHẢI HOẶC BÊN TRÁI TÙY VỊ TRÍ MÀN HÌNH) */}
      {isHovered && (
        <div
          onMouseEnter={() => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          className={`absolute top-0 z-50 w-[295px] sm:w-[320px] rounded-xl sm:rounded-2xl bg-[#13141c] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95 pointer-events-auto ${
            popoverSide === "left"
              ? "right-full mr-3"
              : "left-full ml-3"
          }`}
        >
          {/* Banner 16:9 ở trên với chiều cao chuẩn gọn */}
          <div className="relative h-[135px] sm:h-[145px] w-full overflow-hidden bg-neutral-900">
            <Image
              src={movie.thumbUrl || movie.posterUrl}
              alt={movie.name}
              fill
              sizes="320px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#13141c] via-[#13141c]/25 to-transparent" />
          </div>

          {/* Nội dung thông tin preview */}
          <div className="p-3 sm:p-3.5 space-y-2">
            {/* Tiêu đề tiếng Việt & tiếng Anh */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold !text-white text-[#ffffff] leading-snug line-clamp-1">
                {movie.name}
              </h3>
              <p className="text-[11px] font-semibold !text-amber-400 text-[#fbbf24] mt-0.5 line-clamp-1">
                {movie.originName || movie.name}
              </p>
            </div>

            {/* 3 Nút thao tác: Xem ngay, Thích, Chi tiết */}
            <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-1.5 pt-0.5">
              <Link
                href={`/xem/${movie.slug}/tap-1`}
                className="flex items-center justify-center gap-1 rounded-lg bg-amber-400 hover:bg-amber-300 px-2 py-1.5 text-xs font-bold text-black shadow transition"
              >
                <PlayIcon className="h-3 w-3 fill-black" />
                <span>Xem ngay</span>
              </Link>
              <button
                type="button"
                onClick={toggleFavorite}
                className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                  optimisticFavorite
                    ? "bg-rose-500/20 border-rose-500/60 text-rose-400"
                    : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
                }`}
              >
                <HeartIcon className={`h-3 w-3 ${optimisticFavorite ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                <span>{optimisticFavorite ? "Đã thích" : "Thích"}</span>
              </button>
              <Link
                href={`/phim/${movie.slug}`}
                className="flex items-center justify-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-2 py-1.5 text-xs font-semibold text-white transition"
              >
                <InfoIcon className="h-3 w-3 text-white/80" />
                <span>Chi tiết</span>
              </Link>
            </div>

            {/* Hàng điểm số & thông số phụ (IMDb, TMDb, Năm, Trạng thái, Vietsub) */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[10px]">
              {/* IMDb Badge */}
              <div className="flex items-center rounded overflow-hidden font-bold">
                <span className="bg-[#f5c518] text-black px-1 py-0.5">IMDb</span>
                <span className="bg-neutral-800 text-white px-1.5 py-0.5 border border-l-0 border-white/10">
                  {movie.ratingAvg > 0 ? movie.ratingAvg.toFixed(1) : "9.0"}
                </span>
              </div>

              {/* TMDb Badge */}
              <div className="flex items-center rounded overflow-hidden font-bold">
                <span className="bg-[#01b4e4] text-black px-1 py-0.5">TMDb</span>
                <span className="bg-neutral-800 text-white px-1.5 py-0.5 border border-l-0 border-white/10">
                  {movie.ratingAvg > 0 ? (movie.ratingAvg * 0.95).toFixed(1) : "8.5"}
                </span>
              </div>

              {/* Năm */}
              {movie.year && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80 font-medium">
                  {movie.year}
                </span>
              )}

              {/* Trạng thái tập */}
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80 font-medium">
                {movie.episodeCurrent || (isSeries ? "Tập 1" : "Hoàn Tất")}
              </span>

              {/* Vietsub / TM */}
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80 font-medium">
                Vietsub
              </span>
            </div>

            {/* Thể loại */}
            <div className="pt-0.5 text-[10px] text-white/50 truncate">
              {formattedGenres}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
