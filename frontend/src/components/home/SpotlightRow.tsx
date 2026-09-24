"use client";

import Link from "next/link";
import Image from "next/image";
import { PlayIcon } from "@/components/ui/icons";
import { QualityBadge } from "@/components/ui/QualityBadge";
import type { CarouselSection, MovieSummary } from "@/types/movie";

function SpotlightMain({ movie }: { movie: MovieSummary }) {
  return (
    <Link
      href={`/phim/${movie.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-surface"
    >
      {/* Backdrop image — fills container */}
      <div className="relative aspect-[16/9] lg:aspect-auto lg:h-full overflow-hidden min-h-[220px] lg:min-h-[360px]">
        <Image
          src={movie.thumbUrl}
          alt={movie.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      {/* Gradient overlay — bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-base via-base/50 to-transparent z-10" />

      {/* Content over image */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end p-5 sm:p-6 lg:p-8">
        {/* Badges */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px]">
          {movie.ratingAvg > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 font-bold text-amber-300 border border-amber-500/30">
              ★ {movie.ratingAvg.toFixed(1)}
            </span>
          )}
          {movie.year && (
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-medium text-white/80 border border-white/10">
              {movie.year}
            </span>
          )}
          <QualityBadge quality={movie.quality} />
          {movie.episodeCurrent && (
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-medium text-white/80 border border-white/10">
              {movie.episodeCurrent}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight drop-shadow-md line-clamp-2">
          {movie.name}
        </h3>
        {movie.originName && (
          <p className="mt-0.5 text-xs text-amber-300/80 font-medium line-clamp-1">
            {movie.originName}
          </p>
        )}

        {/* Genres */}
        {movie.genres.length > 0 && (
          <p className="mt-1.5 text-xs text-muted line-clamp-1">
            {movie.genres.slice(0, 3).join(" · ")}
          </p>
        )}

        {/* Play prompt — visible on hover */}
        <div className="mt-3 flex items-center gap-2 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40">
            <PlayIcon className="h-4 w-4 ml-0.5" />
          </span>
          <span className="text-sm font-semibold text-white">Xem ngay</span>
        </div>
      </div>
    </Link>
  );
}

function SpotlightSide({ movie }: { movie: MovieSummary }) {
  return (
    <Link
      href={`/phim/${movie.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-surface"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={movie.thumbUrl}
          alt={movie.name}
          fill
          sizes="(max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-base/90 via-base/30 to-transparent z-10" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4">
        <div className="mb-1 flex items-center gap-1.5 text-[10px]">
          {movie.ratingAvg > 0 && (
            <span className="inline-flex items-center gap-0.5 font-bold text-amber-300">
              ★ {movie.ratingAvg.toFixed(1)}
            </span>
          )}
          <QualityBadge quality={movie.quality} />
        </div>
        <h4 className="font-display text-sm font-bold text-white leading-snug line-clamp-1 drop-shadow-sm">
          {movie.name}
        </h4>
        <p className="mt-0.5 text-[11px] text-muted line-clamp-1">
          {[movie.year, movie.genres[0]].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Hover play overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-base/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40">
          <PlayIcon className="h-4.5 w-4.5 ml-0.5" />
        </span>
      </div>
    </Link>
  );
}

interface SpotlightRowProps {
  section: CarouselSection;
}

export default function SpotlightRow({ section }: SpotlightRowProps) {
  const movies = section.movies;
  if (!movies || movies.length === 0) return null;

  const main = movies[0];
  const sides = movies.slice(1, 4); // max 3 sidebar items

  return (
    <section>
      <div className="mb-3 px-4 lg:px-10">
        <h2 className="font-display text-lg font-bold text-ink lg:text-xl">
          {section.title}
        </h2>
      </div>
      <div className="px-4 lg:px-10">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.45fr] lg:grid-rows-1">
          {/* Main featured movie */}
          <SpotlightMain movie={main} />

          {/* Sidebar stack */}
          {sides.length > 0 && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {sides.map((m) => (
                <SpotlightSide key={m.id} movie={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
