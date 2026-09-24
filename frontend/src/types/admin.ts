export interface AdminKpis {
  totalMovies: number;
  activeMovies: number;
  totalEpisodes: number;
  totalUsers: number;
  totalViews: number;
  totalComments: number;
  pendingReports: number;
}

export interface AdminRecentMovie {
  id: number;
  name: string;
  slug: string;
  thumbUrl: string | null;
  posterUrl: string | null;
  type: string;
  status: string;
  quality: string;
  year: number | null;
  viewCount: number;
  isActive: boolean;
  episodeCount: number;
  createdAt: string;
}

export interface AdminRecentReport {
  id: number;
  reportType: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'rejected';
  movieName: string | null;
  episodeName: string | null;
  reporterName: string;
  createdAt: string;
}

export interface ViewsTimeseriesPoint {
  date: string;
  label: string;
  views: number;
}

export interface AdminDashboardData {
  kpis: AdminKpis;
  viewsTimeseries: ViewsTimeseriesPoint[];
  recentMovies: AdminRecentMovie[];
  recentReports: AdminRecentReport[];
  topViewedMovies: Array<{
    id: number;
    name: string;
    slug: string;
    thumbUrl?: string | null;
    thumb_url?: string | null;
    viewCount?: number;
    view_count?: number;
    ratingAvg?: string | number;
    rating_avg?: string | number;
  }>;
  activityLogs?: Array<{
    id: number;
    action: string;
    description: string;
    time: string;
  }>;
}

export type AdminBulkActionType =
  | 'is_active_on'
  | 'is_active_off'
  | 'is_featured_on'
  | 'is_featured_off'
  | 'is_cinema_on'
  | 'is_cinema_off'
  | 'activate'
  | 'deactivate'
  | 'feature'
  | 'unfeature'
  | 'cinema'
  | 'uncinema'
  | 'delete';

export interface AdminMovieMetaCounts {
  total: number;
  active: number;
  series: number;
  single: number;
  featured: number;
  cinema: number;
  hidden: number;
}

export interface AdminMovieListItem {
  id: number;
  name: string;
  originName: string | null;
  slug: string;
  thumbUrl: string | null;
  posterUrl: string | null;
  type: 'single' | 'series' | 'tv-show';
  status: 'ongoing' | 'completed' | 'trailer';
  quality: string;
  year: number | null;
  episodeCurrent: string | null;
  episodeTotal: string | null;
  viewCount: number;
  ratingAvg: number;
  isActive: boolean;
  isFeatured: boolean;
  isCinema: boolean;
  genres: Array<{ id: number; name: string }>;
  countries: Array<{ id: number; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEpisodeServer {
  id?: number;
  serverName: string;
  langType: string;
  linkM3u8: string | null;
  linkEmbed: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminEpisodeItem {
  id: number;
  movieId: number;
  name: string;
  slug: string;
  sortOrder: number;
  servers: AdminEpisodeServer[];
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminReportItem {
  id: number;
  reportType: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'rejected';
  adminNote: string | null;
  movie: { id: number; name: string; slug: string } | null;
  episode: { id: number; name: string; slug: string } | null;
  server: { id: number; serverName: string } | null;
  user: { id: number; name: string; email: string } | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminPaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  hasMore?: boolean;
  counts?: AdminMovieMetaCounts;
}

export interface AdminTaxonomyGenre {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  movies_count?: number;
}

export interface AdminTaxonomyCountry {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  movies_count?: number;
}

export interface AdminTaxonomyPerson {
  id: number;
  name: string;
  slug?: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  biography?: string | null;
}

export interface AdminMovieDetail extends AdminMovieListItem {
  content?: string | null;
  trailerUrl?: string | null;
  durationMinutes?: number | null;
  ageRating?: string | null;
  lang?: string | null;
  notifySchedule?: string | null;
  scheduleDays?: number[];
  episodes?: AdminEpisodeItem[];
  directors?: AdminTaxonomyPerson[];
  actors?: Array<AdminTaxonomyPerson & { characterName?: string; sortOrder?: number }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
}

export interface AdminMoviePayload {
  name: string;
  origin_name?: string | null;
  slug?: string;
  content?: string | null;
  type: 'single' | 'series' | 'tv-show';
  status: 'ongoing' | 'completed' | 'trailer';
  quality?: string;
  lang?: string;
  year?: number | null;
  duration_minutes?: number | null;
  is_cinema?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  thumb_url?: string | null;
  poster_url?: string | null;
  trailer_url?: string | null;
  genre_ids?: number[];
  country_ids?: number[];
  tag_ids?: number[];
  [key: string]: unknown;
}

export interface AdminEpisodePayload {
  name: string;
  slug: string;
  sort_order?: number;
  movie_id?: number;
  [key: string]: unknown;
}

export interface AdminEpisodeServerPayload {
  server_name: string;
  lang_type: string;
  link_m3u8?: string | null;
  link_embed?: string | null;
  sort_order?: number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface AdminUserPayload {
  name?: string;
  email?: string;
  role?: 'admin' | 'moderator' | 'user';
  is_active?: boolean;
  [key: string]: unknown;
}

export interface AdminReportPayload {
  status?: 'pending' | 'resolved' | 'rejected';
  admin_note?: string | null;
  [key: string]: unknown;
}

export interface AdminTaxonomyPayload {
  name: string;
  slug?: string;
  description?: string | null;
  [key: string]: unknown;
}

