"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CheckCheckIcon,
  FilmIcon,
  HeartIcon,
  MessageSquareIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { useNotifications } from "@/hooks/useNotifications";
import { formatTimeAgo } from "@/lib/date";
import type { NotificationIconType, NotificationItem } from "@/types/notification";

function getNotificationIcon(type: NotificationIconType) {
  switch (type) {
    case "episode":
      return <FilmIcon className="h-4 w-4" />;
    case "comment":
      return <MessageSquareIcon className="h-4 w-4" />;
    case "like":
      return <HeartIcon className="h-4 w-4" />;
    case "vip":
    case "system":
    default:
      return <SparklesIcon className="h-4 w-4" />;
  }
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(true);

  // Close on click outside
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.link) {
      setOpen(false);
      router.push(item.link);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Thông báo"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          open
            ? "border-accent/60 bg-white/20 text-white"
            : "border-white/15 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/15 hover:text-white"
        }`}
      >
        <BellIcon className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white shadow-sm ring-2 ring-[#0e0e10]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2.5 w-84 sm:w-96 rounded-2xl border border-white/15 bg-[#12141c]/95 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-accent/15 border border-accent/25 px-2 py-0.5 text-[10px] font-bold text-accent">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 transition hover:text-accent cursor-pointer"
              >
                <CheckCheckIcon className="h-3.5 w-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.05] scrollbar-thin scrollbar-thumb-white/10">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Đang tải thông báo...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                    !item.isRead
                      ? "bg-accent/[0.04] hover:bg-accent/[0.08]"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      !item.isRead
                        ? "bg-accent/20 text-accent ring-1 ring-accent/30"
                        : "bg-white/[0.06] text-slate-400 group-hover:text-white"
                    }`}
                  >
                    {getNotificationIcon(item.iconType)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs font-semibold leading-snug line-clamp-1 ${
                          !item.isRead ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent ring-4 ring-accent/20" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                      {item.message}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{formatTimeAgo(item.createdAt)}</span>
                      {item.link && (
                        <span className="font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem chi tiết &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <BellIcon className="mx-auto h-8 w-8 text-white/20 mb-2" />
                <p>Không có thông báo mới nào</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.08] p-2.5 bg-white/[0.02] text-center">
            <Link
              href="/thong-bao"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Xem tất cả thông báo &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
