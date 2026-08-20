import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountries, getFilteredMovies, getGenres } from "@/lib/api";
import MovieCategoryView from "@/components/movie/MovieCategoryView";

interface PageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const TYPE_MAP: Record<string, { apiType: string; title: string; desc: string }> = {
  "phim-le": {
    apiType: "single",
    title: "Phim Lẻ",
    desc: "Danh sách phim lẻ, phim chiếu rạp bom tấn chất lượng cao FHD/4K Vietsub.",
  },
  "phim-bo": {
    apiType: "series",
    title: "Phim Bộ",
    desc: "Tổng hợp danh sách phim bộ Việt Nam, Hàn Quốc, Trung Quốc, Âu Mỹ hấp dẫn.",
  },
  "tv-shows": {
    apiType: "tv-show",
    title: "TV Shows",
    desc: "Các chương trình truyền hình thực tế, gameshow và TV show đặc sắc nhất.",
  },
  "hoat-hinh": {
    apiType: "anime",
    title: "Hoạt Hình",
    desc: "Tuyển tập phim hoạt hình, anime đặc sắc chất lượng cao.",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const config = TYPE_MAP[type];

  if (!config) {
    return { title: "Không tìm thấy danh mục | WebPhim" };
  }

  return {
    title: `${config.title} - Xem Phim Online Miễn Phí | WebPhim`,
    description: config.desc,
  };
}

async function CategoryContent({ params, searchParams }: PageProps) {
  const { type } = await params;
  const sParams = await searchParams;

  const config = TYPE_MAP[type];
  if (!config) {
    notFound();
  }

  const [genres, countries, moviesData] = await Promise.all([
    getGenres().catch(() => []),
    getCountries().catch(() => []),
    getFilteredMovies({
      type: config.apiType,
      genre: sParams.genre,
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
    })),
  ]);

  return (
    <MovieCategoryView
      title={config.title}
      genres={genres}
      countries={countries}
      movies={moviesData.data}
      pagination={moviesData.meta}
      currentParams={{
        type: config.apiType,
        genre: sParams.genre,
        country: sParams.country,
        year: sParams.year,
        sort: sParams.sort,
      }}
      showTypeFilter={false}
    />
  );
}

export default function CategoryPage(props: PageProps) {
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
      <CategoryContent {...props} />
    </Suspense>
  );
}

