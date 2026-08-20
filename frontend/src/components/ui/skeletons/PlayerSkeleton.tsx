export default function PlayerSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 space-y-6">
      {/* 16:9 Video Player Shell Skeleton */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl flex items-center justify-center animate-shimmer">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 border border-white/20 animate-pulse">
          <div className="h-6 w-6 rounded bg-white/30" />
        </div>
      </div>

      {/* Episode / Server Control Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface p-4 border border-white/5">
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-9 w-28 rounded-lg bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-white/10" />
          <div className="h-9 w-24 rounded-lg bg-white/10" />
        </div>
      </div>

      {/* Episode Grid Skeleton */}
      <div className="space-y-3 rounded-2xl bg-surface p-5 border border-white/5">
        <div className="h-5 w-36 rounded bg-white/15" />
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
