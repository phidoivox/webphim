import { Suspense } from "react";
import type { Metadata } from "next";
import { getFilteredMovies } from "@/lib/api";
import SearchClientView from "@/components/movie/SearchClientView";

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
    <SearchClientView
      keyword={query}
      movies={response.data}
      meta={response.meta}
    />
  );
}

export default function SearchPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-surface/60 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-surface/40 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <SearchResults {...props} />
    </Suspense>
  );
}

