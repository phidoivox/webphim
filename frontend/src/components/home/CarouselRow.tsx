"use client";

import { useRef } from "react";
import MovieCard from "@/components/movie/MovieCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { CarouselSection } from "@/types/movie";

const SCROLL_AMOUNT = 560;

export default function CarouselRow({ section }: { section: CarouselSection }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: "smooth" });
  };

  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-4 lg:px-10">
        <h2 className="font-display text-lg font-bold text-ink lg:text-xl">{section.title}</h2>
        <div className="hidden gap-2 lg:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={`Lùi: ${section.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-elevated hover:text-accent"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={`Tiến: ${section.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-elevated hover:text-accent"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-10"
      >
        {section.movies.map((movie) => (
          <div key={movie.id} className="snap-start">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
