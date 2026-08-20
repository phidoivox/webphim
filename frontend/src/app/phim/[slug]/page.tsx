import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovieDetail, NotFoundError } from "@/lib/api";
import MovieDetailView from "@/components/movie/MovieDetailView";
import MovieJsonLd from "@/components/seo/MovieJsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const movie = await getMovieDetail(slug);
    const title = `${movie.name} (${movie.year || 2026}) - Xem Phim ${movie.quality || "HD"} Vietsub | WebPhim`;
    const description = movie.content
      ? movie.content.slice(0, 160)
      : `Xem phim ${movie.name} full HD Vietsub Thuyết minh mới nhất.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.movie",
        images: [
          {
            url: movie.posterUrl || movie.thumbUrl,
            width: 800,
            height: 1200,
            alt: movie.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [movie.posterUrl || movie.thumbUrl],
      },
    };
  } catch {
    return {
      title: "Không tìm thấy phim | WebPhim",
      description: "Bộ phim bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
    };
  }
}

async function MovieDetailContent({ params }: PageProps) {
  const { slug } = await params;

  let movie;
  try {
    movie = await getMovieDetail(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <MovieJsonLd movie={movie} />
      <MovieDetailView movie={movie} />
    </>
  );
}

export default function MovieDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base animate-pulse">
          <div className="h-[460px] lg:h-[540px] w-full bg-surface/60" />
        </div>
      }
    >
      <MovieDetailContent {...props} />
    </Suspense>
  );
}

