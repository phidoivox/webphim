import { Suspense } from "react";
import { getCachedHome } from "@/lib/cached-content";
import HeroBanner from "@/components/home/HeroBanner";
import CarouselRow from "@/components/home/CarouselRow";
import HomeSkeleton from "@/components/ui/skeletons/HomeSkeleton";

async function HomeContent() {
  let data;
  try {
    data = await getCachedHome();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu trang chủ:", error);
    data = { heroMovies: [], sections: [] };
  }

  return (
    <>
      <HeroBanner movies={data.heroMovies || []} />
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12 py-8">
        {(data.sections || []).map((section) => (
          <CarouselRow key={section.id} section={section} />
        ))}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}


