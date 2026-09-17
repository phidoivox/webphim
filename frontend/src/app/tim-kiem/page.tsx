import { Suspense } from "react";
import type { Metadata } from "next";
import { getFilteredMovies } from "@/lib/api";
import MovieCategoryView from "@/components/movie/MovieCategoryView";
import MovieGridSkeleton from "@/components/ui/skeletons/MovieGridSkeleton";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    type?: string;
    genre?: string;
    lang?: string;
    year?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim() || "";

  return {
    title: query
      ? `Tìm kiếm: "${query}" - Kết Quả Phim | WebPhim`
      : "Tìm Kiếm Phim & Bộ Lọc Nâng Cao | WebPhim",
    description: `Kết quả tìm kiếm phim với từ khóa "${query}" trên WebPhim. Hỗ trợ lọc theo thể loại, quốc gia, năm, ngôn ngữ.`,
  };
}

async function SearchResults({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";

  const response = await getFilteredMovies({
    q: query,
    country: params.country,
    type: params.type,
    genre: params.genre,
    lang: params.lang,
    year: params.year,
    sort: params.sort || "latest",
    page: params.page || "1",
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

  return (
    <MovieCategoryView
      title="Tìm kiếm phim"
      keyword={query}
      movies={response.data}
      pagination={response.meta}
      currentParams={{
        type: params.type,
        genre: params.genre,
        country: params.country,
        lang: params.lang,
        year: params.year,
        sort: params.sort,
      }}
      defaultFilterOpen={true}
    />
  );
}

export default function SearchPage(props: PageProps) {
  return (
    <Suspense fallback={<MovieGridSkeleton count={24} />}>
      <SearchResults {...props} />
    </Suspense>
  );
}

