"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  clearAllBookmarksApi,
  deleteBookmarkItemApi,
  getBookmarksListApi,
} from "@/lib/api";
import {
  BookmarkIcon,
  ChevronRightIcon,
  FilmIcon,
  HeartIcon,
  HomeIcon,
  PlayIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";
import type { BookmarkItem, BookmarkType, GuestBookmarkItem } from "@/types/bookmark";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { QualityBadge } from "@/components/ui/QualityBadge";
import { useBookmark } from "@/hooks/useBookmark";

const GUEST_BOOKMARKS_KEY = "webphim_guest_bookmarks";
const SYNC_CHANNEL_NAME = "webphim_bookmark_sync";

type TabFilter = "all" | "favorite" | "watchlater";
type SortOption = "latest" | "oldest" | "rating" | "year";

interface GroupedBookmarkItem {
  movieId: number;
  bookmarkIds: number[];
  types: BookmarkType[];
  savedAt: string;
  movie: {
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
  };
}

export default function BookmarkView() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshBookmarks } = useBookmark();

  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [guestItems, setGuestItems] = useState<GuestBookmarkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [tab, setTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [sort, setSort] = useState<SortOption>("latest");

  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);
  const [deletingMovieId, setDeletingMovieId] = useState<number | null>(null);

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // 1. Fetch Cloud Bookmarks (Authenticated)
  const fetchCloudBookmarks = useCallback(
    async (currentTab: TabFilter, query: string, currentSort: SortOption) => {
      if (!token) return;
      setLoading(true);
      try {
        const typeParam = currentTab === "all" ? undefined : (currentTab as BookmarkType);
        const res = await getBookmarksListApi(
          {
            type: typeParam,
            q: query.trim() || undefined,
            sort: currentSort,
            per_page: 100,
          },
          token
        );
        if (res.status === "success" && Array.isArray(res.data)) {
          setItems(res.data);
        }
      } catch {
        // Fallback to empty on error
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // 2. Load Local Bookmarks (Guest Mode)
  const loadGuestBookmarks = useCallback(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(GUEST_BOOKMARKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GuestBookmarkItem[];
        setGuestItems(Array.isArray(parsed) ? parsed : []);
      } else {
        setGuestItems([]);
      }
    } catch {
      setGuestItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Initial Load
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && token) {
      void fetchCloudBookmarks(tab, searchQuery, sort);
    } else {
      loadGuestBookmarks();
    }
  }, [isAuthenticated, token, authLoading, tab, searchQuery, sort, fetchCloudBookmarks, loadGuestBookmarks]);

  // BroadcastChannel listener
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      broadcastRef.current = bc;

      bc.onmessage = () => {
        if (isAuthenticated && token) {
          void fetchCloudBookmarks(tab, searchQuery, sort);
        } else {
          loadGuestBookmarks();
        }
      };

      return () => {
        bc.close();
      };
    }
  }, [isAuthenticated, token, tab, searchQuery, sort, fetchCloudBookmarks, loadGuestBookmarks]);

  // 4. Nhóm phim theo MovieId (Không bao giờ bị lặp 2 thẻ cho cùng 1 bộ phim)
  const allGroupedItems = useMemo((): GroupedBookmarkItem[] => {
    const map = new Map<number, GroupedBookmarkItem>();

    if (isAuthenticated) {
      for (const item of items) {
        if (!item.movie) continue;
        const mId = item.movieId;
        if (!map.has(mId)) {
          map.set(mId, {
            movieId: mId,
            bookmarkIds: [item.id],
            types: [item.type],
            savedAt: item.createdAt || new Date().toISOString(),
            movie: item.movie,
          });
        } else {
          const existing = map.get(mId)!;
          if (!existing.bookmarkIds.includes(item.id)) {
            existing.bookmarkIds.push(item.id);
          }
          if (!existing.types.includes(item.type)) {
            existing.types.push(item.type);
          }
          if (item.createdAt && new Date(item.createdAt).getTime() > new Date(existing.savedAt).getTime()) {
            existing.savedAt = item.createdAt;
          }
        }
      }
    } else {
      for (const item of guestItems) {
        if (!item.movie) continue;
        const mId = item.movieId;
        if (!map.has(mId)) {
          map.set(mId, {
            movieId: mId,
            bookmarkIds: [],
            types: [item.type],
            savedAt: item.savedAt || new Date().toISOString(),
            movie: item.movie,
          });
        } else {
          const existing = map.get(mId)!;
          if (!existing.types.includes(item.type)) {
            existing.types.push(item.type);
          }
          if (item.savedAt && new Date(item.savedAt).getTime() > new Date(existing.savedAt).getTime()) {
            existing.savedAt = item.savedAt;
          }
        }
      }
    }

    return Array.from(map.values());
  }, [isAuthenticated, items, guestItems]);

  // Đếm số lượng theo danh mục
  const counts = useMemo(() => {
    let fav = 0;
    let later = 0;
    for (const item of allGroupedItems) {
      if (item.types.includes("favorite")) fav++;
      if (item.types.includes("watchlater")) later++;
    }
    return {
      all: allGroupedItems.length,
      favorite: fav,
      watchlater: later,
    };
  }, [allGroupedItems]);

  // Danh sách hiển thị sau khi lọc và sắp xếp
  const displayItems = useMemo((): GroupedBookmarkItem[] => {
    let list = [...allGroupedItems];

    // A. Lọc theo tab danh mục
    if (tab !== "all") {
      list = list.filter((g) => g.types.includes(tab));
    }

    // B. Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.movie.name.toLowerCase().includes(q) ||
          (g.movie.originName && g.movie.originName.toLowerCase().includes(q))
      );
    }

    // C. Sắp xếp
    switch (sort) {
      case "oldest":
        list.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
        break;
      case "rating":
        list.sort((a, b) => (b.movie.ratingAvg ?? 0) - (a.movie.ratingAvg ?? 0));
        break;
      case "year":
        list.sort((a, b) => (b.movie.year ?? 0) - (a.movie.year ?? 0));
        break;
      case "latest":
      default:
        list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        break;
    }

    return list;
  }, [allGroupedItems, tab, searchQuery, sort]);

  // 5. Xóa 1 phim khỏi tủ phim
  const handleDeleteItem = async (item: GroupedBookmarkItem) => {
    const targetMovieId = item.movieId;
    setDeletingMovieId(targetMovieId);

    const triggerDelete = async () => {
      const typesToDelete: BookmarkType[] = tab === "all" ? item.types : [tab];

      for (const t of typesToDelete) {
        broadcastRef.current?.postMessage({
          type: "BOOKMARK_TOGGLED",
          movieId: targetMovieId,
          bookmarkType: t,
          isBookmarked: false,
        });
      }

      if (isAuthenticated && token) {
        setItems((prev) =>
          tab === "all"
            ? prev.filter((x) => x.movieId !== targetMovieId)
            : prev.filter((x) => !(x.movieId === targetMovieId && x.type === tab))
        );

        try {
          for (const bId of item.bookmarkIds) {
            await deleteBookmarkItemApi(bId, token);
          }
          void refreshBookmarks();
        } catch {
          void fetchCloudBookmarks(tab, searchQuery, sort);
        } finally {
          setDeletingMovieId(null);
        }
      } else {
        const updated =
          tab === "all"
            ? guestItems.filter((x) => x.movieId !== targetMovieId)
            : guestItems.filter((x) => !(x.movieId === targetMovieId && x.type === tab));

        try {
          localStorage.setItem(GUEST_BOOKMARKS_KEY, JSON.stringify(updated));
          setGuestItems(updated);
          void refreshBookmarks();
        } catch {
          // Ignore
        } finally {
          setDeletingMovieId(null);
        }
      }
    };

    void triggerDelete();
  };

  // 6. Xóa tất cả trong tab hiện tại
  const handleClearAll = async () => {
    setIsDeletingAll(true);
    broadcastRef.current?.postMessage({ type: "BOOKMARK_REFRESH" });

    if (isAuthenticated && token) {
      try {
        const typeParam = tab === "all" ? undefined : (tab as BookmarkType);
        await clearAllBookmarksApi(typeParam, token);
        if (tab === "all") {
          setItems([]);
        } else {
          setItems((prev) => prev.filter((item) => item.type !== tab));
        }
        void refreshBookmarks();
      } catch {
        // Ignore
      }
    } else {
      if (tab === "all") {
        try {
          localStorage.removeItem(GUEST_BOOKMARKS_KEY);
        } catch {}
        setGuestItems([]);
      } else {
        const updated = guestItems.filter((x) => x.type !== tab);
        try {
          localStorage.setItem(GUEST_BOOKMARKS_KEY, JSON.stringify(updated));
        } catch {}
        setGuestItems(updated);
      }
      void refreshBookmarks();
    }
    setIsDeletingAll(false);
    setShowClearModal(false);
  };

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* ── BREADCRUMB ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="flex items-center gap-1 hover:text-ink transition-colors">
            <HomeIcon className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRightIcon className="h-3 w-3 text-faint" />
          <span className="text-ink font-medium">Tủ phim</span>
        </nav>

        {/* ── HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Tủ Phim Của Bạn
              </h1>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-muted">
                {counts.all} phim
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Quản lý danh sách phim yêu thích và phim đã lưu để xem sau.
            </p>
          </div>

          {/* Clear button */}
          {counts.all > 0 && (
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 cursor-pointer self-start sm:self-auto"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              <span>Xóa {tab === "all" ? "tất cả" : "mục này"}</span>
            </button>
          )}
        </div>

        {/* ── CONTROLS ROW (Tabs, Search, Sort) ── */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-white/5 self-start">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                tab === "all"
                  ? "bg-accent text-white font-bold shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              Tất cả ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setTab("favorite")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                tab === "favorite"
                  ? "bg-rose-500 text-white font-bold shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              <HeartIcon className="h-3 w-3 fill-current" />
              <span>Yêu thích ({counts.favorite})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("watchlater")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                tab === "watchlater"
                  ? "bg-amber-500 text-black font-bold shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              <BookmarkIcon className="h-3 w-3 fill-current" />
              <span>Xem sau ({counts.watchlater})</span>
            </button>
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1 sm:w-56">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Lọc tên phim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface pl-8 pr-8 py-1.5 text-xs text-ink placeholder-faint focus:border-accent focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort selector */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-xl border border-white/10 bg-surface px-3 py-1.5 text-xs text-muted focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="latest">Mới lưu nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="rating">Đánh giá cao</option>
              <option value="year">Năm phát hành</option>
            </select>
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 pt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="aspect-[2/3] w-full rounded-lg bg-surface" />
                <div className="h-3.5 w-3/4 rounded bg-surface" />
                <div className="h-3 w-1/2 rounded bg-surface" />
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-surface/50 px-4 py-16 text-center my-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-muted mb-3">
              <BookmarkIcon className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-ink">
              {searchQuery
                ? "Không tìm thấy phim phù hợp"
                : tab === "favorite"
                ? "Chưa có phim yêu thích nào"
                : tab === "watchlater"
                ? "Danh sách xem sau đang trống"
                : "Tủ phim của bạn đang trống"}
            </h2>
            <p className="mt-1 max-w-sm text-xs text-muted">
              {searchQuery
                ? `Không có kết quả nào khớp với từ khóa "${searchQuery}".`
                : "Bấm nút 'Yêu thích' hoặc 'Xem sau' khi duyệt phim để lưu vào tủ phim của bạn."}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover"
            >
              <FilmIcon className="h-3.5 w-3.5" />
              <span>Khám phá phim ngay</span>
            </Link>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 pt-2">
            {displayItems.map((item) => {
              const movie = item.movie;
              if (!movie) return null;
              const watchUrl = `/phim/${movie.slug}`;
              const isDeleting = deletingMovieId === item.movieId;

              const subtitle = [
                movie.year,
                Array.isArray(movie.genres) && movie.genres.length > 0
                  ? typeof movie.genres[0] === "string"
                    ? movie.genres[0]
                    : movie.genres[0].name
                  : null,
              ]
                .filter(Boolean)
                .join(" • ");

              return (
                <div
                  key={item.movieId}
                  className={`group relative flex flex-col transition-opacity ${
                    isDeleting ? "opacity-30 pointer-events-none" : "opacity-100"
                  }`}
                >
                  {/* Poster Box */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface shadow-sm border border-white/5">
                    <Link href={watchUrl} className="block w-full h-full">
                      {movie.posterUrl || movie.thumbUrl ? (
                        <Image
                          src={movie.posterUrl || movie.thumbUrl || ""}
                          alt={movie.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted">
                          <FilmIcon className="h-8 w-8" />
                        </div>
                      )}
                    </Link>

                    {/* Top-left Badges */}
                    <div className="absolute left-1.5 top-1.5 z-10 flex flex-wrap items-center gap-1 pointer-events-none">
                      {movie.quality && <QualityBadge quality={movie.quality} />}
                    </div>

                    {/* Top-right Rating */}
                    {typeof movie.ratingAvg === "number" && movie.ratingAvg > 0 && (
                      <div className="absolute right-1.5 top-1.5 z-10 pointer-events-none">
                        <RatingBadge rating={movie.ratingAvg} />
                      </div>
                    )}

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleDeleteItem(item);
                      }}
                      title="Xóa khỏi tủ phim"
                      aria-label={`Xóa ${movie.name} khỏi tủ phim`}
                      className="absolute top-1.5 right-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-md bg-black/80 text-muted opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>

                    {/* Bottom Category Tag */}
                    <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 pointer-events-none">
                      {item.types.includes("favorite") && (
                        <span className="flex items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-medium text-rose-400 border border-white/10 backdrop-blur-xs">
                          <HeartIcon className="h-2.5 w-2.5 fill-current" />
                          <span>Yêu thích</span>
                        </span>
                      )}
                      {item.types.includes("watchlater") && (
                        <span className="flex items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-medium text-amber-300 border border-white/10 backdrop-blur-xs">
                          <BookmarkIcon className="h-2.5 w-2.5 fill-current" />
                          <span>Xem sau</span>
                        </span>
                      )}
                    </div>

                    {/* Hover Play Overlay */}
                    <Link
                      href={watchUrl}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
                        <PlayIcon className="h-4.5 w-4.5 ml-0.5 fill-current" />
                      </span>
                    </Link>
                  </div>

                  {/* Info below card */}
                  <div className="mt-2 px-0.5">
                    <Link
                      href={watchUrl}
                      className="block truncate text-xs font-semibold text-ink group-hover:text-accent transition-colors sm:text-sm"
                      title={movie.name}
                    >
                      {movie.name}
                    </Link>
                    <p className="truncate text-[11px] text-muted">
                      {movie.originName || subtitle || "WebPhim"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL XÁC NHẬN XÓA TẤT CẢ ── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-surface p-5 shadow-2xl">
            <h3 className="text-sm sm:text-base font-bold text-ink">
              {tab === "all"
                ? "Xóa toàn bộ tủ phim?"
                : tab === "favorite"
                ? "Xóa tất cả phim yêu thích?"
                : "Xóa tất cả danh sách xem sau?"}
            </h3>

            <p className="mt-2 text-xs text-muted leading-relaxed">
              Bạn có chắc chắn muốn xóa {displayItems.length} bộ phim khỏi mục này? Thao tác này không thể hoàn tác.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="rounded-lg border border-white/10 bg-elevated px-3 py-1.5 text-xs font-medium text-muted hover:text-ink transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isDeletingAll}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAll ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
