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
      <div className="mb-3 flex items-end justify-between px-3 sm:px-6 lg:px-10">
        <h2 className="font-display text-base font-bold text-ink sm:text-lg lg:text-xl tracking-tight">{section.title}</h2>
        <div className="hidden gap-2 lg:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={`Lùi: ${section.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-white/5 text-muted transition-colors hover:bg-elevated hover:text-accent cursor-pointer"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={`Tiến: ${section.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-white/5 text-muted transition-colors hover:bg-elevated hover:text-accent cursor-pointer"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory scroll-smooth gap-2.5 sm:gap-3.5 overflow-x-auto px-3 sm:px-6 lg:px-10 pt-4 pb-6 -my-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {section.movies.map((movie) => (
          <div
            key={movie.id}
            className="snap-start shrink-0 w-[125px] xs:w-[140px] sm:w-[160px] md:w-[170px] lg:w-[185px]"
          >
            <MovieCard movie={movie} className="w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
