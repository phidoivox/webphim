export default function PlayerSkeleton() {
  return (
    <div className="min-h-screen pb-20 select-none">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 pt-2 text-xs">
          <div className="h-3.5 w-16 rounded bg-white/10" />
          <div className="h-3 w-3 rounded bg-white/5" />
          <div className="h-3.5 w-24 rounded bg-white/10" />
          <div className="h-3 w-3 rounded bg-white/5" />
          <div className="h-3.5 w-16 rounded bg-white/10" />
        </div>

        {/* 16:9 Video Player Shell Skeleton */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl flex items-center justify-center animate-shimmer">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 border border-white/20 animate-pulse">
            <div className="h-6 w-6 rounded bg-white/30" />
          </div>

          {/* Bottom Player Controls Overlay Skeleton */}
          <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-white/20" />
              <div className="h-3 w-16 rounded bg-white/20" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-white/20" />
              <div className="h-4 w-4 rounded bg-white/20" />
              <div className="h-4 w-4 rounded bg-white/20" />
            </div>
          </div>
        </div>

        {/* Title Bar & Quick Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-surface/80 p-4 border border-white/5">
          <div className="space-y-1.5">
            <div className="h-6 sm:h-7 w-64 sm:w-80 rounded-lg bg-white/15 animate-pulse" />
            <div className="h-4 w-40 rounded bg-amber-400/20" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 rounded-xl bg-white/10" />
            <div className="h-9 w-24 rounded-xl bg-white/10" />
            <div className="h-9 w-9 rounded-xl bg-white/10" />
          </div>
        </div>

        {/* Server & Episode Selector Box */}
        <div className="space-y-4 rounded-2xl bg-surface/80 p-5 border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-28 rounded-lg bg-accent/40 animate-pulse" />
              <div className="h-8 w-24 rounded-lg bg-white/10" />
            </div>
            <div className="h-4 w-20 rounded bg-white/10" />
          </div>

          {/* Episode Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 pt-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-white/5 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Comments Section Skeleton Placeholder */}
        <div className="space-y-4 rounded-2xl bg-surface/60 p-6 border border-white/5">
          <div className="h-6 w-36 rounded bg-white/15" />
          <div className="h-20 w-full rounded-xl bg-white/5 border border-white/5" />
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="h-3.5 w-3/4 rounded bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
