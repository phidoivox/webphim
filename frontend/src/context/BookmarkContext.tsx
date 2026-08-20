"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getBookmarksListApi,
  mergeGuestBookmarksApi,
  toggleBookmarkApi,
} from "@/lib/api";
import type {
  BookmarkType,
  GuestBookmarkItem,
} from "@/types/bookmark";
import { toast } from "sonner";

const GUEST_BOOKMARKS_KEY = "webphim_guest_bookmarks";
const LEGACY_FAVORITES_KEY = "webphim_favorites";
const SYNC_CHANNEL_NAME = "webphim_bookmark_sync";
const SYNC_DEBOUNCE_MS = 300; // 300ms trailing debounce chống lag khi click liên tục

export interface MovieBookmarkMeta {
  id: number;
  name: string;
  originName?: string | null;
  slug: string;
  posterUrl?: string | null;
  thumbUrl?: string | null;
  year?: number | null;
  quality?: string | null;
  ratingAvg?: number | null;
  genres?: Array<{ id?: number; name: string }> | string[];
}

interface BookmarkContextValue {
  isBookmarked: (movieId: number, type?: BookmarkType) => boolean;
  isFavorite: (movieId: number) => boolean;
  isWatchLater: (movieId: number) => boolean;
  toggleBookmark: (
    movie: MovieBookmarkMeta,
    type?: BookmarkType
  ) => Promise<{ isBookmarked: boolean; message: string }>;
  favoriteCount: number;
  watchlaterCount: number;
  totalCount: number;
  loading: boolean;
  isPending: boolean;
  refreshBookmarks: () => Promise<void>;
  getGuestBookmarks: () => GuestBookmarkItem[];
}

const BookmarkContext = createContext<BookmarkContextValue | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  // 1. Quản lý trạng thái bằng cả State (cho Re-render) và Ref (cho Synchronous Read 0ms không bị stale closure)
  const favoriteIdsRef = useRef<Set<number>>(new Set());
  const watchlaterIdsRef = useRef<Set<number>>(new Set());
  const serverFavoriteIdsRef = useRef<Set<number>>(new Set());
  const serverWatchlaterIdsRef = useRef<Set<number>>(new Set());

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [watchlaterIds, setWatchlaterIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  // Timers cho từng cặp [movieId_type] để gom cụm request khi spam click
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingMoviesRef = useRef<Map<string, MovieBookmarkMeta>>(new Map());

  // Đọc danh sách bookmarks của Khách từ LocalStorage
  const getGuestBookmarks = useCallback((): GuestBookmarkItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(GUEST_BOOKMARKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  // Lưu danh sách bookmarks của Khách vào LocalStorage
  const saveGuestBookmarks = useCallback((items: GuestBookmarkItem[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(GUEST_BOOKMARKS_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, []);

  // Cập nhật đồng thời Ref và State
  const updateFavoriteIds = useCallback((next: Set<number>) => {
    favoriteIdsRef.current = next;
    setFavoriteIds(new Set(next));
  }, []);

  const updateWatchlaterIds = useCallback((next: Set<number>) => {
    watchlaterIdsRef.current = next;
    setWatchlaterIds(new Set(next));
  }, []);

  // Tải danh sách bookmarks từ Cloud / Local
  const refreshBookmarks = useCallback(async () => {
    if (authLoading) return;

    if (isAuthenticated && token) {
      try {
        const res = await getBookmarksListApi({ per_page: 100 }, token);
        if (res.status === "success" && Array.isArray(res.data)) {
          const favs = new Set<number>();
          const wls = new Set<number>();

          for (const b of res.data) {
            if (b.type === "watchlater") {
              wls.add(b.movieId);
            } else {
              favs.add(b.movieId);
            }
          }

          serverFavoriteIdsRef.current = new Set(favs);
          serverWatchlaterIdsRef.current = new Set(wls);
          updateFavoriteIds(favs);
          updateWatchlaterIds(wls);
        }
      } catch {
        const guests = getGuestBookmarks();
        const favs = new Set(guests.filter((g) => g.type === "favorite").map((g) => g.movieId));
        const wls = new Set(guests.filter((g) => g.type === "watchlater").map((g) => g.movieId));
        updateFavoriteIds(favs);
        updateWatchlaterIds(wls);
      }
    } else {
      const guests = getGuestBookmarks();
      const favs = new Set(guests.filter((g) => g.type === "favorite").map((g) => g.movieId));
      const wls = new Set(guests.filter((g) => g.type === "watchlater").map((g) => g.movieId));
      serverFavoriteIdsRef.current = new Set(favs);
      serverWatchlaterIdsRef.current = new Set(wls);
      updateFavoriteIds(favs);
      updateWatchlaterIds(wls);
    }

    setLoading(false);
  }, [authLoading, isAuthenticated, token, getGuestBookmarks, updateFavoriteIds, updateWatchlaterIds]);

  // BroadcastChannel listener
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      broadcastRef.current = bc;

      bc.onmessage = (event) => {
        if (event.data?.type === "BOOKMARK_TOGGLED") {
          const { movieId, bookmarkType, isBookmarked: nextState } = event.data;
          const ref = bookmarkType === "watchlater" ? watchlaterIdsRef : favoriteIdsRef;
          const updater = bookmarkType === "watchlater" ? updateWatchlaterIds : updateFavoriteIds;

          const copy = new Set(ref.current);
          if (nextState) {
            copy.add(movieId);
          } else {
            copy.delete(movieId);
          }
          updater(copy);
        } else if (event.data?.type === "BOOKMARK_REFRESH") {
          void refreshBookmarks();
        }
      };

      return () => {
        bc.close();
      };
    }
  }, [refreshBookmarks, updateFavoriteIds, updateWatchlaterIds]);

  // Initial load
  useEffect(() => {
    void refreshBookmarks();
  }, [refreshBookmarks]);

  // Tự động gộp tủ phim Khách lên Cloud khi Đăng nhập
  useEffect(() => {
    if (isAuthenticated && token) {
      const guests = getGuestBookmarks();
      if (guests.length > 0) {
        mergeGuestBookmarksApi(
          guests.map((g) => ({ movie_id: g.movieId, type: g.type })),
          token
        )
          .then((res) => {
            if (res.status === "success") {
              try {
                localStorage.removeItem(GUEST_BOOKMARKS_KEY);
                localStorage.removeItem(LEGACY_FAVORITES_KEY);
              } catch {}
              void refreshBookmarks();
            }
          })
          .catch(() => {});
      }
    }
  }, [isAuthenticated, token, getGuestBookmarks, refreshBookmarks]);

  // Kiểm tra trạng thái lưu tức thì (0ms)
  const isFavorite = useCallback((movieId: number) => favoriteIds.has(movieId), [favoriteIds]);
  const isWatchLater = useCallback((movieId: number) => watchlaterIds.has(movieId), [watchlaterIds]);

  const isBookmarked = useCallback(
    (movieId: number, type?: BookmarkType) => {
      if (type === "favorite") return favoriteIds.has(movieId);
      if (type === "watchlater") return watchlaterIds.has(movieId);
      return favoriteIds.has(movieId) || watchlaterIds.has(movieId);
    },
    [favoriteIds, watchlaterIds]
  );

  // Thực thi đồng bộ về Backend hoặc LocalStorage sau khi người dùng ngừng spam click
  const flushSyncToBackendOrStorage = useCallback(
    async (movieId: number, type: BookmarkType, targetState: boolean, movieMeta: MovieBookmarkMeta) => {
      // 1. THÀNH VIÊN ĐÃ ĐĂNG NHẬP
      if (isAuthenticated && token) {
        const serverSet = type === "watchlater" ? serverWatchlaterIdsRef.current : serverFavoriteIdsRef.current;
        const currentServerState = serverSet.has(movieId);

        // Nếu sau chuỗi click liên tục, trạng thái cuối cùng giống trạng thái trên Server -> Không cần gọi API
        if (currentServerState === targetState) {
          return;
        }

        try {
          const res = await toggleBookmarkApi({ movie_id: movieId, type }, token);
          if (res.status === "success") {
            const actualState = res.data.isBookmarked;
            if (type === "watchlater") {
              if (actualState) serverWatchlaterIdsRef.current.add(movieId);
              else serverWatchlaterIdsRef.current.delete(movieId);
            } else {
              if (actualState) serverFavoriteIdsRef.current.add(movieId);
              else serverFavoriteIdsRef.current.delete(movieId);
            }
          }
        } catch {
          // Khi lỗi mạng -> Rollback về trạng thái server
          const rollbackSet = new Set(type === "watchlater" ? serverWatchlaterIdsRef.current : serverFavoriteIdsRef.current);
          if (type === "watchlater") updateWatchlaterIds(rollbackSet);
          else updateFavoriteIds(rollbackSet);

          broadcastRef.current?.postMessage({
            type: "BOOKMARK_TOGGLED",
            movieId,
            bookmarkType: type,
            isBookmarked: rollbackSet.has(movieId),
          });
        }
        return;
      }

      // 2. KHÁCH (GUEST MODE)
      const guests = getGuestBookmarks();
      let updated: GuestBookmarkItem[];

      if (targetState) {
        const rawGenres = movieMeta.genres;
        const formattedGenres = Array.isArray(rawGenres)
          ? rawGenres.map((g) => (typeof g === "string" ? g : g.name))
          : undefined;

        const newItem: GuestBookmarkItem = {
          movieId,
          type,
          savedAt: new Date().toISOString(),
          movie: {
            id: movieMeta.id,
            name: movieMeta.name,
            originName: movieMeta.originName,
            slug: movieMeta.slug,
            posterUrl: movieMeta.posterUrl,
            thumbUrl: movieMeta.thumbUrl,
            year: movieMeta.year,
            quality: movieMeta.quality,
            ratingAvg: movieMeta.ratingAvg,
            genres: formattedGenres,
          },
        };
        updated = [
          newItem,
          ...guests.filter((g) => !(g.movieId === movieId && g.type === type)),
        ];
      } else {
        updated = guests.filter((g) => !(g.movieId === movieId && g.type === type));
      }

      saveGuestBookmarks(updated);
    },
    [isAuthenticated, token, getGuestBookmarks, saveGuestBookmarks, updateFavoriteIds, updateWatchlaterIds]
  );

  // 8. Toggle Lưu / Bỏ lưu Phim Tức Thì (Instant 0ms + Debounced Cloud Sync)
  const toggleBookmark = useCallback(
    async (
      movie: MovieBookmarkMeta,
      type: BookmarkType = "favorite"
    ): Promise<{ isBookmarked: boolean; message: string }> => {
      const activeRef = type === "watchlater" ? watchlaterIdsRef : favoriteIdsRef;
      const updater = type === "watchlater" ? updateWatchlaterIds : updateFavoriteIds;

      // Đọc trạng thái từ Ref (Chính xác 100% thời gian thực, không bao giờ bị stale closure)
      const wasSaved = activeRef.current.has(movie.id);
      const willBeSaved = !wasSaved;

      // Cập nhật State & Ref tức thì (0ms) để UI phản hồi ngay lập tức
      const nextSet = new Set(activeRef.current);
      if (willBeSaved) {
        nextSet.add(movie.id);
      } else {
        nextSet.delete(movie.id);
      }
      updater(nextSet);

      // Bắn tín hiệu sang các tab khác ngay lập tức
      broadcastRef.current?.postMessage({
        type: "BOOKMARK_TOGGLED",
        movieId: movie.id,
        bookmarkType: type,
        isBookmarked: willBeSaved,
      });

      // Gom cụm request (Debounce trailing edge) khi người dùng bấm liên tục
      const syncKey = `${movie.id}_${type}`;
      pendingMoviesRef.current.set(syncKey, movie);

      const existingTimer = debounceTimersRef.current.get(syncKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const newTimer = setTimeout(() => {
        debounceTimersRef.current.delete(syncKey);
        const meta = pendingMoviesRef.current.get(syncKey) || movie;
        void flushSyncToBackendOrStorage(movie.id, type, willBeSaved, meta);
      }, SYNC_DEBOUNCE_MS);

      debounceTimersRef.current.set(syncKey, newTimer);

      const actionLabel = type === "watchlater" ? "vào Xem sau" : "vào Yêu thích";
      if (willBeSaved) {
        toast.success(`Đã thêm "${movie.name}" ${actionLabel}`);
      } else {
        toast.info(`Đã xóa "${movie.name}" khỏi danh sách`);
      }

      return {
        isBookmarked: willBeSaved,
        message: willBeSaved
          ? `Đã thêm ${actionLabel}`
          : "Đã xóa khỏi danh sách",
      };
    },
    [updateFavoriteIds, updateWatchlaterIds, flushSyncToBackendOrStorage]
  );

  return (
    <BookmarkContext.Provider
      value={{
        isBookmarked,
        isFavorite,
        isWatchLater,
        toggleBookmark,
        favoriteCount: favoriteIds.size,
        watchlaterCount: watchlaterIds.size,
        totalCount: favoriteIds.size + watchlaterIds.size,
        loading,
        isPending: false,
        refreshBookmarks,
        getGuestBookmarks,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmark(movieId?: number) {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmark must be used within a BookmarkProvider");
  }

  const isFavBool = movieId !== undefined ? context.isFavorite(movieId) : false;
  const isWlBool = movieId !== undefined ? context.isWatchLater(movieId) : false;
  const isSaved = isFavBool || isWlBool;

  return {
    ...context,
    isSaved,
    isFavorite: movieId !== undefined ? isFavBool : context.isFavorite,
    isWatchLater: movieId !== undefined ? isWlBool : context.isWatchLater,
    isMovieFavorite: context.isFavorite,
    isMovieWatchLater: context.isWatchLater,
  };
}
