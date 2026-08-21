import type {
  CarouselSection,
  CountryItem,
  FilterParams,
  GenreItem,
  HeroMovie,
  MovieDetail,
  MovieSummary,
  PaginatedResponse,
  SearchSuggestionResult,
} from "@/types/movie";
import type {
  AuthApiResponse,
  AuthResponseData,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/types/auth";
import type {
  GuestHistoryItem,
  HistoryApiResponse,
  HistoryListResponseData,
  HistorySyncPayload,
  WatchHistoryItem,
} from "@/types/history";
import type {
  BookmarkCheckResult,
  BookmarkItem,
  BookmarkToggleResult,
  BookmarkType,
} from "@/types/bookmark";
import type {
  CommentItem,
  CommentListResponse,
  PostCommentPayload,
  ToggleCommentLikeResponse,
  UpdateCommentPayload,
} from "@/types/comment";
import type {
  BroadcastNotificationPayload,
  BroadcastNotificationResponse,
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/notification";
import type {
  ScheduleMovieItem,
  WeeklyScheduleData,
  WeeklyScheduleResponse,
} from "@/types/schedule";

export interface HomeData {
  heroMovies: HeroMovie[];
  sections: CarouselSection[];
}

/** Fail hết các base URL — không kết nối được backend. */
export class ApiError extends Error {
  public errors?: Record<string, string[]>;
  public status?: number;

  constructor(message: string, options?: { cause?: unknown; errors?: Record<string, string[]>; status?: number }) {
    super(message, { cause: options?.cause });
    this.errors = options?.errors;
    this.status = options?.status;
  }
}

/** Backend trả 404 — slug không tồn tại. */
export class NotFoundError extends Error {}

const POSSIBLE_API_URLS = [
  process.env.NEXT_PUBLIC_API_URL || "http://webphim.test/api",
  "http://localhost/webphim/public/api",
  "http://127.0.0.1:8000/api",
  "http://localhost:8000/api",
];

// Lưu lại base URL hoạt động thành công để tối ưu tốc độ cho các request sau
let cachedWorkingBaseUrl: string | null = null;

// Client-side in-memory cache với timestamp
const clientMemoryCache = new Map<string, { timestamp: number; data: unknown }>();
const CLIENT_CACHE_TTL_MS = 60 * 1000; // 1 phút client cache

export interface ApiResult<T> {
  baseUrl: string;
  data: T;
}

/** Gửi request HTTP (GET, POST, v.v.) qua các base URL khả dụng */
export async function sendRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    headers?: Record<string, string>;
    revalidate?: number | false;
    tags?: string[];
  } = {}
): Promise<T> {
  const method = options.method || "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  const body = options.body ? JSON.stringify(options.body) : undefined;
  let lastError: unknown = null;
  let validationErrors: Record<string, string[]> | undefined = undefined;
  let customErrorMessage: string | null = null;
  let responseStatus = 0;

  const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    method,
    headers,
    body,
  };

  if (method === "GET") {
    const nextConfig: { revalidate?: number | false; tags?: string[] } = {};
    if (options.revalidate !== undefined) {
      nextConfig.revalidate = options.revalidate;
    }
    if (options.tags && options.tags.length > 0) {
      nextConfig.tags = options.tags;
    }
    if (Object.keys(nextConfig).length > 0) {
      fetchOptions.next = nextConfig;
    }
  }

  const urlsToTry = cachedWorkingBaseUrl
    ? [cachedWorkingBaseUrl, ...POSSIBLE_API_URLS.filter((u) => u !== cachedWorkingBaseUrl)]
    : POSSIBLE_API_URLS;

  for (const base of urlsToTry) {
    try {
      const res = await fetch(`${base}${path}`, fetchOptions);

      responseStatus = res.status;

      if (res.ok) {
        cachedWorkingBaseUrl = base;
        return (await res.json()) as T;
      }

      // Xử lý các mã lỗi HTTP có payload JSON
      try {
        const errorData = (await res.json()) as { message?: string; errors?: Record<string, string[]> };
        customErrorMessage = errorData.message || null;
        validationErrors = errorData.errors;
      } catch {
        customErrorMessage = null;
      }

      if (res.status === 404) {
        throw new NotFoundError(customErrorMessage || "Không tìm thấy dữ liệu yêu cầu.");
      }

      if (res.status === 422 || res.status === 401 || res.status === 403 || res.status === 429) {
        // Lỗi client / validation / unauthorized từ backend: ném ra ngay lập tức
        throw new ApiError(customErrorMessage || `Yêu cầu không hợp lệ (HTTP ${res.status})`, {
          status: res.status,
          errors: validationErrors,
        });
      }

      if (res.status >= 500) {
        if (customErrorMessage) {
          throw new ApiError(customErrorMessage, { status: res.status });
        }
        lastError = new Error(`Lỗi máy chủ nội bộ (HTTP ${res.status})`);
      }
    } catch (err) {
      if (err instanceof ApiError || err instanceof NotFoundError) {
        throw err;
      }
      lastError = err;
    }
  }

  throw new ApiError(
    customErrorMessage ||
      "Không thể kết nối đến Backend Laravel qua các địa chỉ (webphim.test, localhost/webphim/public, 127.0.0.1:8000). Vui lòng kiểm tra backend server.",
    { cause: lastError, status: responseStatus, errors: validationErrors }
  );
}

/** Thử base URL đã biết hoặc lần lượt các base URL, trả kết quả của base 200 đầu tiên (có client caching). */
export async function fetchJson<T>(
  path: string,
  bypassCache = false,
  fetchOptions: { tags?: string[]; revalidate?: number | false } = {}
): Promise<ApiResult<T>> {
  const cacheKey = path;
  const isClient = typeof window !== "undefined";

  if (isClient && !bypassCache && clientMemoryCache.has(cacheKey)) {
    const cached = clientMemoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
      return { baseUrl: cachedWorkingBaseUrl || POSSIBLE_API_URLS[0], data: cached.data as T };
    }
  }

  const data = await sendRequest<T>(path, { method: "GET", ...fetchOptions });
  if (isClient) {
    clientMemoryCache.set(cacheKey, { timestamp: Date.now(), data });
  }
  return { baseUrl: cachedWorkingBaseUrl || POSSIBLE_API_URLS[0], data };
}


// =================== AUTHENTICATION APIS ===================

/** Đăng ký tài khoản */
export async function registerApi(payload: RegisterPayload): Promise<AuthResponseData> {
  const res = await sendRequest<AuthApiResponse>("/v1/auth/register", {
    method: "POST",
    body: payload,
  });
  return res.data;
}

/** Đăng nhập */
export async function loginApi(payload: LoginPayload): Promise<AuthResponseData> {
  const res = await sendRequest<AuthApiResponse>("/v1/auth/login", {
    method: "POST",
    body: payload,
  });
  return res.data;
}

/** Lấy thông tin user hiện tại qua Token */
export async function getMeApi(token: string): Promise<AuthUser> {
  const res = await sendRequest<{ status: string; data: AuthUser }>("/v1/auth/me", {
    method: "GET",
    token,
  });
  return res.data;
}

/** Đăng xuất */
export async function logoutApi(token: string): Promise<void> {
  await sendRequest<{ status: string; message: string }>("/v1/auth/logout", {
    method: "POST",
    token,
  });
}

// =================== MOVIE & CONTENT APIS ===================

export async function getHomeData(bypassCache = false): Promise<HomeData> {
  const { data: payload } = await fetchJson<{ data: HomeData }>("/v1/home", bypassCache, {
    tags: ["home", "movies"],
  });
  return payload.data;
}

export async function getMovieDetail(slug: string, bypassCache = false): Promise<MovieDetail> {
  const { data: payload } = await fetchJson<{ data: MovieDetail }>(`/v1/movies/${slug}`, bypassCache, {
    tags: ["movies", `movie-${slug}`],
  });
  return payload.data;
}

export async function getGenres(bypassCache = false): Promise<GenreItem[]> {
  const { data: payload } = await fetchJson<{ data: GenreItem[] }>("/v1/genres", bypassCache, {
    tags: ["genres", "taxonomy"],
  });
  return payload.data;
}

export async function getCountries(bypassCache = false): Promise<CountryItem[]> {
  const { data: payload } = await fetchJson<{ data: CountryItem[] }>("/v1/countries", bypassCache, {
    tags: ["countries", "taxonomy"],
  });
  return payload.data;
}

export async function getFilteredMovies(
  params: FilterParams = {},
  bypassCache = false
): Promise<PaginatedResponse<MovieSummary>> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.type) query.set("type", params.type);
  if (params.genre) query.set("genre", params.genre);
  if (params.country) query.set("country", params.country);
  if (params.lang) query.set("lang", params.lang);
  if (params.year) query.set("year", String(params.year));
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));

  const qs = query.toString();
  const path = `/v1/movies${qs ? `?${qs}` : ""}`;
  const { data: payload } = await fetchJson<PaginatedResponse<MovieSummary>>(path, bypassCache);
  return payload;
}

export async function searchLiveSuggestions(
  keyword: string,
  limit = 5,
  bypassCache = false
): Promise<SearchSuggestionResult> {
  const trimmed = keyword.trim();
  if (!trimmed) return { movies: [], actors: [] };
  const path = `/v1/movies/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const { data: payload } = await fetchJson<{ data: SearchSuggestionResult }>(path, bypassCache);
  return payload.data;
}

export async function searchMovies(
  keyword: string,
  limit = 10,
  bypassCache = false
): Promise<MovieSummary[]> {
  const res = await searchLiveSuggestions(keyword, limit, bypassCache);
  return res.movies;
}

/** Xóa client cache theo path hoặc toàn bộ */
export function clearClientCache(path?: string): void {
  if (path) {
    clientMemoryCache.delete(path);
  } else {
    clientMemoryCache.clear();
  }
}

/** Đồng bộ tiến trình xem phim lên máy chủ (Cloud Sync) */
export async function syncHistoryApi(
  payload: HistorySyncPayload,
  token?: string | null
): Promise<HistoryApiResponse<WatchHistoryItem>> {
  return sendRequest<HistoryApiResponse<WatchHistoryItem>>("/v1/history/sync", {
    method: "POST",
    body: payload,
    token,
  });
}

/** Lấy danh sách lịch sử xem phim của người dùng */
export async function getHistoryListApi(
  params?: { page?: number; per_page?: number; filter?: string },
  token?: string | null
): Promise<HistoryApiResponse<HistoryListResponseData>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.filter) query.set("filter", params.filter);

  const qs = query.toString();
  return sendRequest<HistoryApiResponse<HistoryListResponseData>>(
    `/v1/history${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      token,
    }
  );
}

/** Lấy tiến trình xem gần nhất của một bộ phim */
export async function getMovieHistoryApi(
  movieId: number,
  token?: string | null
): Promise<HistoryApiResponse<WatchHistoryItem | null>> {
  return sendRequest<HistoryApiResponse<WatchHistoryItem | null>>(
    `/v1/history/movie/${movieId}`,
    {
      method: "GET",
      token,
    }
  );
}

/** Xóa 1 mục khỏi lịch sử xem */
export async function deleteHistoryItemApi(
  historyId: number,
  token?: string | null
): Promise<{ status: string; message: string }> {
  return sendRequest<{ status: string; message: string }>(
    `/v1/history/${historyId}`,
    {
      method: "DELETE",
      token,
    }
  );
}

/** Xóa toàn bộ lịch sử xem phim */
export async function clearAllHistoryApi(
  token?: string | null
): Promise<{ status: string; message: string }> {
  return sendRequest<{ status: string; message: string }>("/v1/history", {
    method: "DELETE",
    token,
  });
}

/** Gộp lịch sử xem từ thiết bị khách vào tài khoản */
export async function mergeGuestHistoryApi(
  items: GuestHistoryItem[],
  token?: string | null
): Promise<{ status: string; message: string }> {
  return sendRequest<{ status: string; message: string }>("/v1/history/merge", {
    method: "POST",
    body: { items },
    token,
  });
}

// =================== TỦ PHIM (BOOKMARKS & FAVORITES) ===================

/** Toggle lưu/bỏ lưu phim vào tủ phim */
export async function toggleBookmarkApi(
  payload: { movie_id: number; type?: BookmarkType },
  token?: string | null
): Promise<{ status: string; message: string; data: BookmarkToggleResult }> {
  return sendRequest<{ status: string; message: string; data: BookmarkToggleResult }>(
    "/v1/bookmarks/toggle",
    {
      method: "POST",
      body: payload,
      token,
    }
  );
}

/** Lấy danh sách tủ phim của người dùng có phân trang, lọc và tìm kiếm */
export async function getBookmarksListApi(
  params?: {
    type?: BookmarkType;
    q?: string;
    sort?: "latest" | "oldest" | "rating" | "year";
    page?: number;
    per_page?: number;
  },
  token?: string | null
): Promise<{
  status: string;
  data: BookmarkItem[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}> {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.q) query.set("q", params.q);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));

  const qs = query.toString();
  return sendRequest<{
    status: string;
    data: BookmarkItem[];
    meta: { currentPage: number; lastPage: number; perPage: number; total: number };
  }>(`/v1/bookmarks${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token,
  });
}

/** Kiểm tra trạng thái đã lưu phim trong tủ hay chưa */
export async function checkBookmarkStatusApi(
  movieId: number,
  type?: BookmarkType,
  token?: string | null
): Promise<{ status: string; data: BookmarkCheckResult }> {
  const qs = type ? `?type=${type}` : "";
  return sendRequest<{ status: string; data: BookmarkCheckResult }>(
    `/v1/bookmarks/check/${movieId}${qs}`,
    {
      method: "GET",
      token,
    }
  );
}

/** Xóa 1 phim khỏi tủ phim */
export async function deleteBookmarkItemApi(
  bookmarkId: number,
  token?: string | null
): Promise<{ status: string; message: string }> {
  return sendRequest<{ status: string; message: string }>(
    `/v1/bookmarks/${bookmarkId}`,
    {
      method: "DELETE",
      token,
    }
  );
}

/** Xóa toàn bộ tủ phim */
export async function clearAllBookmarksApi(
  type?: BookmarkType,
  token?: string | null
): Promise<{ status: string; message: string; deletedCount: number }> {
  const qs = type ? `?type=${type}` : "";
  return sendRequest<{ status: string; message: string; deletedCount: number }>(
    `/v1/bookmarks${qs}`,
    {
      method: "DELETE",
      token,
    }
  );
}

/** Gộp tủ phim từ thiết bị khách vào tài khoản */
export async function mergeGuestBookmarksApi(
  items: Array<{ movie_id: number; type?: BookmarkType }>,
  token?: string | null
): Promise<{ status: string; message: string; mergedCount: number }> {
  return sendRequest<{ status: string; message: string; mergedCount: number }>(
    "/v1/bookmarks/merge",
    {
      method: "POST",
      body: { items },
      token,
    }
  );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN MANAGEMENT API METHODS
───────────────────────────────────────────────────────────── */

import type {
  AdminBulkActionType,
  AdminDashboardData,
  AdminEpisodeItem,
  AdminMovieListItem,
  AdminMovieMetaCounts,
  AdminReportItem,
  AdminUserItem,
  ViewsTimeseriesPoint,
} from "@/types/admin";

export async function getAdminDashboardStatsApi(token?: string | null): Promise<AdminDashboardData> {
  const res = await sendRequest<{ status: string; data: AdminDashboardData }>("/v1/admin/dashboard/stats", {
    token,
  });
  return res.data;
}

export async function getAdminMoviesApi(
  params: Record<string, string | number | boolean | undefined> = {},
  token?: string | null
): Promise<{ data: AdminMovieListItem[]; meta: { currentPage: number; lastPage: number; perPage: number; total: number; counts?: AdminMovieMetaCounts } }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "") query.set(key, String(val));
  });
  const qs = query.toString() ? `?${query.toString()}` : "";
  return sendRequest<{ data: AdminMovieListItem[]; meta: any }>(`/v1/admin/movies${qs}`, {
    token,
  });
}

export async function getAdminMovieDetailApi(id: number | string, token?: string | null): Promise<any> {
  const res = await sendRequest<{ status: string; data: any }>(`/v1/admin/movies/${id}`, {
    token,
  });
  return res.data;
}

export async function createAdminMovieApi(payload: any, token?: string | null): Promise<any> {
  return sendRequest<{ status: string; message: string; data: any }>("/v1/admin/movies", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateAdminMovieApi(id: number | string, payload: any, token?: string | null): Promise<any> {
  return sendRequest<{ status: string; message: string; data: any }>(`/v1/admin/movies/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function deleteAdminMovieApi(id: number | string, token?: string | null): Promise<any> {
  return sendRequest<{ status: string; message: string }>(`/v1/admin/movies/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function toggleAdminMovieApi(id: number | string, field: 'is_active' | 'is_featured' | 'is_cinema', token?: string | null): Promise<any> {
  return sendRequest<{ status: string; message: string; data: any }>(`/v1/admin/movies/${id}/toggle`, {
    method: "PATCH",
    body: { field },
    token,
  });
}

export async function bulkAdminMoviesApi(
  payload: { action: AdminBulkActionType; ids: number[] },
  token?: string | null
): Promise<{ status: string; message: string; affected: number }> {
  return sendRequest<{ status: string; message: string; affected: number }>("/v1/admin/movies/bulk-action", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function getAdminEpisodesApi(movieId: number | string, token?: string | null): Promise<{ movie: any; episodes: AdminEpisodeItem[] }> {
  const res = await sendRequest<{ status: string; data: { movie: any; episodes: AdminEpisodeItem[] } }>(
    `/v1/admin/movies/${movieId}/episodes`,
    { token }
  );
  return res.data;
}

export async function createAdminEpisodeApi(movieId: number | string, payload: any, token?: string | null): Promise<any> {
  return sendRequest<{ status: string; message: string; data: any }>(`/v1/admin/movies/${movieId}/episodes`, {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateAdminEpisodeApi(id: number | string, payload: any, token?: string | null): Promise<any> {
  return sendRequest<{ status: string; message: string; data: any }>(`/v1/admin/episodes/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function deleteAdminEpisodeApi(id: number | string, token?: string | null): Promise<any> {
  return sendRequest<{ status: string; message: string }>(`/v1/admin/episodes/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function getAdminTaxonomyGenresApi(token?: string | null): Promise<any[]> {
  const res = await sendRequest<{ status: string; data: any[] }>("/v1/admin/genres", { token });
  return res.data;
}

export async function createAdminTaxonomyGenreApi(payload: any, token?: string | null): Promise<any> {
  return sendRequest("/v1/admin/genres", { method: "POST", body: payload, token });
}

export async function updateAdminTaxonomyGenreApi(id: number, payload: any, token?: string | null): Promise<any> {
  return sendRequest(`/v1/admin/genres/${id}`, { method: "PUT", body: payload, token });
}

export async function deleteAdminTaxonomyGenreApi(id: number, token?: string | null): Promise<any> {
  return sendRequest(`/v1/admin/genres/${id}`, { method: "DELETE", token });
}

export async function getAdminTaxonomyCountriesApi(token?: string | null): Promise<any[]> {
  const res = await sendRequest<{ status: string; data: any[] }>("/v1/admin/countries", { token });
  return res.data;
}

export async function createAdminTaxonomyCountryApi(payload: any, token?: string | null): Promise<any> {
  return sendRequest("/v1/admin/countries", { method: "POST", body: payload, token });
}

export async function updateAdminTaxonomyCountryApi(id: number, payload: any, token?: string | null): Promise<any> {
  return sendRequest(`/v1/admin/countries/${id}`, { method: "PUT", body: payload, token });
}

export async function deleteAdminTaxonomyCountryApi(id: number, token?: string | null): Promise<any> {
  return sendRequest(`/v1/admin/countries/${id}`, { method: "DELETE", token });
}

export async function getAdminUsersApi(
  params: Record<string, string | number | undefined> = {},
  token?: string | null
): Promise<{ data: AdminUserItem[]; meta: any }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "") query.set(key, String(val));
  });
  const qs = query.toString() ? `?${query.toString()}` : "";
  return sendRequest(`/v1/admin/users${qs}`, { token });
}

export async function updateAdminUserApi(id: number, payload: any, token?: string | null): Promise<any> {
  return sendRequest(`/v1/admin/users/${id}`, { method: "PUT", body: payload, token });
}

export async function deleteAdminUserApi(id: number, token?: string | null): Promise<any> {
  return sendRequest(`/v1/admin/users/${id}`, { method: "DELETE", token });
}

export async function getAdminReportsApi(
  params: Record<string, string | undefined> = {},
  token?: string | null
): Promise<{ data: AdminReportItem[]; meta: any }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "") query.set(key, String(val));
  });
  const qs = query.toString() ? `?${query.toString()}` : "";
  return sendRequest(`/v1/admin/reports${qs}`, { token });
}

export async function updateAdminReportApi(id: number, payload: any, token?: string | null): Promise<any> {
  return sendRequest(`/v1/admin/reports/${id}`, { method: "PUT", body: payload, token });
}

export async function deleteAdminReportApi(id: number, token?: string | null): Promise<any> {
  return sendRequest(`/v1/admin/reports/${id}`, { method: "DELETE", token });
}

// =================== COMMENT & DISCUSSION APIS ===================

/** Lấy danh sách bình luận gốc của phim kèm replies lồng nhau */
export async function getMovieCommentsApi(
  movieIdOrSlug: string | number,
  params?: { sort?: string; page?: number; per_page?: number },
  token?: string | null
): Promise<CommentListResponse> {
  const query = new URLSearchParams();
  if (params?.sort) query.set("sort", params.sort);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));

  const qs = query.toString() ? `?${query.toString()}` : "";
  return sendRequest<CommentListResponse>(`/v1/movies/${movieIdOrSlug}/comments${qs}`, {
    method: "GET",
    token,
  });
}

/** Lấy danh sách câu trả lời của 1 bình luận */
export async function getCommentRepliesApi(
  commentId: number,
  params?: { page?: number; per_page?: number },
  token?: string | null
): Promise<CommentListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));

  const qs = query.toString() ? `?${query.toString()}` : "";
  return sendRequest<CommentListResponse>(`/v1/comments/${commentId}/replies${qs}`, {
    method: "GET",
    token,
  });
}

/** Đăng bình luận mới hoặc phản hồi */
export async function postCommentApi(
  movieIdOrSlug: string | number,
  payload: PostCommentPayload,
  token: string
): Promise<{ status: string; message: string; data: CommentItem }> {
  return sendRequest<{ status: string; message: string; data: CommentItem }>(
    `/v1/movies/${movieIdOrSlug}/comments`,
    {
      method: "POST",
      body: payload,
      token,
    }
  );
}

/** Sửa bình luận */
export async function updateCommentApi(
  commentId: number,
  payload: UpdateCommentPayload,
  token: string
): Promise<{ status: string; message: string; data: CommentItem }> {
  return sendRequest<{ status: string; message: string; data: CommentItem }>(
    `/v1/comments/${commentId}`,
    {
      method: "PUT",
      body: payload,
      token,
    }
  );
}

/** Xóa bình luận */
export async function deleteCommentApi(
  commentId: number,
  token: string
): Promise<{ status: string; message: string }> {
  return sendRequest<{ status: string; message: string }>(`/v1/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}

/** Thích / Bỏ thích bình luận (Toggle Like) */
export async function toggleCommentLikeApi(
  commentId: number,
  token: string
): Promise<ToggleCommentLikeResponse> {
  return sendRequest<ToggleCommentLikeResponse>(`/v1/comments/${commentId}/like`, {
    method: "POST",
    token,
  });
}

/** Lấy danh sách bình luận cho Admin */
export async function getAdminCommentsApi(
  params: Record<string, string | number | boolean | undefined> = {},
  token?: string | null
): Promise<{ data: CommentItem[]; meta: any }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "") query.set(key, String(val));
  });
  const qs = query.toString() ? `?${query.toString()}` : "";
  return sendRequest<{ data: CommentItem[]; meta: any }>(`/v1/admin/comments${qs}`, {
    token,
  });
}

/** Cập nhật trạng thái bình luận (Admin: active, hidden, spam) */
export async function updateAdminCommentStatusApi(
  commentId: number,
  status: "active" | "hidden" | "spam",
  token?: string | null
): Promise<{ status: string; message: string; data: CommentItem }> {
  return sendRequest<{ status: string; message: string; data: CommentItem }>(
    `/v1/admin/comments/${commentId}/status`,
    {
      method: "PATCH",
      body: { status },
      token,
    }
  );
}

/** Ghim / Bỏ ghim bình luận (Admin) */
export async function toggleAdminCommentPinApi(
  commentId: number,
  token?: string | null
): Promise<{ status: string; message: string; data: CommentItem }> {
  return sendRequest<{ status: string; message: string; data: CommentItem }>(
    `/v1/admin/comments/${commentId}/pin`,
    {
      method: "PATCH",
      token,
    }
  );
}

/** Xóa bình luận từ Admin */
export async function deleteAdminCommentApi(
  commentId: number,
  force = false,
  token?: string | null
): Promise<{ status: string; message: string }> {
  const qs = force ? "?force=1" : "";
  return sendRequest<{ status: string; message: string }>(
    `/v1/admin/comments/${commentId}${qs}`,
    {
      method: "DELETE",
      token,
    }
  );
}

/** Thao tác hàng loạt trên bình luận (Admin: activate, hide, spam, delete) */
export async function bulkAdminCommentsApi(
  payload: { action: "activate" | "hide" | "spam" | "delete"; ids: number[] },
  token?: string | null
): Promise<{ status: string; message: string; affected: number }> {
  return sendRequest<{ status: string; message: string; affected: number }>(
    "/v1/admin/comments/bulk",
    {
      method: "POST",
      body: payload,
      token,
    }
  );
}

/* ==========================================================================
   NOTIFICATIONS & SCHEDULE API
   ========================================================================== */

/** Lấy danh sách thông báo của người dùng */
export async function getNotificationsApi(
  page = 1,
  perPage = 15,
  token?: string | null
): Promise<NotificationListResponse> {
  return sendRequest<NotificationListResponse>(
    `/v1/notifications?page=${page}&per_page=${perPage}`,
    {
      token,
      revalidate: 0,
    }
  );
}

/** Lấy số lượng thông báo chưa đọc */
export async function getUnreadNotificationsCountApi(
  token?: string | null
): Promise<UnreadCountResponse> {
  return sendRequest<UnreadCountResponse>("/v1/notifications/unread-count", {
    token,
    revalidate: 0,
  });
}

/** Đánh dấu một thông báo là đã đọc */
export async function markNotificationAsReadApi(
  notificationId: string,
  token?: string | null
): Promise<{ success: boolean; data: { unreadCount: number } }> {
  return sendRequest<{ success: boolean; data: { unreadCount: number } }>(
    `/v1/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      token,
    }
  );
}

/** Đánh dấu tất cả thông báo là đã đọc */
export async function markAllNotificationsAsReadApi(
  token?: string | null
): Promise<{ success: boolean; data: { unreadCount: number } }> {
  return sendRequest<{ success: boolean; data: { unreadCount: number } }>(
    "/v1/notifications/read-all",
    {
      method: "POST",
      token,
    }
  );
}

/** Xóa một thông báo */
export async function deleteNotificationApi(
  notificationId: string,
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  return sendRequest<{ success: boolean; message: string }>(
    `/v1/notifications/${notificationId}`,
    {
      method: "DELETE",
      token,
    }
  );
}

/** Gửi thông báo broadcast hệ thống (Admin) */
export async function broadcastAdminNotificationApi(
  payload: BroadcastNotificationPayload,
  token?: string | null
): Promise<BroadcastNotificationResponse> {
  return sendRequest<BroadcastNotificationResponse>(
    "/v1/admin/notifications/broadcast",
    {
      method: "POST",
      body: payload,
      token,
    }
  );
}

/** Lấy lịch chiếu phim tuần (0 = Chủ nhật, ..., 6 = Thứ 7) */
export async function getWeeklyScheduleApi(): Promise<WeeklyScheduleResponse> {
  return sendRequest<WeeklyScheduleResponse>("/v1/schedule", {
    revalidate: 1800,
  });
}
