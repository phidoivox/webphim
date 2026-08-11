import HeroBanner from "@/components/home/HeroBanner";
import CarouselRow from "@/components/home/CarouselRow";
import { heroMovies, homeSections } from "@/data/movies";

export default function Home() {
  return (
    <>
      <HeroBanner movies={heroMovies} />
      <div className="mx-auto max-w-7xl space-y-8 py-8">
        {homeSections.map((section) => (
          <CarouselRow key={section.id} section={section} />
        ))}
      </div>
    </>
  );
}
