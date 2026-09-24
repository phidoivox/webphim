"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CommandIcon,
  FilmIcon,
  HomeIcon,
  LayersIcon,
  LoginIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  UserIcon,
  XIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "navigation" | "actions" | "search";
  icon: React.ElementType;
  href?: string;
  badge?: string;
  onSelect?: () => void;
}

export interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCommandPalette({
  isOpen,
  onClose,
}: AdminCommandPaletteProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Master command list
  const allCommands = useMemo<CommandItem[]>(() => {
    return [
      // Navigation
      {
        id: "nav-overview",
        title: "Tổng Quan Dashboard",
        subtitle: "Bảng điều khiển và thống kê toàn hệ thống",
        category: "navigation",
        icon: HomeIcon,
        href: "/admin",
      },
      {
        id: "nav-movies",
        title: "Quản Lý Phim",
        subtitle: "Danh sách phim, tập phim, máy chủ streaming",
        category: "navigation",
        icon: FilmIcon,
        href: "/admin/movies",
      },
      {
        id: "nav-genres",
        title: "Quản Lý Thể Loại",
        subtitle: "Danh mục thể loại phim và liên kết phân loại",
        category: "navigation",
        icon: LayersIcon,
        href: "/admin/genres",
      },
      {
        id: "nav-countries",
        title: "Quản Lý Quốc Gia",
        subtitle: "Danh sách quốc gia sản xuất phim",
        category: "navigation",
        icon: TagIcon,
        href: "/admin/countries",
      },
      {
        id: "nav-users",
        title: "Quản Lý Người Dùng",
        subtitle: "Danh sách tài khoản, phân quyền quản trị",
        category: "navigation",
        icon: UserIcon,
        href: "/admin/users",
      },
      {
        id: "nav-reports",
        title: "Báo Lỗi & Sự Cố",
        subtitle: "Danh sách sự cố tập phim do người dùng gửi",
        category: "navigation",
        icon: SparklesIcon,
        href: "/admin/reports",
        badge: "Sự cố",
      },

      // Actions
      {
        id: "act-create-movie",
        title: "Thêm Phim Mới",
        subtitle: "Tạo bản ghi phim mới kèm tập phim & server",
        category: "actions",
        icon: PlusIcon,
        href: "/admin/movies/create",
        badge: "+ New",
      },
      {
        id: "act-home",
        title: "Về Trang Chủ Xem Phim",
        subtitle: "Chuyển sang giao diện người dùng xem phim",
        category: "actions",
        icon: HomeIcon,
        href: "/",
      },
      {
        id: "act-logout",
        title: "Đăng Xuất Tài Khoản",
        subtitle: "Thoát phiên đăng nhập quản trị hiện tại",
        category: "actions",
        icon: LoginIcon,
        onSelect: () => logout(),
      },
    ];
  }, [logout]);

  // Filter commands by search term
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return allCommands;
    const q = search.toLowerCase().trim();
    const matches = allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle?.toLowerCase().includes(q)
    );

    // Dynamic search option if query entered
    const dynamicSearchItem: CommandItem = {
      id: "search-movie-query",
      title: `Tìm phim với từ khóa "${search}"`,
      subtitle: "Xem kết quả trong trang Quản lý phim",
      category: "search",
      icon: SearchIcon,
      href: `/admin/movies?q=${encodeURIComponent(search)}`,
      badge: "Tìm kiếm",
    };

    return [dynamicSearchItem, ...matches];
  }, [search, allCommands]);

  // Handle execution of item
  const handleExecute = (item: CommandItem) => {
    onClose();
    if (item.onSelect) {
      item.onSelect();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const currentItem = filteredCommands[selectedIndex];
      if (currentItem) {
        handleExecute(currentItem);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#0f121a] shadow-2xl backdrop-blur-xl transition-all"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-white/10 px-4">
          <SearchIcon className="h-5 w-5 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Gõ lệnh, tìm trang hoặc tìm phim... (VD: Phim, Thể loại, User)"
            className="h-14 w-full bg-transparent px-3 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-slate-400 hover:text-white p-1"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white ml-2"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-white/5"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Không tìm thấy lệnh hoặc trang phù hợp với &ldquo;{search}&rdquo;.
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              const Icon = cmd.icon;

              return (
                <div
                  key={cmd.id}
                  onClick={() => handleExecute(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-xs transition cursor-pointer ${
                    isSelected
                      ? "bg-accent text-white shadow-md shadow-accent/20"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                        isSelected
                          ? "border-white/30 bg-white/20 text-white"
                          : "border-white/10 bg-white/5 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? "text-white/80" : "text-slate-500"
                          }`}
                        >
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.badge && (
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          isSelected
                            ? "bg-white/25 text-white"
                            : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {cmd.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRightIcon className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-2.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                ↑
              </kbd>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                ↓
              </kbd>{" "}
              Di chuyển
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                ↵
              </kbd>{" "}
              Chọn
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                ESC
              </kbd>{" "}
              Đóng
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-accent">
            <CommandIcon className="h-3.5 w-3.5" />
            <span>WebPhim Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
