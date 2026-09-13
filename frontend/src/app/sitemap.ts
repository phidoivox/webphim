import type { MetadataRoute } from "next";
import { getFilteredMovies } from "@/lib/api";
import { getCachedCountries, getCachedGenres } from "@/lib/cached-content";
import { getSiteUrl } from "@/lib/env";
import { GENRES } from "@/data/genres";
import { COUNTRIES } from "@/data/countries";

const BASE_URL = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [genresRes, countriesRes, moviesResult] = await Promise.all([
    getCachedGenres().catch(() => []),
    getCachedCountries().catch(() => []),
    getFilteredMovies({ per_page: 1 }).catch(() => null),
  ]);

  const genresList = Array.isArray(genresRes) && genresRes.length > 0 ? genresRes : GENRES;
  const countriesList = Array.isArray(countriesRes) && countriesRes.length > 0 ? countriesRes : COUNTRIES;

  const moviePages = Math.max(1, Math.ceil((moviesResult?.meta?.total ?? 0) / 1000));
  const xmlIndex: MetadataRoute.Sitemap = [...Array(moviePages)].map((_, i) => ({
    url: `${BASE_URL}/sitemap/movies/${i + 1}`,
    lastModified: new Date(),
  }));

  const genreUrls: MetadataRoute.Sitemap = genresList.map((g) => ({
    url: `${BASE_URL}/the-loai/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const countryUrls: MetadataRoute.Sitemap = countriesList.map((c) => ({
    url: `${BASE_URL}/quoc-gia/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "always", priority: 1.0 },
    { url: `${BASE_URL}/danh-sach/phim-bo`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/danh-sach/phim-le`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/danh-sach/tv-shows`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/tim-kiem`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  return [...staticUrls, ...xmlIndex, ...genreUrls, ...countryUrls];
}
