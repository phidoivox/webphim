interface MovieCardSkeletonProps {
  className?: string;
}

export default function MovieCardSkeleton({ className = "w-full" }: MovieCardSkeletonProps) {
  return (
    <div className={`block ${className}`}>
      {/* Poster Skeleton */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface border border-white/5 animate-shimmer">
        {/* Bottom Badge Skeleton */}
        <div className="absolute bottom-1.5 inset-x-0 z-10 flex justify-center">
          <div className="h-4 w-12 rounded bg-black/70 border border-white/10" />
        </div>
      </div>

      {/* Centered Title Skeleton */}
      <div className="mt-1.5 px-0.5 space-y-1">
        <div className="mx-auto h-3.5 w-4/5 rounded bg-white/10 animate-pulse" />
        <div className="mx-auto h-2.5 w-1/2 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
