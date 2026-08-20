import type { AuthUser } from "@/types/auth";

const TOKEN_KEY = "webphim_auth_token";
const USER_KEY = "webphim_auth_user";

/**
 * Lấy token đã lưu từ localStorage hoặc Cookie
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return token;

    // Fallback sang cookie
    const match = document.cookie.match(new RegExp(`(^|;\\s*)auth_token=([^;]*)`));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

/**
 * Lưu token vào cả localStorage và Cookie (cho SSR / Proxy compatibility)
 */
export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOKEN_KEY, token);

    // Lưu cookie 30 ngày, SameSite=Lax, path=/
    const maxAge = 30 * 24 * 60 * 60;
    const isSecure = window.location.protocol === "https:";
    document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  } catch {
    // Silent catch on private browsing storage restrictions
  }
}

/**
 * Xóa token khỏi localStorage và Cookie
 */
export function removeStoredToken(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
  } catch {
    // Silent catch
  }
}

/**
 * Lấy cache thông tin User từ localStorage
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Lưu cache thông tin User vào localStorage
 */
export function setStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Silent catch
  }
}

/**
 * Xóa cache thông tin User
 */
export function removeStoredUser(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Silent catch
  }
}
