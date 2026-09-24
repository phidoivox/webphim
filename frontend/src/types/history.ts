export interface WatchHistoryMovie {
  id: number;
  name: string;
  originName?: string | null;
  slug: string;
  thumbUrl?: string | null;
  posterUrl?: string | null;
  quality?: string | null;
  year?: number | null;
  type?: string | null;
  episodeCurrent?: string | null;
  episodeTotal?: string | null;
}

export interface WatchHistoryEpisode {
  id: number;
  name: string;
  slug: string;
  serverName?: string | null;
}

export interface WatchHistoryItem {
  id: number;
  movieId: number;
  episodeId?: number | null;
  serverId?: number | null;
  progressSeconds: number;
  durationSeconds?: number | null;
  progressPercent: number;
  isCompleted: boolean;
  watchedAt: string;
  movie?: WatchHistoryMovie;
  episode?: WatchHistoryEpisode | null;
}

export interface HistorySyncPayload {
  movie_id: number;
  episode_id?: number | null;
  server_id?: number | null;
  progress_seconds: number;
  duration_seconds?: number | null;
}

export interface GuestHistoryItem {
  movie_id: number;
  movie_name: string;
  movie_slug: string;
  poster_url?: string | null;
  episode_id?: number | null;
  episode_name?: string | null;
  episode_slug?: string | null;
  server_id?: number | null;
  progress_seconds: number;
  duration_seconds?: number | null;
  progress_percent: number;
  is_completed: boolean;
  watched_at: string;
}

export interface HistoryPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface HistoryListResponseData {
  items: WatchHistoryItem[];
  pagination: HistoryPagination;
}

export interface HistoryApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data: T;
}
