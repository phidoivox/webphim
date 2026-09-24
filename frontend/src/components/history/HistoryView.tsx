"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  clearAllHistoryApi,
  deleteHistoryItemApi,
  getHistoryListApi,
} from "@/lib/api";
import {
  AlertCircleIcon,
  FilmIcon,
  PlayIcon,
  SparklesIcon,
  TrashIcon,
} from "@/components/ui/icons";
import type { GuestHistoryItem, WatchHistoryItem } from "@/types/history";

const GUEST_HISTORY_KEY = "webphim_guest_history";

type FilterType = "all" | "in_progress" | "completed";

export default function HistoryView() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [guestItems, setGuestItems] = useState<GuestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showClearModal, setShowClearModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch Cloud History (Authenticated)
  const fetchCloudHistory = useCallback(
    async (selectedFilter: FilterType) => {
      if (!token) return;
      setLoading(true);
      try {
        const filterParam =
          selectedFilter === "all" ? undefined : selectedFilter;
        const res = await getHistoryListApi(
          { per_page: 50, filter: filterParam },
          token
        );
        if (res.data?.items) {
          setItems(res.data.items);
        }
      } catch {
        // Fallback to empty on error
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Load Local History (Guest)
  const loadGuestHistory = useCallback(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(GUEST_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GuestHistoryItem[];
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

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && token) {
      fetchCloudHistory(filter);
    } else {
      loadGuestHistory();
    }
  }, [isAuthenticated, token, authLoading, filter, fetchCloudHistory, loadGuestHistory]);

  // Xóa 1 mục
  const handleDeleteItem = async (historyId: number, movieId?: number, episodeId?: number | null) => {
    if (isAuthenticated && token) {
      setDeletingId(historyId);
      try {
        await deleteHistoryItemApi(historyId, token);
        setItems((prev) => prev.filter((item) => item.id !== historyId));
      } catch {
        // Ignore
      } finally {
        setDeletingId(null);
      }
    } else {
      // Xóa trong guest localStorage
      try {
        const updated = guestItems.filter(
          (x) => !(x.movie_id === movieId && x.episode_id === episodeId)
        );
        localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(updated));
        setGuestItems(updated);
      } catch {
        // Ignore
      }
    }
  };

  // Xóa toàn bộ
  const handleClearAll = async () => {
    setIsDeletingAll(true);
    if (isAuthenticated && token) {
      try {
        await clearAllHistoryApi(token);
        setItems([]);
      } catch {
        // Ignore
      }
    } else {
      localStorage.removeItem(GUEST_HISTORY_KEY);
      setGuestItems([]);
    }
    setIsDeletingAll(false);
    setShowClearModal(false);
  };

  // Format time chuẩn HH:mm:ss hoặc mm:ss (tự động hiển thị HH nếu thời lượng >= 1 giờ)
  const formatTime = (seconds: number, matchDurationSeconds?: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      const showHours = matchDurationSeconds && matchDurationSeconds >= 3600;
      return showHours ? "00:00:00" : "00:00";
    }
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    const paddedH = h.toString().padStart(2, "0");
    const paddedM = m.toString().padStart(2, "0");
    const paddedS = s.toString().padStart(2, "0");

    const showHours = h > 0 || (matchDurationSeconds != null && matchDurationSeconds >= 3600);

    if (showHours) {
      return `${paddedH}:${paddedM}:${paddedS}`;
    }
    return `${paddedM}:${paddedS}`;
  };

  // Format date
  const formatRelativeDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString("vi-VN");
    } catch {
      return "Gần đây";
    }
  };

  // Lọc danh sách hiển thị
  const displayItems = isAuthenticated
    ? items
    : guestItems.filter((item) => {
        if (filter === "completed") return item.is_completed;
        if (filter === "in_progress") return !item.is_completed;
        return true;
      });

  const totalCount = displayItems.length;

  return (
    <div className="min-h-screen bg-base pb-24 pt-20 lg:pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Banner Đăng nhập cho Khách */}
        {!isAuthenticated && (
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/15 via-[#1a1528] to-surface p-4 sm:p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent ring-1 ring-accent/40">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white sm:text-base">
                  Đồng bộ lịch sử xem đa thiết bị
                </h2>
                <p className="text-xs text-white/60">
                  Đăng nhập để xem tiếp liền mạch trên Smart TV, Điện thoại và Máy tính ở mọi nơi.
                </p>
              </div>
            </div>
            <Link
              href="/dang-nhap"
              className="shrink-0 rounded-full bg-accent px-5 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {/* HEADER & ACTIONS */}
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-black tracking-tight text-white sm:text-3xl">
                Lịch Sử Xem Phim
              </h1>
              {!loading && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                  {totalCount} phim
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-white/50">
              {isAuthenticated
                ? "Tiến trình xem được tự động đồng bộ thời gian thực qua Cloud đám mây."
                : "Lịch sử đang được lưu tạm trên thiết bị này."}
            </p>
          </div>

          {/* Controls: Filter & Clear All */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filter Tabs */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  filter === "all"
                    ? "bg-accent text-white shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilter("in_progress")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  filter === "in_progress"
                    ? "bg-accent text-white shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Đang xem dở
              </button>
              <button
                type="button"
                onClick={() => setFilter("completed")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  filter === "completed"
                    ? "bg-accent text-white shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Đã xong
              </button>
            </div>

            {/* Clear All Button */}
            {totalCount > 0 && (
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 active:scale-95 cursor-pointer"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 pt-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2 select-none">
                <div className="aspect-[2/3] w-full rounded-2xl bg-surface border border-white/5 shadow-md animate-shimmer" />
                <div className="h-3.5 w-3/4 rounded-md bg-white/15 animate-pulse" />
                <div className="h-2.5 w-1/2 rounded-md bg-white/5" />
              </div>
            ))}
          </div>
        ) : totalCount === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/40 ring-1 ring-white/10">
              <FilmIcon className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              Chưa có lịch sử xem phim
            </h3>
            <p className="mt-1 max-w-sm text-xs text-white/50">
              Các bộ phim bạn đã xem hoặc đang xem dở sẽ xuất hiện ở đây cùng với thanh tiến trình để tiếp tục thưởng thức.
            </p>
            <Link
              href="/"
              className="mt-6 flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90 cursor-pointer"
            >
              <PlayIcon className="h-4 w-4 fill-white" />
              <span>Khám phá phim ngay</span>
            </Link>
          </div>
        ) : (
          /* GRID OF MOVIES */
          <div className="grid grid-cols-2 gap-4 pt-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
            {isAuthenticated
              ? items.map((item) => {
                  const movie = item.movie;
                  if (!movie) return null;
                  const episode = item.episode;
                  const timeParam =
                    !item.isCompleted && item.progressSeconds > 5
                      ? `?t=${item.progressSeconds}`
                      : "";
                  const watchUrl = episode?.slug
                    ? `/xem/${movie.slug}/${episode.slug}${timeParam}`
                    : `/xem/${movie.slug}${timeParam}`;

                  return (
                    <div
                      key={item.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/40 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10"
                    >
                      {/* POSTER & THUMB */}
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-white/5">
                        <Image
                          src={movie.posterUrl || movie.thumbUrl || "/placeholder.jpg"}
                          alt={movie.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                          {movie.quality && (
                            <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-accent backdrop-blur-md">
                              {movie.quality}
                            </span>
                          )}
                          {item.isCompleted ? (
                            <span className="rounded-md bg-emerald-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                              Đã xem xong
                            </span>
                          ) : (
                            <span className="rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                              {episode?.name || "Tập 1"}
                            </span>
                          )}
                        </div>

                        {/* Delete Button (Hover) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                          disabled={deletingId === item.id}
                          aria-label="Xóa khỏi lịch sử"
                          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/70 backdrop-blur-md transition hover:bg-red-500 hover:text-white cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>

                        {/* Play Center Button (Hover) */}
                        <Link
                          href={watchUrl}
                          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-xl shadow-accent/40 transform transition group-hover:scale-110">
                            <PlayIcon className="h-5 w-5 fill-white ml-0.5" />
                          </div>
                        </Link>

                        {/* Bottom Progress Bar */}
                        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
                          <div
                            className={`h-full transition-all ${
                              item.isCompleted ? "bg-emerald-500" : "bg-accent"
                            }`}
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* INFO SECTION */}
                      <div className="flex flex-1 flex-col justify-between p-3">
                        <div>
                          <Link
                            href={watchUrl}
                            className="line-clamp-1 text-xs font-bold text-white transition hover:text-accent sm:text-sm"
                          >
                            {movie.name}
                          </Link>
                          {movie.originName && (
                            <p className="line-clamp-1 text-[11px] text-white/40">
                              {movie.originName}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-white/50">
                          <span>
                            {item.durationSeconds
                              ? `${formatTime(item.progressSeconds, item.durationSeconds)} / ${formatTime(
                                  item.durationSeconds,
                                  item.durationSeconds
                                )}`
                              : `Đã xem ${item.progressPercent}%`}
                          </span>
                          <span>{formatRelativeDate(item.watchedAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              : guestItems.map((item, idx) => {
                  const timeParam =
                    !item.is_completed && item.progress_seconds > 5
                      ? `?t=${item.progress_seconds}`
                      : "";
                  const watchUrl = item.episode_slug
                    ? `/xem/${item.movie_slug}/${item.episode_slug}${timeParam}`
                    : `/xem/${item.movie_slug}${timeParam}`;

                  return (
                    <div
                      key={`${item.movie_id}-${item.episode_id}-${idx}`}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/40 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10"
                    >
                      {/* POSTER */}
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-white/5">
                        <Image
                          src={item.poster_url || "/placeholder.jpg"}
                          alt={item.movie_name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        {/* Badges */}
                        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                          {item.is_completed ? (
                            <span className="rounded-md bg-emerald-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                              Đã xem xong
                            </span>
                          ) : (
                            <span className="rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                              {item.episode_name || "Tập 1"}
                            </span>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteItem(0, item.movie_id, item.episode_id);
                          }}
                          aria-label="Xóa khỏi lịch sử"
                          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/70 backdrop-blur-md transition hover:bg-red-500 hover:text-white cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>

                        {/* Play Center Button */}
                        <Link
                          href={watchUrl}
                          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-xl shadow-accent/40 transform transition group-hover:scale-110">
                            <PlayIcon className="h-5 w-5 fill-white ml-0.5" />
                          </div>
                        </Link>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
                          <div
                            className={`h-full transition-all ${
                              item.is_completed ? "bg-emerald-500" : "bg-accent"
                            }`}
                            style={{ width: `${item.progress_percent}%` }}
                          />
                        </div>
                      </div>

                      {/* INFO */}
                      <div className="flex flex-1 flex-col justify-between p-3">
                        <div>
                          <Link
                            href={watchUrl}
                            className="line-clamp-1 text-xs font-bold text-white transition hover:text-accent sm:text-sm"
                          >
                            {item.movie_name}
                          </Link>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-white/50">
                          <span>
                            {item.duration_seconds
                              ? `${formatTime(item.progress_seconds, item.duration_seconds)} / ${formatTime(
                                  item.duration_seconds,
                                  item.duration_seconds
                                )}`
                              : `Đã xem ${item.progress_percent}%`}
                          </span>
                          <span>{formatRelativeDate(item.watched_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        )}
      </div>

      {/* MODAL CONFIRM CLEAR ALL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#14141a] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/30">
                <AlertCircleIcon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Xóa toàn bộ lịch sử xem?
              </h3>
            </div>
            <p className="mt-3 text-xs text-white/60 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ danh sách lịch sử xem phim không? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/70 transition hover:bg-white/5 hover:text-white cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isDeletingAll}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isDeletingAll ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
