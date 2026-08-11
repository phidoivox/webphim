/** Shape dữ liệu phim — khớp với API Laravel `/api/v1/movies` tương lai. */
export interface MovieSummary {
  id: number;
  slug: string;
  name: string;
  originName: string | null;
  thumbUrl: string;
  posterUrl: string;
  year: number | null;
  quality: string | null; // "HD" | "FHD" | "CAM" | ...
  type: "series" | "single" | "tv-show";
  episodeCurrent: string | null; // "12/20" hoặc null với phim lẻ
  episodeTotal: string | null;
  isNew: boolean;
  isHot: boolean;
  ratingAvg: number;
  genres: string[];
}

export interface HeroMovie {
  id: number;
  slug: string;
  name: string;
  originName: string | null;
  posterUrl: string;
  backdropUrl: string;
  year: number | null;
  quality: string | null;
  genres: string[];
  description: string;
  trailerUrl: string | null;
  episodeLabel: string; // "Tập 1-12" | "Full" | ...
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
}

export interface MovieEpisode {
  id: number;
  name: string;
  slug: string;
  servers: EpisodeServer[];
}

export interface Credit {
  id: number;
  name: string;
  avatarUrl: string | null;
  characterName?: string | null;
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
  ratingAvg: number;
  ratingCount: number;
  viewCount: number;
  isCinema: boolean;
  isNew: boolean;
  isHot: boolean;
  trailerUrl: string | null;
  durationMinutes: number | null;
  genres: string[];
  countries: string[];
  episodes: MovieEpisode[];
  credits: { directors: Credit[]; actors: Credit[] };
  similar: MovieSummary[];
}
