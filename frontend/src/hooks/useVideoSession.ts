"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getMovieHistoryApi,
  mergeGuestHistoryApi,
  syncHistoryApi,
} from "@/lib/api";
import type { GuestHistoryItem, HistorySyncPayload } from "@/types/history";

const GUEST_HISTORY_KEY = "webphim_guest_history";

export interface VideoSessionConfig {
  movieId?: number;
  episodeId?: number;
  serverId?: number;
  movieSlug?: string;
  episodeSlug?: string;
  movieName?: string;
  episodeName?: string;
  posterUrl?: string;
}

export interface ResumeModalInfo {
  time: number;
  formattedTime: string;
  movieName?: string;
  episodeName?: string;
}

export function useVideoSession(config: VideoSessionConfig) {
  const { token, isAuthenticated } = useAuth();
  const [resolvedStartTime, setResolvedStartTime] = useState<number>(0);
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [resumeModal, setResumeModal] = useState<ResumeModalInfo | null>(null);

  // FSM State Lock: Chặn tuyệt đối mọi thao tác ghi/lưu tiến độ khi chưa hoàn thành khôi phục vị trí
  const isSessionReadyRef = useRef<boolean>(false);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const lastSavedTimeRef = useRef<number>(-1);
  const latestMetaRef = useRef({
    currentTime: 0,
    duration: 0,
    ...config,
  });

  // Cập nhật metadata liên tục
  useEffect(() => {
    latestMetaRef.current = {
      ...latestMetaRef.current,
      ...config,
    };
  }, [config]);

  // Khởi tạo BroadcastChannel cho đồng bộ đa tab
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    try {
      broadcastRef.current = new BroadcastChannel("webphim_watch_sync");
    } catch {
      // Ignore
    }
    return () => {
      broadcastRef.current?.close();
      broadcastRef.current = null;
    };
  }, []);

  // Tự động gộp lịch sử Guest khi đăng nhập
  useEffect(() => {
    if (!isAuthenticated || !token || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(GUEST_HISTORY_KEY);
      if (!raw) return;
      const items = JSON.parse(raw) as GuestHistoryItem[];
      if (Array.isArray(items) && items.length > 0) {
        mergeGuestHistoryApi(items, token)
          .then(() => localStorage.removeItem(GUEST_HISTORY_KEY))
          .catch(() => {});
      }
    } catch {
      // Ignore
    }
  }, [isAuthenticated, token]);

  // =================== TẦNG 1: PHÂN GIẢI MỐC THỜI GIAN BAN ĐẦU ===================
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    async function resolveInitialTimestamp(): Promise<number> {
      // 1. Ưu tiên 1: Query param ?t= từ URL (khi click từ Lịch sử)
      try {
        const params = new URLSearchParams(window.location.search);
        const urlT = params.get("t");
        if (urlT) {
          const parsed = parseFloat(urlT);
          if (!isNaN(parsed) && parsed > 0) {
            return parsed;
          }
        }
      } catch {
        // Ignore
      }

      // 2. Ưu tiên 2: Cloud History nếu đã đăng nhập
      if (isAuthenticated && token && config.movieId) {
        try {
          const res = await getMovieHistoryApi(config.movieId, token);
          if (res.data && res.data.progressSeconds > 3 && !res.data.isCompleted) {
            return res.data.progressSeconds;
          }
        } catch {
          // Ignore API error
        }
      }

      // 3. Ưu tiên 3: LocalStorage Cache
      const slugKey = config.episodeSlug || config.movieSlug;
      if (slugKey) {
        try {
          const raw = localStorage.getItem(`webphim_progress_${slugKey}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed.time === "number" && parsed.time > 3) {
              return parsed.time;
            }
          }
        } catch {
          // Ignore
        }
      }

      return 0;
    }

    resolveInitialTimestamp().then((targetTime) => {
      if (!isMounted) return;

      setResolvedStartTime(targetTime);
      setIsResolved(true);

      if (targetTime > 5) {
        const h = Math.floor(targetTime / 3600);
        const m = Math.floor((targetTime % 3600) / 60);
        const s = Math.floor(targetTime % 60);
        const paddedH = h.toString().padStart(2, "0");
        const paddedM = m.toString().padStart(2, "0");
        const paddedS = s.toString().padStart(2, "0");
        const formattedTime = h > 0 ? `${paddedH}:${paddedM}:${paddedS}` : `${paddedM}:${paddedS}`;
        setResumeModal({
          time: targetTime,
          formattedTime,
          movieName: config.movieName,
          episodeName: config.episodeName,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [config.movieId, config.movieSlug, config.episodeSlug, config.movieName, config.episodeName, isAuthenticated, token]);

  // =================== TẦNG 2: GHI NHẬN & ĐỒNG BỘ TIẾN ĐỘ ===================

  // Hàm ghi vào Guest Storage
  const saveGuestStorage = useCallback((item: GuestHistoryItem) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(GUEST_HISTORY_KEY);
      let list: GuestHistoryItem[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      list = list.filter(
        (x) => !(x.movie_id === item.movie_id && x.episode_id === item.episode_id)
      );
      list.unshift(item);
      if (list.length > 30) list = list.slice(0, 30);
      localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }, []);

  // Hàm sync chính: BẢO VỆ TUYỆT ĐỐI BỞI isSessionReadyRef
  const syncProgress = useCallback(
    async (force = false) => {
      // KHÓA BẢO VỆ: Không cho phép lưu khi phiên chưa sẵn sàng
      if (!isSessionReadyRef.current) return;

      const meta = latestMetaRef.current;
      const time = Math.floor(meta.currentTime);
      const dur = Math.floor(meta.duration);

      if (!meta.movieId || time < 0) return;
      if (!force && time === 0) return;
      if (!force && Math.abs(time - lastSavedTimeRef.current) < 3) return;

      lastSavedTimeRef.current = time;

      const percent = dur > 0 ? Math.min(100, Math.round((time / dur) * 100)) : 0;
      const isCompleted = dur > 0 ? time / dur >= 0.9 : false;

      // 1. Lưu LocalStorage tức thì
      const targetSlug = meta.episodeSlug || meta.movieSlug;
      if (targetSlug && typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `webphim_progress_${targetSlug}`,
            JSON.stringify({ time, duration: dur, updated: Date.now() })
          );
        } catch {
          // Ignore
        }
      }

      // 2. Phát BroadcastChannel
      if (broadcastRef.current) {
        try {
          broadcastRef.current.postMessage({
            type: "PROGRESS_UPDATE",
            movieId: meta.movieId,
            episodeId: meta.episodeId,
            progressSeconds: time,
            durationSeconds: dur,
            timestamp: Date.now(),
          });
        } catch {
          // Ignore
        }
      }

      // 3. Nếu là Khách -> Ghi Guest List
      if (!isAuthenticated || !token) {
        saveGuestStorage({
          movie_id: meta.movieId,
          movie_name: meta.movieName || "Phim",
          movie_slug: meta.movieSlug || "",
          poster_url: meta.posterUrl,
          episode_id: meta.episodeId,
          episode_name: meta.episodeName,
          episode_slug: meta.episodeSlug,
          server_id: meta.serverId,
          progress_seconds: time,
          duration_seconds: dur > 0 ? dur : null,
          progress_percent: percent,
          is_completed: isCompleted,
          watched_at: new Date().toISOString(),
        });
        return;
      }

      // 4. Nếu là Thành viên -> Gửi API Cloud
      const payload: HistorySyncPayload = {
        movie_id: meta.movieId,
        episode_id: meta.episodeId,
        server_id: meta.serverId,
        progress_seconds: time,
        duration_seconds: dur > 0 ? dur : null,
      };

      try {
        await syncHistoryApi(payload, token);
      } catch {
        // Fallback ghi tạm local nếu API lỗi
        saveGuestStorage({
          movie_id: meta.movieId,
          movie_name: meta.movieName || "Phim",
          movie_slug: meta.movieSlug || "",
          poster_url: meta.posterUrl,
          episode_id: meta.episodeId,
          episode_name: meta.episodeName,
          episode_slug: meta.episodeSlug,
          server_id: meta.serverId,
          progress_seconds: time,
          duration_seconds: dur > 0 ? dur : null,
          progress_percent: percent,
          is_completed: isCompleted,
          watched_at: new Date().toISOString(),
        });
      }
    },
    [isAuthenticated, token, saveGuestStorage]
  );

  // Mở khóa phiên xem: gọi khi seeked hoặc video đã sẵn sàng ở đúng vị trí
  const unlockSession = useCallback(() => {
    isSessionReadyRef.current = true;
  }, []);

  // Cập nhật currentTime từ player
  const updateCurrentTime = useCallback(
    (time: number, duration: number) => {
      latestMetaRef.current.currentTime = time;
      latestMetaRef.current.duration = duration;

      if (isSessionReadyRef.current && time > 0) {
        syncProgress(false);
      }
    },
    [syncProgress]
  );

  // Đăng ký sự kiện thoát trang (pagehide, beforeunload, visibilitychange)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleExit = () => {
      const meta = latestMetaRef.current;
      const time = Math.floor(meta.currentTime);
      const dur = Math.floor(meta.duration);

      if (!isSessionReadyRef.current || !meta.movieId || time <= 0) return;

      // Đồng bộ tức thì
      syncProgress(true);

      // Nếu có token, kích hoạt fetch keepalive
      if (token && isAuthenticated) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://webphim.test/api";
        try {
          fetch(`${apiUrl}/v1/history/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              movie_id: meta.movieId,
              episode_id: meta.episodeId,
              server_id: meta.serverId,
              progress_seconds: time,
              duration_seconds: dur > 0 ? dur : null,
            }),
            keepalive: true,
          }).catch(() => {});
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener("pagehide", handleExit);
    window.addEventListener("beforeunload", handleExit);
    document.addEventListener("visibilitychange", handleExit);

    return () => {
      window.removeEventListener("pagehide", handleExit);
      window.removeEventListener("beforeunload", handleExit);
      document.removeEventListener("visibilitychange", handleExit);
    };
  }, [isAuthenticated, token, syncProgress]);

  return {
    resolvedStartTime,
    isResolved,
    resumeModal,
    dismissModal: () => setResumeModal(null),
    unlockSession,
    updateCurrentTime,
    syncProgress,
  };
}
