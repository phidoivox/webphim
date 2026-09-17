export default function ScheduleSkeleton() {
  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16 select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-3.5 w-16 rounded bg-white/10" />
          <div className="h-3 w-3 rounded bg-white/5" />
          <div className="h-3.5 w-16 rounded bg-white/10" />
        </div>

        {/* Header & Search Bar Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-white/15" />
            <div className="h-7 w-36 rounded-xl bg-white/15 animate-pulse" />
          </div>
          <div className="h-9 w-full sm:w-64 rounded-xl bg-[#161622] border border-white/5" />
        </div>

        {/* 7 Days Bar Skeleton */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="h-14 w-8 sm:w-10 rounded-xl bg-[#14141c] border border-white/5" />
          <div className="grid flex-1 grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-xl py-2 sm:py-2.5 bg-[#14141c] border-t-2 ${
                  i === 2 ? "border-amber-400/60 bg-[#1e1e2d]" : "border-transparent"
                }`}
              >
                <div className="h-3 w-10 rounded bg-white/10" />
                <div className="mt-1.5 h-3.5 w-12 rounded bg-white/15 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-14 w-8 sm:w-10 rounded-xl bg-[#14141c] border border-white/5" />
        </div>

        {/* Movies Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-2xl bg-[#161622] p-3 border border-white/5 animate-shimmer"
            >
              <div className="aspect-[2/3] w-20 shrink-0 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-4/5 rounded bg-white/15 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
                <div className="h-3 w-2/3 rounded bg-amber-400/20" />
                <div className="flex gap-1 pt-1">
                  <div className="h-4 w-12 rounded bg-white/10" />
                  <div className="h-4 w-12 rounded bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
