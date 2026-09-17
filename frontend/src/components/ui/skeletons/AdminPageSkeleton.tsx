export default function AdminPageSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto select-none">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="h-7 w-48 rounded-xl bg-white/15 animate-pulse" />
          <div className="h-3.5 w-72 rounded bg-white/10" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-lg bg-white/10" />
          <div className="h-9 w-32 rounded-lg bg-accent/40 animate-pulse" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-5 space-y-3 animate-shimmer"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-white/10" />
              <div className="h-8 w-8 rounded-lg bg-white/10" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-white/15 animate-pulse" />
            <div className="h-3 w-28 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Data Table Skeleton */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-white/15 animate-pulse" />
          <div className="h-8 w-48 rounded-lg bg-white/5 border border-white/5" />
        </div>
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-surface/30 border border-white/5 animate-shimmer"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
