import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFilteredMovies } from "@/lib/api";
import { getCachedCountries } from "@/lib/cached-content";
import { COUNTRIES } from "@/data/countries";
import MovieCategoryView from "@/components/movie/MovieCategoryView";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const staticCountry = COUNTRIES.find((c) => c.slug === slug);
  const titleName = staticCountry?.label || slug;

  return {
    title: `Phim ${titleName} Hay Nhất | WebPhim`,
    description: `Tổng hợp các bộ phim ${titleName} mới nhất, cập nhật liên tục bản đẹp Vietsub Thuyết minh.`,
  };
}

async function CountryContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sParams = await searchParams;

  const [countries, moviesData] = await Promise.all([
    getCachedCountries().catch(() => []),
    getFilteredMovies({
      country: slug,
      type: sParams.type,
      genre: sParams.genre,
      year: sParams.year,
      sort: sParams.sort || "latest",
      page: sParams.page || "1",
      per_page: "32",
    }).catch(() => ({
      data: [],
      meta: {
        currentPage: 1,
        lastPage: 1,
        perPage: 32,
        total: 0,
        hasMore: false,
      },
    })),
  ]);

  const currentCountry =
    countries.find((c) => c.slug === slug) ||
    COUNTRIES.find((c) => c.slug === slug);

  if (!currentCountry) {
    notFound();
  }

  const countryName = "name" in currentCountry ? currentCountry.name : currentCountry.label;

  return (
    <MovieCategoryView
      title={`Phim ${countryName}`}
      subtitle={`Tuyển tập các bộ phim ${countryName} mới nhất và hấp dẫn nhất`}
      movies={moviesData.data}
      pagination={moviesData.meta}
      currentParams={{
        country: slug,
        type: sParams.type,
        genre: sParams.genre,
        year: sParams.year,
        sort: sParams.sort,
      }}
    />
  );
}

export default function CountryPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 w-48 bg-surface/60 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-surface/40 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <CountryContent {...props} />
    </Suspense>
  );
}

