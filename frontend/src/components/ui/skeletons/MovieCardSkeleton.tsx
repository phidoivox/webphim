interface MovieCardSkeletonProps {
  className?: string;
}

export default function MovieCardSkeleton({ className = "w-full" }: MovieCardSkeletonProps) {
  return (
    <div className={`block ${className} select-none`}>
      {/* Poster Skeleton */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface border border-white/5 animate-shimmer shadow-md">
        {/* Top-Right Badge Skeleton */}
        <div className="absolute right-1.5 top-1.5 z-10">
          <div className="h-3.5 w-7 rounded bg-white/10" />
        </div>

        {/* Bottom Badge Skeleton */}
        <div className="absolute bottom-1.5 inset-x-0 z-10 flex justify-center px-1">
          <div className="h-4 w-14 rounded bg-black/80 border border-white/10" />
        </div>
      </div>

      {/* Centered Title Skeleton */}
      <div className="mt-1.5 px-0.5 space-y-1 text-center">
        <div className="mx-auto h-3.5 w-4/5 rounded bg-white/10 animate-pulse" />
        <div className="mx-auto h-2.5 w-1/2 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
