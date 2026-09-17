import HeroBannerSkeleton from "./HeroBannerSkeleton";
import CarouselRowSkeleton from "./CarouselRowSkeleton";

export default function HomeSkeleton() {
  return (
    <div className="min-h-screen space-y-8 pb-16">
      <HeroBannerSkeleton />
      <div className="space-y-10">
        <CarouselRowSkeleton count={7} />
        <CarouselRowSkeleton count={7} />
        <CarouselRowSkeleton count={7} />
      </div>
    </div>
  );
}
