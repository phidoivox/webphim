import { cacheLife, cacheTag } from "next/cache";
import { fetchJson } from "@/lib/api";
import type { CountryItem, GenreItem, HomeData, MovieDetail } from "@/types/movie";
import type { WeeklyScheduleResponse } from "@/types/schedule";

/**
 * Public cached GET — 'use cache' layer mới.
 * Không auth: cache key chỉ gồm args serializable (slug...), không rò data user.
 * fetch `next` opts bên trong là Data Cache layer cũ, giữ fallback khi revalidate.
 */

// Trang chủ: update khi MovieObserver bắn tags home/movies/schedule + movie-{slug}.
export async function getCachedHome(): Promise<HomeData> {
  "use cache";
  cacheLife("minutes");
  cacheTag("home", "movies");
  const { data: payload } = await fetchJson<{ data: HomeData }>("/v1/home", false, {
    tags: ["home", "movies"],
  });
  return payload.data;
}

// Chi tiết phim theo slug: tag riêng movie-{slug} cho on-demand invalidation.
export async function getCachedMovieDetail(slug: string): Promise<MovieDetail> {
  "use cache";
  cacheLife("minutes");
  cacheTag("movies", `movie-${slug}`);
  const { data: payload } = await fetchJson<{ data: MovieDetail }>(`/v1/movies/${slug}`, false, {
    tags: ["movies", `movie-${slug}`],
  });
  return payload.data;
}

// Taxonomy ít đổi: profile dài, invalidate qua tags genres/taxonomy.
export async function getCachedGenres(): Promise<GenreItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("genres", "taxonomy");
  const { data: payload } = await fetchJson<{ data: GenreItem[] }>("/v1/genres", false, {
    tags: ["genres", "taxonomy"],
  });
  return payload.data;
}

export async function getCachedCountries(): Promise<CountryItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("countries", "taxonomy");
  const { data: payload } = await fetchJson<{ data: CountryItem[] }>("/v1/countries", false, {
    tags: ["countries", "taxonomy"],
  });
  return payload.data;
}

// Lịch chiếu tuần: refresh 30p theo build output (/lich-chieu 30m 1y).
export async function getCachedWeeklySchedule(): Promise<WeeklyScheduleResponse> {
  "use cache";
  cacheLife("minutes");
  cacheTag("schedule", "movies");
  return fetchJson<WeeklyScheduleResponse>("/v1/schedule", false, {
    tags: ["schedule", "movies"],
    revalidate: 1800,
  }).then(({ data }) => data);
}
