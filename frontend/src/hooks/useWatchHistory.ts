"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getMovieHistoryApi,
  mergeGuestHistoryApi,
  syncHistoryApi,
} from "@/lib/api";
import type { GuestHistoryItem, HistorySyncPayload } from "@/types/history";

const GUEST_HISTORY_KEY = "webphim_guest_history";

export function useWatchHistory() {
  const { user, token, isAuthenticated } = useAuth();
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const lastSyncedTimeRef = useRef<number>(0);
  const lastSyncPayloadRef = useRef<HistorySyncPayload | null>(null);

  // Khởi tạo BroadcastChannel để đồng bộ đa tab trên cùng 1 trình duyệt
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    try {
      broadcastRef.current = new BroadcastChannel("webphim_watch_sync");
    } catch {
      // Ignore unsupported environment
    }

    return () => {
      broadcastRef.current?.close();
      broadcastRef.current = null;
    };
  }, []);

  // Tự động gộp lịch sử xem của khách khi vừa đăng nhập
  useEffect(() => {
    if (!isAuthenticated || !token || typeof window === "undefined") {
      return;
    }

    try {
      const raw = localStorage.getItem(GUEST_HISTORY_KEY);
      if (!raw) return;

      const items = JSON.parse(raw) as GuestHistoryItem[];
      if (Array.isArray(items) && items.length > 0) {
        mergeGuestHistoryApi(items, token)
          .then(() => {
            localStorage.removeItem(GUEST_HISTORY_KEY);
          })
          .catch(() => {
            // Giữ lại để thử lại lần sau nếu có lỗi mạng
          });
      }
    } catch {
      // Ignore parse error
    }
  }, [isAuthenticated, token]);

  // Lưu lịch sử vào LocalStorage (cho khách hoặc offline cache)
  const saveGuestHistory = useCallback(
    (item: GuestHistoryItem) => {
      if (typeof window === "undefined") return;

      try {
        const raw = localStorage.getItem(GUEST_HISTORY_KEY);
        let list: GuestHistoryItem[] = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];

        // Xóa bản ghi cũ của phim/tập đó nếu có
        list = list.filter(
          (x) => !(x.movie_id === item.movie_id && x.episode_id === item.episode_id)
        );

        // Đưa bản ghi mới nhất lên đầu (tối đa 30 mục)
        list.unshift(item);
        if (list.length > 30) list = list.slice(0, 30);

        localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(list));
      } catch {
        // Ignore storage quota error
      }
    },
    []
  );

  // Hàm đồng bộ tiến trình (gọi khi Heartbeat, Pause, Seek, Ended)
  const reportProgress = useCallback(
    async (
      payload: HistorySyncPayload,
      meta?: {
        movieName: string;
        movieSlug: string;
        posterUrl?: string | null;
        episodeName?: string | null;
        episodeSlug?: string | null;
      }
    ) => {
      lastSyncPayloadRef.current = payload;
      lastSyncedTimeRef.current = payload.progress_seconds;

      const progress = payload.progress_seconds;
      const duration = payload.duration_seconds || 0;
      const percent = duration > 0 ? Math.min(100, Math.round((progress / duration) * 100)) : 0;
      const isCompleted = duration > 0 ? progress / duration >= 0.9 : false;

      // 1. Lưu LocalStorage tức thì
      if (meta?.movieSlug && typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `webphim_progress_${meta.movieSlug}`,
            JSON.stringify({
              time: Math.floor(progress),
              duration: Math.floor(duration),
              updated: Date.now(),
            })
          );
        } catch {
          // Ignore
        }
      }

      // 2. Phát tín hiệu BroadcastChannel sang các tab khác
      if (broadcastRef.current && meta) {
        try {
          broadcastRef.current.postMessage({
            type: "PROGRESS_UPDATE",
            movieId: payload.movie_id,
            episodeId: payload.episode_id,
            progressSeconds: progress,
            durationSeconds: duration,
            movieSlug: meta.movieSlug,
            timestamp: Date.now(),
          });
        } catch {
          // Ignore broadcast error
        }
      }

      // 3. Nếu chưa đăng nhập: lưu vào Guest History
      if (!isAuthenticated || !token) {
        if (meta) {
          saveGuestHistory({
            movie_id: payload.movie_id,
            movie_name: meta.movieName,
            movie_slug: meta.movieSlug,
            poster_url: meta.posterUrl,
            episode_id: payload.episode_id,
            episode_name: meta.episodeName,
            episode_slug: meta.episodeSlug,
            server_id: payload.server_id,
            progress_seconds: progress,
            duration_seconds: duration,
            progress_percent: percent,
            is_completed: isCompleted,
            watched_at: new Date().toISOString(),
          });
        }
        return;
      }

      // 4. Nếu đã đăng nhập: Gọi API Backend đồng bộ Cloud
      try {
        await syncHistoryApi(payload, token);
      } catch {
        // Fallback lưu tạm vào Guest history nếu backend lỗi
        if (meta) {
          saveGuestHistory({
            movie_id: payload.movie_id,
            movie_name: meta.movieName,
            movie_slug: meta.movieSlug,
            poster_url: meta.posterUrl,
            episode_id: payload.episode_id,
            episode_name: meta.episodeName,
            episode_slug: meta.episodeSlug,
            server_id: payload.server_id,
            progress_seconds: progress,
            duration_seconds: duration,
            progress_percent: percent,
            is_completed: isCompleted,
            watched_at: new Date().toISOString(),
          });
        }
      }
    },
    [isAuthenticated, token, saveGuestHistory]
  );

  // Lấy tiến trình xem gần nhất (ưu tiên Cloud nếu đăng nhập)
  const fetchResumeProgress = useCallback(
    async (movieId?: number, movieSlug?: string): Promise<number | null> => {
      let localTime = 0;

      // Đọc local storage
      if (movieSlug && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`webphim_progress_${movieSlug}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed.time === "number" && parsed.time > 5) {
              localTime = parsed.time;
            }
          }
        } catch {
          // Ignore
        }
      }

      // Nếu đã đăng nhập và có movieId: Gọi API lấy tiến trình Cloud
      if (isAuthenticated && token && movieId) {
        try {
          const res = await getMovieHistoryApi(movieId, token);
          if (res.data && res.data.progressSeconds > 5 && !res.data.isCompleted) {
            return res.data.progressSeconds;
          }
        } catch {
          // Fallback về localTime nếu API lỗi
        }
      }

      return localTime > 5 ? localTime : null;
    },
    [isAuthenticated, token]
  );

  // Lắng nghe sự kiện pagehide để gửi gói tin cuối cùng bằng fetch keepalive
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePageHide = () => {
      const payload = lastSyncPayloadRef.current;
      if (!payload || !token || !isAuthenticated) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://webphim.test/api";
      const fullUrl = `${apiUrl}/v1/history/sync`;

      try {
        fetch(fullUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Ignore
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isAuthenticated, token]);

  return {
    reportProgress,
    fetchResumeProgress,
  };
}
