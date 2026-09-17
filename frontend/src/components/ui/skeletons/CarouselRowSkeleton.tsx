import MovieCardSkeleton from "./MovieCardSkeleton";

export default function CarouselRowSkeleton({ count = 7 }: { count?: number }) {
  return (
    <section className="space-y-3 select-none">
      {/* Title Bar Skeleton */}
      <div className="mb-3 flex items-end justify-between px-4 lg:px-10">
        <div className="h-6 sm:h-7 w-48 sm:w-56 rounded-lg bg-white/10 animate-pulse" />
        <div className="hidden gap-2 lg:flex">
          <div className="h-8 w-8 rounded-full bg-surface border border-white/5" />
          <div className="h-8 w-8 rounded-full bg-surface border border-white/5" />
        </div>
      </div>

      {/* Row of Cards */}
      <div className="flex gap-3 overflow-hidden px-4 pt-2 pb-6 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="shrink-0 w-[140px] sm:w-[160px] lg:w-[175px]">
            <MovieCardSkeleton className="w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
