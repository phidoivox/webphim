export default function HeroBannerSkeleton() {
  return (
    <div className="relative h-[50vh] sm:h-[60vh] lg:h-[72vh] min-h-[420px] max-h-[760px] w-full overflow-hidden bg-[#12131a] select-none">
      {/* Background Backdrop Shimmer */}
      <div className="absolute inset-0 bg-surface/80 animate-shimmer" />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-base/90 via-base/30 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-base/60 via-transparent to-transparent z-10 h-28" />

      {/* Main Banner Content Skeleton */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col justify-end pb-12 lg:pb-16">
        <div className="max-w-xl space-y-3 sm:space-y-3.5">
          {/* Main Title & Origin Name */}
          <div className="space-y-1.5">
            <div className="h-8 sm:h-11 lg:h-12 w-4/5 rounded-xl bg-white/15 animate-pulse" />
            <div className="h-4 sm:h-5 w-2/5 rounded-md bg-amber-400/20" />
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <div className="h-5 w-14 rounded-md bg-white/10" />
            <div className="h-5 w-14 rounded-md bg-white/10" />
            <div className="h-5 w-12 rounded-md bg-white/10" />
            <div className="h-5 w-16 rounded-md bg-white/10" />
            <div className="h-5 w-10 rounded-md bg-accent/30" />
          </div>

          {/* Genre Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="h-5 w-16 rounded-full bg-white/10" />
            <div className="h-5 w-20 rounded-full bg-white/10" />
            <div className="h-5 w-14 rounded-full bg-white/10" />
          </div>

          {/* Synopsis lines */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full rounded bg-white/10" />
            <div className="h-3.5 w-11/12 rounded bg-white/10" />
            <div className="h-3.5 w-3/4 rounded bg-white/10 hidden sm:block" />
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <div className="h-10 sm:h-11 w-32 rounded-xl bg-accent/60 shadow-lg shadow-accent/20 animate-pulse" />
            <div className="h-10 sm:h-11 w-28 rounded-xl bg-white/10 border border-white/10" />
            <div className="h-10 sm:h-11 w-11 rounded-xl bg-white/10 border border-white/10" />
          </div>
        </div>
      </div>

      {/* Bottom Right Slide Indicators */}
      <div className="absolute right-4 sm:right-8 bottom-6 z-20 hidden sm:flex items-center gap-1.5">
        <div className="h-1.5 w-6 rounded-full bg-accent" />
        <div className="h-1.5 w-2 rounded-full bg-white/20" />
        <div className="h-1.5 w-2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}
