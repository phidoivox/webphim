"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  FilmIcon,
  HeartIcon,
  HomeIcon,
  MessageSquareIcon,
  SparklesIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { formatTimeAgo } from "@/lib/date";
import type { NotificationIconType, NotificationItem } from "@/types/notification";

type FilterTab = "all" | "unread" | "episode" | "comment" | "system";

function getNotificationIcon(type: NotificationIconType) {
  switch (type) {
    case "episode":
      return <FilmIcon className="h-5 w-5" />;
    case "comment":
      return <MessageSquareIcon className="h-5 w-5" />;
    case "like":
      return <HeartIcon className="h-5 w-5" />;
    case "vip":
    case "system":
    default:
      return <SparklesIcon className="h-5 w-5" />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNextPage,
  } = useNotifications(false);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === "unread") return !item.isRead;
      if (activeTab === "episode") return item.iconType === "episode";
      if (activeTab === "comment") return item.iconType === "comment" || item.iconType === "like";
      if (activeTab === "system") return item.iconType === "system" || item.iconType === "vip";
      return true;
    });
  }, [notifications, activeTab]);

  const handleCardClick = (item: NotificationItem, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return;
    }

    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
    setDeleteConfirmId(null);
  };

  if (isAuthLoading) {
    return (
      <main className="min-h-screen pt-20 sm:pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-white/50">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-4 text-xs">Đang tải trung tâm thông báo...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen pt-20 sm:pt-24 pb-16">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-accent shadow-inner">
            <BellIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-xl font-bold text-white">Thông Báo Của Bạn</h1>
          <p className="mt-2 text-sm text-white/60">
            Vui lòng đăng nhập để nhận thông báo về các tập phim mới nhất, phản hồi bình luận và các chương trình đặc biệt.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/dang-nhap"
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 cursor-pointer"
            >
              Đăng nhập ngay
            </Link>
            <Link
              href="/dang-ky"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 cursor-pointer"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-white/50">
          <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
            <HomeIcon className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRightIcon className="h-3 w-3 text-white/30" />
          <span className="text-white font-medium">Thông báo</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/25">
              <BellIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Trung Tâm Thông Báo</h1>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>
              <p className="text-xs text-white/55 mt-0.5">
                Cập nhật tự động các tập mới, phản hồi bình luận và thông báo hệ thống
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-accent/50 hover:bg-accent/10 hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
            >
              <CheckCircle2Icon className="h-4 w-4 text-accent" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "Tất cả" },
              { id: "unread", label: `Chưa đọc ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
              { id: "episode", label: "Tập mới" },
              { id: "comment", label: "Bình luận & Thích" },
              { id: "system", label: "Hệ thống" },
            ] as { id: FilterTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={(e) => handleCardClick(item, e)}
                className={`group relative flex items-start gap-3.5 rounded-2xl border p-4 transition ${
                  item.link ? "cursor-pointer" : ""
                } ${
                  !item.isRead
                    ? "border-accent/30 bg-accent/[0.04] shadow-lg shadow-accent/5"
                    : "border-white/10 bg-[#14141a]/60 hover:border-white/20 hover:bg-[#14141a]"
                }`}
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                    !item.isRead
                      ? "bg-accent text-white shadow-md shadow-accent/25"
                      : "bg-white/10 text-accent group-hover:bg-accent group-hover:text-white"
                  }`}
                >
                  {getNotificationIcon(item.iconType)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      className={`text-xs sm:text-sm font-bold leading-tight ${
                        !item.isRead ? "text-white" : "text-white/80"
                      }`}
                    >
                      {item.title}
                    </h2>
                    <span className="shrink-0 text-[10px] sm:text-[11px] text-white/40">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-white/65 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                    {item.link ? (
                      <Link
                        href={item.link}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!item.isRead) markAsRead(item.id);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-accent transition hover:underline"
                      >
                        Xem chi tiết &rarr;
                      </Link>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-white/60 bg-white/5 transition hover:bg-accent/15 hover:text-accent cursor-pointer"
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                          Đã đọc
                        </button>
                      )}

                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/25 rounded-lg px-2 py-0.5 text-[11px]">
                          <span className="text-red-300">Xóa?</span>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(item.id, e)}
                            className="font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                          >
                            Có
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="text-white/40 hover:text-white cursor-pointer"
                          >
                            Không
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(item.id);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-white/40 transition hover:bg-red-500/15 hover:text-red-400 cursor-pointer"
                          title="Xóa thông báo"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/30">
                <BellIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Không Có Thông Báo</h3>
              <p className="mt-1 text-xs text-white/50">
                {activeTab === "unread"
                  ? "Bạn đã đọc hết tất cả thông báo."
                  : "Chưa có thông báo nào trong danh mục này."}
              </p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={fetchNextPage}
              disabled={isLoading}
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Đang tải thêm..." : "Tải thêm thông báo"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
