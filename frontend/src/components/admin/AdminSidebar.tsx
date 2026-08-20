"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  ExternalLinkIcon,
  FilmIcon,
  HomeIcon,
  LayersIcon,
  MessageSquareIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SparklesIcon,
  TagIcon,
  UserIcon,
  XIcon,
} from "@/components/ui/icons";
import { useAdmin } from "@/context/AdminContext";

interface NavLinkItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badgeKey?: "pendingReports";
}

interface NavGroup {
  groupTitle: string;
  items: NavLinkItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: "Tổng quan",
    items: [{ label: "Tổng Quan", href: "/admin", icon: HomeIcon }],
  },
  {
    groupTitle: "Quản lý nội dung",
    items: [
      { label: "Quản Lý Phim", href: "/admin/movies", icon: FilmIcon },
      { label: "Bình Luận", href: "/admin/comments", icon: MessageSquareIcon },
      { label: "Thể Loại", href: "/admin/genres", icon: LayersIcon },
      { label: "Quốc Gia", href: "/admin/countries", icon: TagIcon },
    ],
  },
  {
    groupTitle: "Người dùng & Phân quyền",
    items: [{ label: "Người Dùng", href: "/admin/users", icon: UserIcon }],
  },
  {
    groupTitle: "Hệ thống",
    items: [
      {
        label: "Báo Lỗi & Sự Cố",
        href: "/admin/reports",
        icon: SparklesIcon,
        badgeKey: "pendingReports",
      },
      {
        label: "Gửi Thông Báo",
        href: "/admin/notifications",
        icon: BellIcon,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const {
    isCollapsed,
    toggleCollapsed,
    isMobileNavOpen,
    setIsMobileNavOpen,
    pendingReportsCount,
  } = useAdmin();

  const getBadgeValue = (key?: "pendingReports") => {
    if (key === "pendingReports" && pendingReportsCount > 0) {
      return pendingReportsCount;
    }
    return null;
  };

  const renderNavContent = () => (
    <div className="flex h-full flex-col justify-between overflow-y-auto overflow-x-hidden">
      {/* Brand Top Header */}
      <div>
        <div
          className={`flex h-16 items-center border-b border-white/10 px-4 transition-all ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            href="/admin"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-bold text-white text-xs tracking-tight transition-transform group-hover:scale-105">
              WP
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="block text-xs font-bold tracking-tight text-white group-hover:text-accent transition">
                  WebPhim Admin
                </span>
                <span className="block text-[9px] font-medium tracking-wider uppercase text-slate-400">
                  CRM Portal
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.groupTitle}
                </div>
              ) : (
                <div className="mx-auto my-2 h-px w-6 bg-white/10" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const badgeVal = getBadgeValue(item.badgeKey);

                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={`flex items-center rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${
                        isCollapsed
                          ? "justify-center px-2"
                          : "justify-between px-3.5"
                      } ${
                        isActive
                          ? "bg-accent text-white shadow-md shadow-accent/30 font-bold"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-accent group-hover:scale-110"
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!isCollapsed && badgeVal && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 text-[10px] font-black text-amber-300 tabular-nums">
                          {badgeVal}
                        </span>
                      )}

                      {/* Dot badge on collapsed mode */}
                      {isCollapsed && badgeVal && (
                        <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0d0f17]" />
                      )}
                    </Link>

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="pointer-events-none fixed left-20 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#161a26] px-3 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block">
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {badgeVal && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                              {badgeVal}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer: Return to User Web & Collapse Toggle */}
      <div className="p-3 border-t border-white/10 space-y-2 bg-white/[0.01]">
        {/* Return to website */}
        <Link
          href="/"
          className={`flex items-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition ${
            isCollapsed ? "justify-center px-2" : "justify-center gap-2 px-3"
          }`}
          title="Về trang chủ xem phim"
        >
          <ExternalLinkIcon className="h-4 w-4 shrink-0 text-slate-400" />
          {!isCollapsed && <span>Trang chủ xem phim</span>}
        </Link>

        {/* Desktop Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`hidden lg:flex w-full items-center rounded-xl py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition ${
            isCollapsed ? "justify-center" : "justify-between px-3"
          }`}
          title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {!isCollapsed && <span>Thu gọn thanh bên</span>}
          {isCollapsed ? (
            <PanelLeftOpenIcon className="h-4 w-4 text-slate-400 hover:text-white" />
          ) : (
            <PanelLeftCloseIcon className="h-4 w-4 text-slate-400 hover:text-white" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col border-r border-white/10 bg-[#0d0f17] transition-all duration-300 sticky top-0 h-screen z-30 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderNavContent()}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 bg-[#0d0f17] shadow-2xl border-r border-white/10 flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
}
