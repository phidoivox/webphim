export default function MovieDetailSkeleton() {
  return (
    <div className="relative min-h-screen pb-20 select-none">
      {/* Backdrop Banner Skeleton */}
      <div className="relative h-[48vh] min-h-[340px] max-h-[520px] w-full bg-[#12131a] overflow-hidden">
        <div className="absolute inset-0 bg-surface/80 animate-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base/90 via-base/40 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto -mt-36 max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 pb-6">
          <div className="h-3.5 w-16 rounded bg-white/10" />
          <div className="h-3 w-3 rounded bg-white/5" />
          <div className="h-3.5 w-20 rounded bg-white/10" />
          <div className="h-3 w-3 rounded bg-white/5" />
          <div className="h-3.5 w-32 rounded bg-white/10" />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          {/* Left Column: Poster Skeleton */}
          <div className="space-y-4">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-surface border border-white/10 shadow-2xl animate-shimmer" />
            <div className="h-11 w-full rounded-full bg-accent/50 animate-pulse shadow-md" />
            <div className="flex items-center justify-around py-2 px-3 rounded-xl bg-surface/60 border border-white/5">
              <div className="h-6 w-6 rounded-full bg-white/10" />
              <div className="h-6 w-6 rounded-full bg-white/10" />
              <div className="h-6 w-6 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Right Column: Movie Info Skeleton */}
          <div className="space-y-6">
            {/* Title & Origin Name */}
            <div className="space-y-2">
              <div className="h-8 sm:h-10 w-4/5 rounded-xl bg-white/15 animate-pulse" />
              <div className="h-4 sm:h-5 w-1/3 rounded-md bg-amber-400/20" />
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-14 rounded-md bg-white/10" />
              <div className="h-5 w-14 rounded-md bg-white/10" />
              <div className="h-5 w-12 rounded-md bg-white/10" />
              <div className="h-5 w-16 rounded-md bg-white/10" />
              <div className="h-5 w-10 rounded-md bg-accent/30" />
            </div>

            {/* Metadata 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 max-w-xl">
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-4 w-2/3 rounded bg-white/10" />
              <div className="h-4 w-1/2 rounded bg-white/10" />
              <div className="h-4 w-3/5 rounded bg-white/10" />
              <div className="h-4 w-4/5 rounded bg-white/10" />
              <div className="h-4 w-2/3 rounded bg-white/10" />
            </div>

            {/* Synopsis Paragraph Skeleton */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-4/5 rounded bg-white/10" />
            </div>

            {/* Tabs Bar Skeleton */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-2">
              <div className="h-8 w-24 rounded-lg bg-accent/30 animate-pulse" />
              <div className="h-8 w-20 rounded-lg bg-white/5" />
              <div className="h-8 w-24 rounded-lg bg-white/5" />
              <div className="h-8 w-20 rounded-lg bg-white/5" />
            </div>

            {/* Episodes Box Skeleton */}
            <div className="space-y-4 rounded-2xl bg-surface/80 border border-white/5 p-5">
              {/* Server selector */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-28 rounded-lg bg-white/15 animate-pulse" />
                <div className="h-8 w-24 rounded-lg bg-white/5" />
              </div>
              {/* Episodes Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/5 border border-white/5 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
