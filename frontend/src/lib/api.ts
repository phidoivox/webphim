import type { MovieDetail } from "@/types/movie";

/** Fail hết các base URL — không kết nối được backend. */
export class ApiError extends Error {}

/** Backend trả 404 — slug không tồn tại. */
export class NotFoundError extends Error {}

const POSSIBLE_API_URLS = [
  process.env.NEXT_PUBLIC_API_URL || "http://webphim.test/api",
  "http://localhost/webphim/public/api",
  "http://127.0.0.1:8000/api",
  "http://localhost:8000/api",
];

export interface ApiResult<T> {
  baseUrl: string;
  data: T;
}

/** Thử lần lượt các base URL, trả kết quả của base 200 đầu tiên. */
export async function fetchJson<T>(path: string): Promise<ApiResult<T>> {
  let lastError: unknown = null;
  let notFound = false;

  for (const base of POSSIBLE_API_URLS) {
    try {
      const res = await fetch(`${base}${path}`, { cache: "no-store" });
      if (res.ok) {
        return { baseUrl: base, data: (await res.json()) as T };
      }
      if (res.status === 404) {
        notFound = true;
      } else {
        lastError = new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (notFound) {
    throw new NotFoundError("Không tìm thấy dữ liệu yêu cầu.");
  }
  throw new ApiError(
    "Không thể kết nối đến Backend Laravel qua các địa chỉ (webphim.test, localhost/webphim/public, 127.0.0.1:8000). Vui lòng kiểm tra Apache/Nginx trên Laragon hoặc gõ lệnh `php artisan serve`.",
    { cause: lastError }
  );
}

export async function getMovieDetail(slug: string): Promise<MovieDetail> {
  const { data: payload } = await fetchJson<{ data: MovieDetail }>(`/v1/movies/${slug}`);
  return payload.data;
}
