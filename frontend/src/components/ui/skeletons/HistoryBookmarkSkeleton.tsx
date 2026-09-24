import MovieCardSkeleton from "./MovieCardSkeleton";

interface HistoryBookmarkSkeletonProps {
  title?: string;
  count?: number;
}

export default function HistoryBookmarkSkeleton({
  title: _title = "Tủ phim",
  count = 12,
}: HistoryBookmarkSkeletonProps) {
  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16 select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-3.5 w-16 rounded bg-white/10" />
          <div className="h-3 w-3 rounded bg-white/5" />
          <div className="h-3.5 w-20 rounded bg-white/10" />
        </div>

        {/* Sync Prompt Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/5 bg-surface/60 p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />
            <div className="space-y-1">
              <div className="h-4 w-48 rounded bg-white/15 animate-pulse" />
              <div className="h-3 w-64 rounded bg-white/10" />
            </div>
          </div>
          <div className="h-8 w-28 rounded-full bg-accent/40 animate-pulse" />
        </div>

        {/* Header & Controls Skeleton */}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-44 rounded-xl bg-white/15 animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-white/10" />
            </div>
            <div className="h-3 w-60 rounded bg-white/10" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
              <div className="h-7 w-16 rounded-lg bg-accent/40 animate-pulse" />
              <div className="h-7 w-20 rounded-lg bg-white/5" />
              <div className="h-7 w-20 rounded-lg bg-white/5" />
            </div>
          </div>
        </div>

        {/* Movies Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4 pt-2">
          {Array.from({ length: count }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
