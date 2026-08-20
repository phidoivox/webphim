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
    thumb_url: string | null;
    view_count: number;
    rating_avg: string | number;
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
