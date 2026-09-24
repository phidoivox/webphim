/**
 * Nguồn sự thật duy nhất cho mọi URL/env frontend.
 * Sửa domain 1 lần ở file .env (.env.local dev, build-arg Docker) — cả app ăn theo.
 *
 * Quy ước:
 * - NEXT_PUBLIC_API_URL: browser gọi backend qua nginx (Docker: http://localhost/api,
 *   Laragon dev: http://webphim.test/api). Bake lúc build.
 * - INTERNAL_API_URL: server-side (SSR) gọi nội bộ container (Docker: http://nginx/api).
 *   Runtime-only, không bake. Dev Laragon không set → rớt về NEXT_PUBLIC_API_URL.
 * - NEXT_PUBLIC_SITE_URL: canonical/SEO.
 * - NEXT_PUBLIC_REVERB_*: WebSocket qua nginx (:80 Docker) hoặc trực tiếp (:8080 Laragon dev).
 */

const trimSlash = (s: string) => s.replace(/\/+$/, "");

const isServer = typeof window === "undefined";

/** Browser gọi backend (qua nginx / Laragon domain). Dùng cho mọi fetch client-side. */
export function getApiUrl(): string {
  return trimSlash(process.env.NEXT_PUBLIC_API_URL || "http://localhost/api");
}

/** SSR gọi nội bộ container. Dev Laragon không có INTERNAL_API_URL → dùng chung API URL. */
export function getServerApiUrl(): string {
  return trimSlash(
    (isServer ? process.env.INTERNAL_API_URL : null) ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost/api"
  );
}

/** Canonical domain cho SEO/metadata/sitemap. */
export function getSiteUrl(): string {
  return trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost");
}

export interface ReverbConfig {
  appKey: string | undefined;
  wsHost: string;
  wsPort: number;
  wsScheme: string;
  isTls: boolean;
}

/** Cấu hình WebSocket. Port mặc định theo scheme (80/443) — đúng cả Docker lẫn dev. */
export function getReverbConfig(): ReverbConfig {
  const wsScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
  const isTls = wsScheme === "https";
  return {
    appKey: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || "localhost",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || (isTls ? 443 : 80),
    wsScheme,
    isTls,
  };
}
