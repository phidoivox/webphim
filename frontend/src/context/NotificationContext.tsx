"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  deleteNotificationApi,
  getNotificationsApi,
  getUnreadNotificationsCountApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "@/lib/api";
import { disconnectEcho, getEchoInstance } from "@/lib/echo";
import type { NotificationItem, NotificationPaginationMeta } from "@/types/notification";
import { toast } from "sonner";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  meta: NotificationPaginationMeta | null;
  hasMore: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchNextPage: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [meta, setMeta] = useState<NotificationPaginationMeta | null>(null);
  const [page, setPage] = useState<number>(1);
  const isFetchingRef = useRef(false);

  // Fetch danh sách thông báo
  const fetchNotifications = useCallback(
    async (pageToFetch = 1, append = false) => {
      if (!isAuthenticated || !token || isFetchingRef.current) return;

      isFetchingRef.current = true;
      setIsLoading(true);

      try {
        const res = await getNotificationsApi(pageToFetch, 15, token);
        if (res && res.success) {
          setNotifications((prev) =>
            append ? [...prev, ...res.data] : res.data
          );
          setMeta(res.meta);
          setUnreadCount(res.meta.unreadCount);
          setPage(pageToFetch);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông báo:", err);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [isAuthenticated, token]
  );

  // Fetch riêng số lượng unread count (cho polling nhẹ)
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await getUnreadNotificationsCountApi(token);
      if (res && res.success) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Bỏ qua lỗi polling ngầm
    }
  }, [isAuthenticated, token]);

  // Load ban đầu khi đăng nhập
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications(1, false);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setMeta(null);
      disconnectEcho();
    }
  }, [isAuthenticated, token, fetchNotifications]);

  // ── LARAVEL REVERB WEBSOCKET SUBSCRIPTION ──
  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) {
      return;
    }

    const echo = getEchoInstance(token);
    if (!echo) return;

    const channelName = `user.${user.id}`;
    const channel = echo.private(channelName);

    const handleNotificationEvent = (raw: unknown) => {
      let data: Record<string, unknown> = {};
      if (typeof raw === "string") {
        try {
          data = JSON.parse(raw);
        } catch {
          data = {};
        }
      } else if (raw && typeof raw === "object") {
        data = raw as Record<string, unknown>;
      }

      console.log("[Reverb WebSocket] Received notification event:", data);

      const innerData = (data.data && typeof data.data === "object" ? data.data : data) as Record<string, unknown>;
      const notif = (
        innerData.notification ||
        data.notification ||
        (innerData.id && innerData.title ? innerData : null) ||
        (data.id && data.title ? data : null)
      ) as Record<string, unknown> | null;

      if (notif) {
        const extraObj = (notif.extra || {}) as Record<string, unknown>;
        const formattedItem: NotificationItem = {
          id: String(notif.id || Date.now()),
          title: String(notif.title || "Thông báo mới"),
          message: String(notif.message || ""),
          link: typeof notif.link === "string" ? notif.link : null,
          iconType: (notif.iconType || notif.icon_type || "system") as NotificationItem["iconType"],
          isRead: false,
          readAt: null,
          createdAt:
            typeof notif.createdAt === "string"
              ? notif.createdAt
              : typeof notif.created_at === "string"
              ? notif.created_at
              : new Date().toISOString(),
          extra: {
            movieId: (extraObj.movieId || notif.movieId || notif.movie_id || null) as number | null,
            movieName: (extraObj.movieName || notif.movieName || notif.movie_name || null) as string | null,
            movieSlug: (extraObj.movieSlug || notif.movieSlug || notif.movie_slug || null) as string | null,
            posterUrl: (extraObj.posterUrl || notif.posterUrl || notif.poster_url || null) as string | null,
            episodeName: (extraObj.episodeName || notif.episodeName || notif.episode_name || null) as string | null,
            replierName: (extraObj.replierName || notif.replierName || notif.replier_name || null) as string | null,
            likerName: (extraObj.likerName || notif.likerName || notif.liker_name || null) as string | null,
          },
        };

        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === formattedItem.id);
          if (!exists) {
            toast.info(formattedItem.title, {
              description: formattedItem.message,
            });
            return [formattedItem, ...prev];
          }
          return prev;
        });
      }

      const unreadVal = typeof innerData.unreadCount === "number"
        ? innerData.unreadCount
        : typeof data.unreadCount === "number"
        ? data.unreadCount
        : null;

      if (unreadVal !== null) {
        setUnreadCount(unreadVal);
      } else {
        setUnreadCount((prev) => prev + 1);
      }

      // Tự động tải lại danh sách mới nhất từ API ngay khi có event
      fetchNotifications(1, false);
    };

    // Lắng nghe với dot prefix
    channel.listen(".notification.sent", handleNotificationEvent);
    // Lắng nghe không có dot prefix
    channel.listen("notification.sent", handleNotificationEvent);
    // Lắng nghe class name
    channel.listen("NotificationSentEvent", handleNotificationEvent);
    channel.listen(".NotificationSentEvent", handleNotificationEvent);

    // Lắng nghe standard Laravel broadcast notification event
    channel.notification((notif: Record<string, unknown>) => {
      console.log("[Reverb WebSocket] Received standard notification:", notif);
      handleNotificationEvent({ notification: notif });
    });

    // Lắng nghe mọi event đến channel (Safety Net)
    channel.listenToAll((eventName: string, eventData: unknown) => {
      console.log("[Reverb WebSocket] Event on channel:", eventName, eventData);
      if (eventName.includes("notification") || eventName.includes("Notification")) {
        handleNotificationEvent(eventData);
      }
    });

    return () => {
      try {
        echo.leave(channelName);
      } catch {
        // Ignore leave errors
      }
    };
  }, [isAuthenticated, token, user?.id, fetchNotifications]);

  // Polling unread count định kỳ (60 giây) làm cơ chế dự phòng an toàn (Fallback)
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, fetchUnreadCount]);

  // Đánh dấu 1 thông báo là đã đọc (Optimistic UI)
  const markAsRead = useCallback(
    async (id: string) => {
      if (!token) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await markNotificationAsReadApi(id, token);
        if (res && res.success) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc:", err);
      }
    },
    [token]
  );

  // Đánh dấu tất cả là đã đọc (Optimistic UI)
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsReadApi(token);
    } catch (err) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", err);
    }
  }, [token]);

  // Xóa một thông báo (Optimistic UI)
  const deleteNotification = useCallback(
    async (id: string) => {
      if (!token) return;

      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await deleteNotificationApi(id, token);
      } catch (err) {
        console.error("Lỗi khi xóa thông báo:", err);
      }
    },
    [token, notifications]
  );

  // Tải thêm trang tiếp theo (Pagination / Load More)
  const fetchNextPage = useCallback(() => {
    if (meta && page < meta.lastPage && !isLoading) {
      fetchNotifications(page + 1, true);
    }
  }, [meta, page, isLoading, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    meta,
    hasMore: meta ? page < meta.lastPage : false,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNextPage,
    refresh: () => fetchNotifications(1, false),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(_autoPoll?: boolean) {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
