export default function MovieDetailSkeleton() {
  return (
    <div className="relative min-h-screen pb-20">
      {/* Backdrop Banner Skeleton */}
      <div className="relative h-[48vh] min-h-[340px] max-h-[520px] w-full bg-surface animate-shimmer">
        <div className="absolute inset-0 bg-gradient-to-t from-(--color-base) via-(--color-base)/70 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto -mt-36 max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          {/* Left Column: Poster Skeleton */}
          <div className="space-y-4">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-surface border border-white/10 shadow-2xl animate-shimmer" />
            <div className="h-12 w-full rounded-xl bg-accent/40 animate-pulse" />
          </div>

          {/* Right Column: Movie Info Skeleton */}
          <div className="space-y-6">
            {/* Title & Origin Name */}
            <div className="space-y-2">
              <div className="h-8 sm:h-10 w-3/4 rounded-lg bg-white/15 animate-pulse" />
              <div className="h-4 sm:h-5 w-1/3 rounded bg-white/10 animate-pulse" />
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-14 rounded-md bg-white/10" />
              <div className="h-6 w-16 rounded-md bg-white/10" />
              <div className="h-6 w-20 rounded-md bg-white/10" />
              <div className="h-6 w-24 rounded-md bg-white/10" />
            </div>

            {/* Synopsis Paragraph Skeleton */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-4/5 rounded bg-white/10" />
            </div>

            {/* Episodes Box Skeleton */}
            <div className="space-y-3 rounded-2xl bg-surface/80 border border-white/10 p-5">
              <div className="h-5 w-32 rounded bg-white/15" />
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/5 border border-white/5 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Cast Skeleton */}
            <div className="space-y-3">
              <div className="h-5 w-28 rounded bg-white/15" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-3 w-12 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
