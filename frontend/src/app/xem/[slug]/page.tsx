import { notFound, redirect } from "next/navigation";
import { NotFoundError } from "@/lib/api";
import { getCachedMovieDetail } from "@/lib/cached-content";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WatchSlugRedirectPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) {
      value.forEach((v) => queryParams.append(key, v));
    } else if (value !== undefined) {
      queryParams.set(key, value);
    }
  }
  const queryString = queryParams.toString();
  const querySuffix = queryString ? `?${queryString}` : "";

  let movie;
  try {
    movie = await getCachedMovieDetail(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  const firstEpisode = movie.episodes?.[0];
  if (!firstEpisode) {
    redirect(`/phim/${slug}${querySuffix}`);
  }

  redirect(`/xem/${slug}/${firstEpisode.slug}${querySuffix}`);
}
