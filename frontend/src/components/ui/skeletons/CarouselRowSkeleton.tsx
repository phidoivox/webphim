import MovieCardSkeleton from "./MovieCardSkeleton";

export default function CarouselRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="space-y-3">
      {/* Title Bar Skeleton */}
      <div className="flex items-center justify-between px-4 lg:px-10">
        <div className="h-6 w-40 rounded-md bg-white/10 animate-pulse" />
        <div className="hidden gap-2 lg:flex">
          <div className="h-8 w-8 rounded-full bg-surface border border-white/5 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-surface border border-white/5 animate-pulse" />
        </div>
      </div>

      {/* Row of Cards */}
      <div className="flex gap-3 overflow-hidden px-4 pb-2 lg:px-10">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="shrink-0">
            <MovieCardSkeleton className="w-[140px] sm:w-[160px] lg:w-[175px]" />
          </div>
        ))}
      </div>
    </section>
  );
}
