import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, getPublicCollectionApi } from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";
import ShareButton from "./ShareButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const c = await getPublicCollectionApi(slug);
    const title = `${c.name} — Bộ sưu tập phim | WebPhim`;
    const description = c.description || `Tuyển tập ${c.moviesCount} phim trong bộ sưu tập "${c.name}".`;
    const images = c.thumbUrl ? [{ url: c.thumbUrl, width: 800, height: 1200, alt: c.name }] : undefined;
    return {
      title,
      description,
      openGraph: { title, description, type: "website", images },
      twitter: { card: "summary_large_image", title, description, images: c.thumbUrl ? [c.thumbUrl] : undefined },
    };
  } catch {
    return { title: "Không tìm thấy bộ sưu tập | WebPhim" };
  }
}

export default async function PublicCollectionPage({ params }: PageProps) {
  const { slug } = await params;

  let collection;
  try {
    collection = await getPublicCollectionApi(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-44 w-32 shrink-0 overflow-hidden rounded-xl bg-white/10">
            {collection.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={collection.thumbUrl} alt={collection.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl">🎬</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">{collection.name}</h1>
            {collection.description && <p className="mt-2 text-sm text-white/60">{collection.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
              <span className="font-semibold text-white/70">{collection.moviesCount} phim</span>
              {collection.creator && (
                <>
                  <span>·</span>
                  <span>Tác giả:</span>
                  <Link href={`/u/${collection.creator.id}`} className="font-bold text-accent hover:underline">
                    {collection.creator.name}
                  </Link>
                </>
              )}
            </div>
            <div className="mt-4">
              <ShareButton slug={collection.slug} name={collection.name} />
            </div>
          </div>
        </div>
      </header>

      {collection.movies.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/50">
          Bộ sưu tập này chưa có phim nào.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {collection.movies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </div>
  );
}
