"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  BookmarkIcon,
  LibraryIcon,
  LoginIcon,
  UserIcon,
} from "@/components/ui/icons";

export default function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  // Lấy chữ cái đầu của tên làm Avatar mặc định
  const initialLetter = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : "U";

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu người dùng"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 transition-all hover:border-accent/60 hover:bg-white/20 hover:text-white cursor-pointer overflow-hidden"
      >
        {isAuthenticated && user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : isAuthenticated && user ? (
          <span className="text-xs font-bold text-accent">{initialLetter}</span>
        ) : (
          <UserIcon className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/15 bg-[#14141a]/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
          {isAuthenticated && user ? (
            <>
              {/* Header User Profile Info */}
              <div className="border-b border-white/10 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="truncate font-semibold text-sm text-white">
                    {user.name}
                  </div>
                  {user.subscriptionType === "vip" && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                      VIP
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-white/50">{user.email}</div>
              </div>

              {/* Links */}
              <div className="py-1.5 space-y-0.5">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <UserIcon className="h-4 w-4 text-white/50" />
                  <span>Hồ sơ & Bộ sưu tập</span>
                </Link>

                <Link
                  href="/thu-vien"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <BookmarkIcon className="h-4 w-4 text-white/50" />
                  <span>Tủ phim đã lưu</span>
                </Link>

                <Link
                  href="/lich-su"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <LibraryIcon className="h-4 w-4 text-white/50" />
                  <span>Lịch sử xem</span>
                </Link>

                {(user.role === "admin" || user.role === "moderator") && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl bg-accent/15 border border-accent/30 px-3 py-2 text-xs font-bold text-accent transition hover:bg-accent/25"
                  >
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span>Trang Quản Trị (Admin)</span>
                  </Link>
                )}

                <Link
                  href="/vip"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-400/10"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/20 text-[10px] font-bold text-amber-400">
                    ★
                  </span>
                  <span>Nâng cấp VIP</span>
                </Link>
              </div>

              {/* Logout Button */}
              <div className="border-t border-white/10 pt-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                >
                  <LoginIcon className="h-4 w-4 rotate-180" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Guest state */}
              <div className="px-3 py-2 text-xs text-white/60">
                Đăng nhập để lưu phim và đồng bộ tiến trình xem trên mọi thiết bị.
              </div>

              <div className="space-y-1.5 pt-1">
                <Link
                  href="/dang-nhap"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2 text-xs font-bold text-white shadow-md shadow-accent/20 transition hover:bg-accent/90"
                >
                  <LoginIcon className="h-4 w-4" />
                  <span>Đăng nhập</span>
                </Link>

                <Link
                  href="/dang-ky"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                >
                  <span>Đăng ký tài khoản</span>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
