import HeroBannerSkeleton from "./HeroBannerSkeleton";
import CarouselRowSkeleton from "./CarouselRowSkeleton";

export default function HomeSkeleton() {
  return (
    <div className="space-y-8 pb-16">
      <HeroBannerSkeleton />
      <div className="space-y-8">
        <CarouselRowSkeleton count={7} />
        <CarouselRowSkeleton count={7} />
        <CarouselRowSkeleton count={7} />
      </div>
    </div>
  );
}
