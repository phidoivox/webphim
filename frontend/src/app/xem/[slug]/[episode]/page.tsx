import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getMovieDetail, NotFoundError } from "@/lib/api";
import WatchViewClient from "./WatchViewClient";

interface PageProps {
  params: Promise<{ slug: string; episode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, episode } = await params;

  try {
    const movie = await getMovieDetail(slug);
    const ep = movie.episodes?.find((e) => e.slug === episode);
    const epName = ep?.name ? ` - ${ep.name}` : "";
    const title = `Xem phim ${movie.name}${epName} (${movie.year || 2026}) | WebPhim`;
    const description = movie.content
      ? movie.content.slice(0, 160)
      : `Xem phim ${movie.name}${epName} full HD Vietsub Thuyết minh mới nhất.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.episode",
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
      title: "Xem phim | WebPhim",
      description: "Xem phim online chất lượng cao miễn phí tại WebPhim.",
    };
  }
}

async function WatchContent({ params }: PageProps) {
  const { slug, episode } = await params;

  let movie;
  try {
    movie = await getMovieDetail(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  // Next.js 16 after() API: Thực thi telemetry / logging ngầm sau khi response hoàn tất, không chặn render
  after(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Telemetry:after] View page rendered for movie #${movie.id} (${movie.name}) - Ep: ${episode}`);
    }
  });

  return <WatchViewClient movie={movie} episodeSlug={episode} />;
}

export default function WatchPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base animate-pulse">
          <div className="aspect-video w-full max-w-6xl mx-auto bg-surface/60 rounded-2xl mt-4" />
        </div>
      }
    >
      <WatchContent {...props} />
    </Suspense>
  );
}





