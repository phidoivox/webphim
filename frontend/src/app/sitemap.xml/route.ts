import { getFilteredMovies } from "@/lib/api";
import { getSiteUrl } from "@/lib/env";

export async function GET() {
  const base = getSiteUrl();

  const moviesResult = await getFilteredMovies({ per_page: 1 }).catch(() => null);
  const total = moviesResult?.meta?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 1000));

  const movieSitemaps = Array.from({ length: pages }, (_, i) => `  <sitemap><loc>${base}/sitemaps/movies/${i + 1}</loc></sitemap>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${base}/sitemaps/main</loc></sitemap>
${movieSitemaps}
</sitemapindex>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
