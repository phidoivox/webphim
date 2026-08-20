import MovieCardSkeleton from "./MovieCardSkeleton";

export default function MovieGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-18 pb-12 sm:px-6 lg:px-8 space-y-4">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 sm:w-56 rounded-lg bg-white/15 animate-pulse" />
        <div className="h-6 w-20 rounded-md bg-white/10" />
      </div>

      {/* Grid of Movie Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 sm:gap-3.5 lg:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
