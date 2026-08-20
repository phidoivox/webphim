export default function HeroBannerSkeleton() {
  return (
    <div className="relative h-[55vh] min-h-[380px] max-h-[580px] w-full overflow-hidden bg-surface border-b border-white/5 animate-shimmer">
      {/* Gradient Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-(--color-base) via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-(--color-base)/90 via-black/30 to-transparent" />

      {/* Content Skeleton */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-8 lg:px-10">
        <div className="max-w-2xl space-y-4">
          {/* Badge Tags */}
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded bg-white/10" />
            <div className="h-5 w-12 rounded bg-white/10" />
            <div className="h-5 w-14 rounded bg-white/10" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 sm:h-10 w-4/5 rounded-lg bg-white/15 animate-pulse" />
            <div className="h-4 sm:h-5 w-1/2 rounded bg-white/10 animate-pulse" />
          </div>

          {/* Synopsis lines */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full rounded bg-white/10" />
            <div className="h-3.5 w-5/6 rounded bg-white/10" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-32 rounded-xl bg-accent/40 animate-pulse" />
            <div className="h-11 w-28 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
