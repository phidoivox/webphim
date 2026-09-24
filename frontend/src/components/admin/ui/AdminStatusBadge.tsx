"use client";

import React from "react";

export type StatusType =
  | "active"
  | "inactive"
  | "ongoing"
  | "completed"
  | "trailer"
  | "pending"
  | "resolved"
  | "rejected"
  | "admin"
  | "moderator"
  | "user"
  | "single"
  | "series"
  | "tv-show"
  | "featured"
  | "cinema"
  | string;

export interface AdminStatusBadgeProps {
  status: StatusType;
  label?: React.ReactNode;
  showDot?: boolean;
  size?: "sm" | "md";
  variant?: "pill" | "subtle" | "outline";
  className?: string;
}

interface StatusConfig {
  defaultLabel: string;
  dotColor: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
}

const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  // Positive / Active
  active: {
    defaultLabel: "Đang bật",
    dotColor: "bg-emerald-400",
    pillBg: "bg-emerald-500/10",
    pillText: "text-emerald-400",
    pillBorder: "border-emerald-500/25",
  },
  completed: {
    defaultLabel: "Hoàn tất",
    dotColor: "bg-emerald-400",
    pillBg: "bg-emerald-500/10",
    pillText: "text-emerald-400",
    pillBorder: "border-emerald-500/25",
  },
  resolved: {
    defaultLabel: "Đã xử lý",
    dotColor: "bg-emerald-400",
    pillBg: "bg-emerald-500/10",
    pillText: "text-emerald-400",
    pillBorder: "border-emerald-500/25",
  },
  published: {
    defaultLabel: "Đã xuất bản",
    dotColor: "bg-emerald-400",
    pillBg: "bg-emerald-500/10",
    pillText: "text-emerald-400",
    pillBorder: "border-emerald-500/25",
  },

  // Warning / Pending / In Progress
  ongoing: {
    defaultLabel: "Đang chiếu",
    dotColor: "bg-amber-400",
    pillBg: "bg-amber-500/10",
    pillText: "text-amber-400",
    pillBorder: "border-amber-500/25",
  },
  pending: {
    defaultLabel: "Chờ xử lý",
    dotColor: "bg-amber-400",
    pillBg: "bg-amber-500/10",
    pillText: "text-amber-400",
    pillBorder: "border-amber-500/25",
  },
  trailer: {
    defaultLabel: "Trailer",
    dotColor: "bg-amber-400",
    pillBg: "bg-amber-500/10",
    pillText: "text-amber-400",
    pillBorder: "border-amber-500/25",
  },

  // Danger / Negative
  inactive: {
    defaultLabel: "Tạm ẩn",
    dotColor: "bg-rose-400",
    pillBg: "bg-rose-500/10",
    pillText: "text-rose-400",
    pillBorder: "border-rose-500/25",
  },
  rejected: {
    defaultLabel: "Đã từ chối",
    dotColor: "bg-rose-400",
    pillBg: "bg-rose-500/10",
    pillText: "text-rose-400",
    pillBorder: "border-rose-500/25",
  },
  failed: {
    defaultLabel: "Thất bại",
    dotColor: "bg-rose-400",
    pillBg: "bg-rose-500/10",
    pillText: "text-rose-400",
    pillBorder: "border-rose-500/25",
  },

  // Roles & Types
  admin: {
    defaultLabel: "Quản trị viên",
    dotColor: "bg-purple-400",
    pillBg: "bg-purple-500/10",
    pillText: "text-purple-400",
    pillBorder: "border-purple-500/25",
  },
  moderator: {
    defaultLabel: "Kiểm duyệt viên",
    dotColor: "bg-blue-400",
    pillBg: "bg-blue-500/10",
    pillText: "text-blue-400",
    pillBorder: "border-blue-500/25",
  },
  user: {
    defaultLabel: "Thành viên",
    dotColor: "bg-slate-400",
    pillBg: "bg-white/5",
    pillText: "text-slate-300",
    pillBorder: "border-white/10",
  },
  single: {
    defaultLabel: "Phim Lẻ",
    dotColor: "bg-sky-400",
    pillBg: "bg-sky-500/10",
    pillText: "text-sky-400",
    pillBorder: "border-sky-500/25",
  },
  series: {
    defaultLabel: "Phim Bộ",
    dotColor: "bg-indigo-400",
    pillBg: "bg-indigo-500/10",
    pillText: "text-indigo-400",
    pillBorder: "border-indigo-500/25",
  },
  "tv-show": {
    defaultLabel: "TV Shows",
    dotColor: "bg-pink-400",
    pillBg: "bg-pink-500/10",
    pillText: "text-pink-400",
    pillBorder: "border-pink-500/25",
  },
  featured: {
    defaultLabel: "Nổi bật",
    dotColor: "bg-accent",
    pillBg: "bg-accent/10",
    pillText: "text-accent",
    pillBorder: "border-accent/30",
  },
  cinema: {
    defaultLabel: "Chiếu rạp",
    dotColor: "bg-amber-400",
    pillBg: "bg-amber-500/10",
    pillText: "text-amber-400",
    pillBorder: "border-amber-500/25",
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  defaultLabel: "Mặc định",
  dotColor: "bg-slate-400",
  pillBg: "bg-white/5",
  pillText: "text-slate-300",
  pillBorder: "border-white/10",
};

export default function AdminStatusBadge({
  status,
  label,
  showDot = true,
  size = "sm",
  variant = "pill",
  className = "",
}: AdminStatusBadgeProps) {
  const normalizedKey = String(status).toLowerCase();
  const config = STATUS_CONFIG_MAP[normalizedKey] || DEFAULT_CONFIG;
  const displayLabel = label ?? config.defaultLabel;

  const sizeClasses =
    size === "md"
      ? "px-3 py-1 text-xs font-semibold gap-1.5"
      : "px-2.5 py-0.5 text-[11px] font-medium gap-1.5";

  const isPill = variant === "pill";

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${sizeClasses} ${
        config.pillBg
      } ${config.pillText} ${config.pillBorder} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotColor} ${
            isPill && (normalizedKey === "active" || normalizedKey === "pending" || normalizedKey === "ongoing")
              ? "animate-pulse"
              : ""
          }`}
        />
      )}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
