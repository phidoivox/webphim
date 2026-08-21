"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookmarkIcon,
  ChevronDownIcon,
  LibraryIcon,
  LoginIcon,
  PlayIcon,
  XIcon,
} from "@/components/ui/icons";
import { GENRES } from "@/data/genres";
import { COUNTRIES } from "@/data/countries";
import { useAuth } from "@/context/AuthContext";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();
  const [openGenres, setOpenGenres] = useState(false);
  const [openCountries, setOpenCountries] = useState(false);

  // Close drawer whenever route changes
  useEffect(() => {
    onClose();
  }, [pathname, searchParams, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentType = searchParams?.get("type");
  const currentGenre = searchParams?.get("genre");
  const currentCountry = searchParams?.get("country");

  const NAV_LINKS = [
    { 
      href: "/", 
      label: "Trang chủ", 
      isActive: pathname === "/" && (!searchParams || searchParams.toString() === "") 
    },
    { 
      href: "/tim-kiem?type=series", 
      label: "Phim bộ", 
      isActive: pathname === "/tim-kiem" ? currentType === "series" : pathname === "/danh-sach/phim-bo" 
    },
    { 
      href: "/tim-kiem?type=single", 
      label: "Phim lẻ", 
      isActive: pathname === "/tim-kiem" ? currentType === "single" : pathname === "/danh-sach/phim-le" 
    },
    { 
      href: "/tim-kiem?type=tv-shows", 
      label: "TV Shows", 
      isActive: pathname === "/tim-kiem" ? currentType === "tv-shows" : pathname === "/danh-sach/tv-shows" 
    },
    { 
      href: "/tim-kiem?genre=hoat-hinh", 
      label: "Hoạt hình", 
      isActive: pathname === "/tim-kiem" ? currentGenre === "hoat-hinh" : pathname === "/the-loai/hoat-hinh" 
    },
    { 
      href: "/lich-chieu", 
      label: "Lịch chiếu", 
      isActive: pathname === "/lich-chieu" 
    },
  ];

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const initialLetter = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : "U";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative h-full w-[85%] max-w-sm bg-[#121216] border-r border-white/10 p-5 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-left duration-250">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink"
          >
            <PlayIcon className="h-6 w-6 text-accent" />
            PHIM HAY
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* User Status Block */}
        <div className="mt-4 border-b border-white/10 pb-4">
          {isAuthenticated && user ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/10 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-accent">{initialLetter}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{user.name}</span>
                    {user.subscriptionType === "vip" && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-white/50">{user.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Link
                  href="/thu-vien"
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <BookmarkIcon className="h-3.5 w-3.5 text-white/50" />
                  <span>Tủ phim</span>
                </Link>
                <Link
                  href="/lich-su"
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <LibraryIcon className="h-3.5 w-3.5 text-white/50" />
                  <span>Lịch sử</span>
                </Link>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 cursor-pointer"
              >
                <LoginIcon className="h-3.5 w-3.5 rotate-180" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dang-nhap"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-xs font-bold text-white shadow-md shadow-accent/20 transition hover:bg-accent/90"
              >
                <LoginIcon className="h-4 w-4" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                href="/dang-ky"
                onClick={onClose}
                className="flex items-center justify-center rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
              >
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="mt-4 space-y-1.5 flex-1">
          {NAV_LINKS.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  item.isActive
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Collapsible Thể Loại */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setOpenGenres((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white transition"
            >
              <span>Thể loại</span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${
                  openGenres ? "rotate-180 text-accent" : "text-white/50"
                }`}
              />
            </button>
            {openGenres && (
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-xl bg-surface/80 p-2.5 border border-white/5 animate-in fade-in duration-150">
                {GENRES.map((g) => {
                  const isActive = (pathname === "/tim-kiem" && currentGenre === g.slug) || pathname === `/the-loai/${g.slug}`;
                  return (
                    <Link
                      key={g.slug}
                      href={`/tim-kiem?genre=${g.slug}`}
                      onClick={onClose}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "bg-accent text-white font-semibold"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {g.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collapsible Quốc Gia */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setOpenCountries((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white transition"
            >
              <span>Quốc gia</span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${
                  openCountries ? "rotate-180 text-accent" : "text-white/50"
                }`}
              />
            </button>
            {openCountries && (
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-xl bg-surface/80 p-2.5 border border-white/5 animate-in fade-in duration-150">
                {COUNTRIES.map((c) => {
                  const isActive = (pathname === "/tim-kiem" && currentCountry === c.slug) || pathname === `/quoc-gia/${c.slug}`;
                  return (
                    <Link
                      key={c.slug}
                      href={`/tim-kiem?country=${c.slug}`}
                      onClick={onClose}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "bg-accent text-white font-semibold"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer info in drawer */}
        <div className="mt-auto border-t border-white/10 pt-4 text-center text-xs text-white/40">
          <p>© 2026 WebPhim Hay. Xem phim miễn phí chuẩn HD/4K.</p>
        </div>
      </div>
    </div>
  );
}
