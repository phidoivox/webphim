"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@/components/ui/icons";
import type { ScheduleMovieItem } from "@/types/schedule";

interface ScheduleMovieCardProps {
  movie: ScheduleMovieItem;
}

export function ScheduleMovieCard({ movie }: ScheduleMovieCardProps) {
  const initialPoster = movie.posterUrl || movie.thumbUrl || "/images/placeholder.jpg";
  const [imgSrc, setImgSrc] = useState(initialPoster);

  // Parse episode tags (e.g. "Tập 22, Tập 23" -> ["Tập 22", "Tập 23"])
  const episodeTags = (() => {
    if (!movie.episodeCurrent) {
      return movie.notifySchedule ? [movie.notifySchedule] : ["Tập mới"];
    }
    const parts = movie.episodeCurrent
      .split(/[,+&|]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : [movie.episodeCurrent];
  })();

  return (
    <Link
      href={`/phim/${movie.slug}`}
      className="schedule-card-contain group relative flex items-center gap-3.5 rounded-2xl border border-white/5 bg-[#161622]/90 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#1e1e2d] hover:shadow-lg hover:shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >

      {/* Poster Image Container (Left) */}
      <div className="relative h-20 w-15 sm:h-22 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 shadow-md">
        <Image
          src={imgSrc}
          alt={movie.name}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgSrc("/images/placeholder.jpg")}
          loading="lazy"
          unoptimized={imgSrc.startsWith("http") && !imgSrc.includes("tmdb.org") && !imgSrc.includes("phimimg.com")}
        />
        {movie.quality && (
          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.2 text-[8px] font-bold text-white backdrop-blur-xs">
            {movie.quality}
          </span>
        )}
      </div>

      {/* Movie Details (Right) */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <h3 className="line-clamp-1 text-xs sm:text-sm font-bold text-white transition-colors group-hover:text-amber-400">
          {movie.name}
        </h3>

        {/* Origin / Subtitle */}
        {movie.originName && (
          <p className="line-clamp-1 text-[11px] text-white/45 mt-0.5">
            {movie.originName}
          </p>
        )}

        {/* Episodes Row */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {episodeTags.map((ep, idx) => (
            <span
              key={idx}
              className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80 transition-colors group-hover:bg-white/15"
            >
              {ep.startsWith("Tập") ? ep : `Tập ${ep}`}
            </span>
          ))}

          {/* Rating if available */}
          {movie.ratingAvg > 0 && (
            <div className="ml-auto flex items-center gap-0.5 text-[11px] font-semibold text-amber-400">
              <StarIcon className="h-3 w-3 fill-amber-400" />
              <span>{movie.ratingAvg.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
