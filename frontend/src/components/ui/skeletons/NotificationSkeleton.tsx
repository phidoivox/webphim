export default function NotificationSkeleton() {
  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-16 select-none">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-3.5 w-16 rounded bg-white/10" />
          <div className="h-3 w-3 rounded bg-white/5" />
          <div className="h-3.5 w-20 rounded bg-white/10" />
        </div>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 animate-pulse" />
            <div className="space-y-1">
              <div className="h-7 w-48 rounded-xl bg-white/15 animate-pulse" />
              <div className="h-3.5 w-64 rounded bg-white/10" />
            </div>
          </div>
          <div className="h-8 w-36 rounded-xl bg-white/5 border border-white/10" />
        </div>

        {/* Filter Tabs Skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="h-7 w-16 rounded-full bg-accent/40 animate-pulse" />
          <div className="h-7 w-20 rounded-full bg-white/5" />
          <div className="h-7 w-20 rounded-full bg-white/5" />
          <div className="h-7 w-28 rounded-full bg-white/5" />
          <div className="h-7 w-20 rounded-full bg-white/5" />
        </div>

        {/* Notification Items List Skeleton */}
        <div className="space-y-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-[#14141a]/60 p-4 animate-shimmer"
            >
              <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-1/3 rounded bg-white/15 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-white/5" />
                </div>
                <div className="h-3.5 w-4/5 rounded bg-white/10" />
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="h-3.5 w-20 rounded bg-accent/30" />
                  <div className="h-5 w-14 rounded bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
