"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set());
  const [watchlaterIds, setWatchlaterIds] = useState<Set<number>>(() => new Set());

  const [loading, setLoading] = useState<boolean>(false);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

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

          setFavoriteIds(favs);
          setWatchlaterIds(wls);
        }
      } catch {
        const guests = getGuestBookmarks();
        setFavoriteIds(new Set(guests.filter((g) => g.type === "favorite").map((g) => g.movieId)));
        setWatchlaterIds(new Set(guests.filter((g) => g.type === "watchlater").map((g) => g.movieId)));
      }
    } else {
      const guests = getGuestBookmarks();
      setFavoriteIds(new Set(guests.filter((g) => g.type === "favorite").map((g) => g.movieId)));
      setWatchlaterIds(new Set(guests.filter((g) => g.type === "watchlater").map((g) => g.movieId)));
    }

    setLoading(false);
  }, [authLoading, isAuthenticated, token, getGuestBookmarks]);

  // BroadcastChannel listener đồng bộ giữa các tab
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      broadcastRef.current = bc;

      bc.onmessage = (event) => {
        if (event.data?.type === "BOOKMARK_TOGGLED") {
          const { movieId, bookmarkType, isBookmarked: nextState } = event.data;
          const updater = bookmarkType === "watchlater" ? setWatchlaterIds : setFavoriteIds;
          updater((prev) => {
            const next = new Set(prev);
            if (nextState) next.add(movieId);
            else next.delete(movieId);
            return next;
          });
        } else if (event.data?.type === "BOOKMARK_REFRESH") {
          void refreshBookmarks();
        }
      };

      return () => {
        bc.close();
      };
    }
  }, [refreshBookmarks]);

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

  // Kiểm tra trạng thái lưu
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

  // Toggle Lưu / Bỏ lưu Phim Tức Thì (Optimistic 0ms)
  const toggleBookmark = useCallback(
    async (
      movie: MovieBookmarkMeta,
      type: BookmarkType = "favorite"
    ): Promise<{ isBookmarked: boolean; message: string }> => {
      const currentSet = type === "watchlater" ? watchlaterIds : favoriteIds;
      const willBeSaved = !currentSet.has(movie.id);

      // 1. Optimistic Update State ngay lập tức
      const updater = type === "watchlater" ? setWatchlaterIds : setFavoriteIds;
      updater((prev) => {
        const next = new Set(prev);
        if (willBeSaved) next.add(movie.id);
        else next.delete(movie.id);
        return next;
      });

      // 2. Broadcast sang tab khác
      broadcastRef.current?.postMessage({
        type: "BOOKMARK_TOGGLED",
        movieId: movie.id,
        bookmarkType: type,
        isBookmarked: willBeSaved,
      });

      const actionLabel = type === "watchlater" ? "vào Xem sau" : "vào Yêu thích";
      if (willBeSaved) {
        toast.success(`Đã thêm "${movie.name}" ${actionLabel}`);
      } else {
        toast.info(`Đã xóa "${movie.name}" khỏi danh sách`);
      }

      // 3. Đồng bộ Backend hoặc LocalStorage ngầm
      if (isAuthenticated && token) {
        // Fire-and-forget sync to backend
        toggleBookmarkApi({ movie_id: movie.id, type }, token).catch(() => {
          // Rollback nếu thất bại
          updater((prev) => {
            const next = new Set(prev);
            if (willBeSaved) next.delete(movie.id);
            else next.add(movie.id);
            return next;
          });
          toast.error("Không thể cập nhật tủ phim. Vui lòng thử lại!");
        });
      } else {
        const guests = getGuestBookmarks();
        let updated: GuestBookmarkItem[];
        if (willBeSaved) {
          const rawGenres = movie.genres;
          const formattedGenres = Array.isArray(rawGenres)
            ? rawGenres.map((g) => (typeof g === "string" ? g : g.name))
            : undefined;

          const newItem: GuestBookmarkItem = {
            movieId: movie.id,
            type,
            savedAt: new Date().toISOString(),
            movie: {
              id: movie.id,
              name: movie.name,
              originName: movie.originName,
              slug: movie.slug,
              posterUrl: movie.posterUrl,
              thumbUrl: movie.thumbUrl,
              year: movie.year,
              quality: movie.quality,
              ratingAvg: movie.ratingAvg,
              genres: formattedGenres,
            },
          };
          updated = [newItem, ...guests.filter((g) => !(g.movieId === movie.id && g.type === type))];
        } else {
          updated = guests.filter((g) => !(g.movieId === movie.id && g.type === type));
        }
        saveGuestBookmarks(updated);
      }

      return {
        isBookmarked: willBeSaved,
        message: willBeSaved ? `Đã thêm ${actionLabel}` : "Đã xóa khỏi danh sách",
      };
    },
    [favoriteIds, watchlaterIds, isAuthenticated, token, getGuestBookmarks, saveGuestBookmarks]
  );

  const contextValue = useMemo<BookmarkContextValue>(
    () => ({
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
    }),
    [
      isBookmarked,
      isFavorite,
      isWatchLater,
      toggleBookmark,
      favoriteIds.size,
      watchlaterIds.size,
      loading,
      refreshBookmarks,
      getGuestBookmarks,
    ]
  );

  return (
    <BookmarkContext.Provider value={contextValue}>
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
