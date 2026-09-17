"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  ChevronRightIcon,
  CommandIcon,
  ExternalLinkIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";

const PATH_MAP: Record<string, string> = {
  admin: "Bảng Điều Khiển",
  movies: "Quản Lý Phim",
  create: "Thêm Phim Mới",
  edit: "Chỉnh Sửa",
  episodes: "Tập Phim",
  genres: "Thể Loại",
  countries: "Quốc Gia",
  users: "Người Dùng & Phân Quyền",
  reports: "Báo Cáo & Sự Cố",
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const {
    setIsMobileNavOpen,
    openCommandPalette,
    pendingReportsCount,
  } = useAdmin();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic breadcrumbs based on pathname segments
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; href: string; isLast: boolean }> = [];

    let currentPath = "";
    segments.forEach((seg, idx) => {
      currentPath += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const label = PATH_MAP[seg] || (isNaN(Number(seg)) ? seg : `#${seg}`);
      crumbs.push({ label, href: currentPath, isLast });
    });

    return crumbs;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0a0d14]/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition lg:hidden cursor-pointer shrink-0"
          title="Mở menu quản trị"
        >
          <MenuIcon className="h-4 w-4" />
        </button>

        {/* Breadcrumb path */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap"
        >
          <Link
            href="/admin"
            className="flex items-center gap-1 hover:text-white transition text-slate-400 font-medium shrink-0"
          >
            <HomeIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          {breadcrumbs.slice(1).map((crumb, idx) => (
            <React.Fragment key={crumb.href || idx}>
              <ChevronRightIcon className="h-3 w-3 text-slate-600 shrink-0" />
              {crumb.isLast ? (
                <span className="font-medium text-white truncate max-w-[160px] sm:max-w-[260px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-white transition truncate max-w-[100px] sm:max-w-none text-slate-400"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right side: Search, Notifications, Return Web & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Command Palette Trigger Button */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 sm:px-3 text-xs text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white transition cursor-pointer shrink-0"
          title="Tìm kiếm toàn hệ thống (Ctrl+K / ⌘K)"
        >
          <SearchIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="hidden md:inline-block">Tìm kiếm...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
            <CommandIcon className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Incident Reports Notification Bell */}
        <Link
          href="/admin/reports"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition shrink-0"
          title="Báo cáo lỗi & sự cố"
        >
          <BellIcon className="h-3.5 w-3.5" />
          {pendingReportsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black ring-2 ring-[#0a0d14]">
              {pendingReportsCount}
            </span>
          )}
        </Link>

        {/* Quick Link to User Website */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs font-medium text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition shrink-0"
          title="Mở website xem phim ở tab mới"
        >
          <span className="whitespace-nowrap">Xem website</span>
          <ExternalLinkIcon className="h-3 w-3 text-slate-400 shrink-0" />
        </Link>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <div
              suppressHydrationWarning
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.08] text-white text-[11px] font-bold uppercase shrink-0"
            >
              {mounted && user?.name ? user.name.substring(0, 2) : "AD"}
            </div>
            <div className="hidden lg:block text-left">
              <span
                suppressHydrationWarning
                className="text-xs font-medium text-white block leading-tight max-w-[110px] truncate"
              >
                {mounted ? (user?.name ?? "Quản trị viên") : "Quản trị viên"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex h-7 items-center rounded-md border border-white/10 bg-white/5 px-2 text-[11px] font-medium text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer shrink-0"
            title="Đăng xuất khỏi hệ thống"
          >
            Thoát
          </button>
        </div>
      </div>
    </header>
  );
}
