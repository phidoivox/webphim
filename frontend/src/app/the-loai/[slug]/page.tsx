import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountries, getFilteredMovies, getGenres } from "@/lib/api";
import { GENRES } from "@/data/genres";
import MovieCategoryView from "@/components/movie/MovieCategoryView";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const staticGenre = GENRES.find((g) => g.slug === slug);
  const titleName = staticGenre?.label || slug;

  return {
    title: `Phim ${titleName} Hay Nhất | WebPhim`,
    description: `Tuyển tập các bộ phim thể loại ${titleName} mới nhất, chọn lọc hấp dẫn nhất.`,
  };
}

async function GenreContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sParams = await searchParams;

  const [genres, countries] = await Promise.all([
    getGenres().catch(() => []),
    getCountries().catch(() => []),
  ]);

  const currentGenre =
    genres.find((g) => g.slug === slug) ||
    GENRES.find((g) => g.slug === slug);

  if (!currentGenre) {
    notFound();
  }

  const moviesData = await getFilteredMovies({
    genre: slug,
    type: sParams.type,
    country: sParams.country,
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
  }));

  const genreName = "name" in currentGenre ? currentGenre.name : currentGenre.label;

  return (
    <MovieCategoryView
      title={`Phim ${genreName}`}
      genres={genres}
      countries={countries}
      movies={moviesData.data}
      pagination={moviesData.meta}
      currentParams={{
        genre: slug,
        type: sParams.type,
        country: sParams.country,
        year: sParams.year,
        sort: sParams.sort,
      }}
      showGenreFilter={false}
    />
  );
}

export default function GenrePage(props: PageProps) {
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
      <GenreContent {...props} />
    </Suspense>
  );
}

