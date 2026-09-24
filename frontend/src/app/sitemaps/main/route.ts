import { getCachedCountries, getCachedGenres } from "@/lib/cached-content";
import { getSiteUrl } from "@/lib/env";
import { GENRES } from "@/data/genres";
import { COUNTRIES } from "@/data/countries";

export async function GET() {
  const base = getSiteUrl();

  const [genresRes, countriesRes] = await Promise.all([
    getCachedGenres().catch(() => []),
    getCachedCountries().catch(() => []),
  ]);

  const genresList = Array.isArray(genresRes) && genresRes.length > 0 ? genresRes : GENRES;
  const countriesList = Array.isArray(countriesRes) && countriesRes.length > 0 ? countriesRes : COUNTRIES;

  const staticUrls = [
    { loc: `${base}`, priority: "1.0", changefreq: "always" },
    { loc: `${base}/danh-sach/phim-bo`, priority: "0.8", changefreq: "daily" },
    { loc: `${base}/danh-sach/phim-le`, priority: "0.8", changefreq: "daily" },
    { loc: `${base}/danh-sach/tv-shows`, priority: "0.8", changefreq: "daily" },
    { loc: `${base}/tim-kiem`, priority: "0.6", changefreq: "weekly" },
  ];

  const genreUrls = genresList.map((g) => ({
    loc: `${base}/the-loai/${g.slug}`,
    priority: "0.7",
    changefreq: "weekly",
  }));

  const countryUrls = countriesList.map((c) => ({
    loc: `${base}/quoc-gia/${c.slug}`,
    priority: "0.7",
    changefreq: "weekly",
  }));

  const allUrls = [...staticUrls, ...genreUrls, ...countryUrls];

  const urlEntries = allUrls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
