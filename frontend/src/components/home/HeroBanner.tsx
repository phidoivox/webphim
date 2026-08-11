"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PlayIcon } from "@/components/ui/icons";
import type { HeroMovie } from "@/types/movie";

export default function HeroBanner({ movies }: { movies: HeroMovie[] }) {
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (movies.length <= 1) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setActive((i) => (i + 1) % movies.length);
    }, 7000);
    return () => clearInterval(id);
  }, [movies.length]);

  const movie = movies[active];

  return (
    <section
      className="relative overflow-hidden bg-base"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      {/* Backdrop + gradient fade xuống nền */}
      <div className="relative aspect-[16/10] sm:aspect-[16/8] lg:aspect-[21/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={movie.backdropUrl} alt={movie.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base/80 via-transparent to-transparent" />
      </div>

      {/* Nội dung */}
      <div key={movie.id} className="absolute inset-x-0 bottom-0 px-4 pb-12 lg:px-10">
        <h1 className="animate-rise font-display text-3xl font-extrabold text-ink lg:text-5xl">
          {movie.name}
        </h1>
        <p className="animate-rise mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted [animation-delay:80ms]">
          <span>{movie.year}</span>
          <span>{movie.quality}</span>
          {movie.genres.map((g) => (
            <span key={g}>{g}</span>
          ))}
          <span className="text-faint">{movie.episodeLabel}</span>
        </p>
        <p className="animate-rise mt-3 hidden max-w-xl text-sm leading-relaxed text-muted [animation-delay:160ms] md:line-clamp-2 lg:block">
          {movie.description}
        </p>
        <div className="animate-rise mt-5 flex items-center gap-3 [animation-delay:240ms]">
          <Link
            href={`/xem/${movie.slug}/tap-1`}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover"
          >
            <PlayIcon className="h-4 w-4" />
            XEM NGAY
          </Link>
          {movie.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-elevated bg-surface/80 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
            >
              Xem trailer
            </a>
          )}
        </div>
      </div>

      {/* Chấm điều hướng */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5 lg:right-10">
          {movies.map((mov, i) => (
            <button
              key={mov.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Chuyển tới: ${mov.name}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-accent" : "w-1.5 bg-muted/50 hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
