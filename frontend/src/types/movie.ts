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
