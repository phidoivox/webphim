import MovieCardSkeleton from "./MovieCardSkeleton";

export default function MovieGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-18 pb-12 sm:px-6 lg:px-8 space-y-5 select-none">
      {/* Title & Filter Button Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 sm:w-64 rounded-xl bg-white/15 animate-pulse" />
        <div className="h-6 w-20 rounded-lg bg-white/10" />
      </div>

      {/* Grid of Movie Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 sm:gap-3.5 lg:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center gap-2 pt-8">
        <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/5" />
        <div className="h-9 w-9 rounded-xl bg-accent/40 animate-pulse" />
        <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/5" />
        <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/5" />
        <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/5" />
      </div>
    </div>
  );
}
