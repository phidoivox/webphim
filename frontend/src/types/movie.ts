/** Shape dữ liệu phim — khớp với API Laravel `/api/v1/movies`. */
export interface HomeData {
  heroMovies: HeroMovie[];
  sections: CarouselSection[];
}
export interface MovieSummary {
  id: number;
  slug: string;
  name: string;
  originName: string | null;
  thumbUrl: string;
  posterUrl: string;
  year: number | null;
  quality: string | null; // "HD" | "FHD" | "CAM" | ...
  type: "series" | "single" | "tv-show" | string;
  episodeCurrent: string | null; // "12/20" hoặc null với phim lẻ
  episodeTotal: string | null;
  isNew: boolean;
  isHot: boolean;
  ratingAvg: number;
  genres: string[];
}

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface FilterParams {
  q?: string;
  type?: string;
  genre?: string;
  country?: string;
  lang?: string;
  year?: number | string;
  sort?: "latest" | "updated" | "views" | "rating" | "year" | string;
  page?: number | string;
  per_page?: number | string;
}

export interface GenreItem {
  id: number;
  name: string;
  slug: string;
  moviesCount?: number;
}

export interface CountryItem {
  id: number;
  name: string;
  slug: string;
}

export interface HeroMovie {
  id: number;
  slug: string;
  name: string;
  originName: string | null;
  thumbUrl: string;
  posterUrl: string;
  backdropUrl?: string;
  year: number | null;
  quality: string | null;
  genres: string[];
  description: string;
  trailerUrl: string | null;
  episodeLabel: string; // "Tập 1-12" | "Full" | ...
  ratingAvg?: number;
  imdbRating?: number | string;
  firstEpisodeSlug?: string;
}

export interface CarouselSection {
  id: string;
  title: string;
  movies: MovieSummary[];
}

export interface EpisodeServer {
  id: number;
  serverName: string;
  langType: string;
  linkM3u8: string | null;
  linkEmbed?: string | null;
}

export interface MovieEpisode {
  id: number;
  name: string;
  slug: string;
  servers: EpisodeServer[];
}

export interface ActorSummary {
  id: number;
  slug: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  knownFor: string;
}

export interface SearchSuggestionResult {
  movies: MovieSummary[];
  actors: ActorSummary[];
}

export interface Credit {
  id: number;
  name: string;
  avatarUrl: string | null;
  characterName?: string | null;
}

export interface GalleryItem {
  id: number;
  mediaType: "image" | "video";
  type: "trailer" | "teaser" | "still" | "backdrop" | "behind_the_scenes" | "poster" | string;
  url: string;
  thumbUrl?: string | null;
  caption?: string | null;
  durationSeconds?: number | null;
}

export interface TagItem {
  id: number;
  name: string;
  slug: string;
}

export interface MovieDetail {
  id: number;
  slug: string;
  name: string;
  originName: string | null;
  thumbUrl: string;
  posterUrl: string;
  content: string | null;
  year: number | null;
  quality: string | null;
  type: string;
  status: string;
  episodeCurrent: string | null;
  episodeTotal: string | null;
  notifySchedule?: string | null;
  scheduleDays?: number[];
  ratingAvg: number;
  imdbRating?: number | string | null;
  ratingCount: number;
  viewCount: number;
  isCinema: boolean;
  isNew: boolean;
  isHot: boolean;
  trailerUrl: string | null;
  lang: string | null;
  durationMinutes: number | null;
  genres: string[];
  countries: string[];
  tags?: TagItem[] | string[];
  episodes: MovieEpisode[];
  credits: { directors: Credit[]; actors: Credit[] };
  gallery: GalleryItem[];
  similar: MovieSummary[];
}
