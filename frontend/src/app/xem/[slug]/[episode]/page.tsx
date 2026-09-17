import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { NotFoundError } from "@/lib/api";
import { getCachedMovieDetail } from "@/lib/cached-content";
import WatchViewClient from "./WatchViewClient";
import PlayerSkeleton from "@/components/ui/skeletons/PlayerSkeleton";

interface PageProps {
  params: Promise<{ slug: string; episode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, episode } = await params;

  try {
    const movie = await getCachedMovieDetail(slug);
    const numMatch = episode.match(/\d+/);
    const ep =
      movie.episodes?.find((e) => e.slug === episode) ??
      (numMatch
        ? movie.episodes?.find((e) => {
            const eNum = e.slug.match(/\d+/);
            return eNum && parseInt(eNum[0], 10) === parseInt(numMatch[0], 10);
          })
        : null) ??
      movie.episodes?.[0];
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
    movie = await getCachedMovieDetail(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  // Tự động chuyển hướng nếu slug tập không khớp chính xác nhưng có thể giải quyết được
  const currentEp = movie.episodes?.find((e) => e.slug === episode);
  if (!currentEp && movie.episodes && movie.episodes.length > 0) {
    // 1. Khớp số tập (vd: tap-1 <-> tap-01)
    const numMatch = episode.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      const matched = movie.episodes.find((e) => {
        const eNum = e.slug.match(/\d+/);
        return eNum && parseInt(eNum[0], 10) === num;
      });
      if (matched) {
        redirect(`/xem/${slug}/${matched.slug}`);
      }
    }

    // 2. Phim lẻ hoặc fallback tập mặc định nếu truyền 'tap-1', 'full', 'tap-full'
    if (episode === "tap-1" || episode === "full" || episode === "tap-full") {
      redirect(`/xem/${slug}/${movie.episodes[0].slug}`);
    }

    // 3. Nếu tập hoàn toàn không tồn tại trong danh sách
    notFound();
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
    <Suspense fallback={<PlayerSkeleton />}>
      <WatchContent {...props} />
    </Suspense>
  );
}





