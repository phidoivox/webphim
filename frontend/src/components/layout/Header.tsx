"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MenuIcon, PlayIcon, SearchIcon, StarIcon, UserIcon, XIcon } from "@/components/ui/icons";
import { searchLiveSuggestions } from "@/lib/api";
import type { ActorSummary, MovieSummary } from "@/types/movie";
import { useDebounce } from "@/hooks/useDebounce";
import GenreDropdown from "./GenreDropdown";
import CountryDropdown from "./CountryDropdown";
import MobileNavDrawer from "./MobileNavDrawer";
import NotificationDropdown from "./NotificationDropdown";
import UserMenu from "./UserMenu";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/tim-kiem?type=series", label: "Phim bộ", paramKey: "type", paramValue: "series", fallbackHref: "/danh-sach/phim-bo" },
  { href: "/tim-kiem?type=single", label: "Phim lẻ", paramKey: "type", paramValue: "single", fallbackHref: "/danh-sach/phim-le" },
];

const NAV_AFTER = [
  { href: "/tim-kiem?type=tv-shows", label: "TV Shows", paramKey: "type", paramValue: "tv-shows", fallbackHref: "/danh-sach/tv-shows" },
  { href: "/tim-kiem?genre=hoat-hinh", label: "Hoạt hình", paramKey: "genre", paramValue: "hoat-hinh", fallbackHref: "/the-loai/hoat-hinh" },
  { href: "/lich-chieu", label: "Lịch chiếu", fallbackHref: "/lich-chieu" },
];

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function getScrollSnapshot(): boolean {
  return window.scrollY > 20;
}

function getServerScrollSnapshot(): boolean {
  return false;
}

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isScrolled = useSyncExternalStore(subscribeScroll, getScrollSnapshot, getServerScrollSnapshot);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 250);
  const [suggestions, setSuggestions] = useState<{ movies: MovieSummary[]; actors: ActorSummary[] }>({
    movies: [],
    actors: [],
  });
  const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setSuggestions({ movies: [], actors: [] });
      setIsOpenSuggestions(false);
    } else {
      setIsOpenSuggestions(true);
    }
  };

  // Live search theo debouncedQuery
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setSuggestions({ movies: [], actors: [] });
      setIsOpenSuggestions(false);
      return;
    }

    let isSubscribed = true;
    const controller = new AbortController();
    setIsLoading(true);
    setIsOpenSuggestions(true);

    searchLiveSuggestions(trimmed, 5, false, controller.signal)
      .then((results) => {
        if (isSubscribed) {
          setSuggestions(results || { movies: [], actors: [] });
          setIsOpenSuggestions(true);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (isSubscribed) {
          setSuggestions({ movies: [], actors: [] });
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
      controller.abort();
    };
  }, [debouncedQuery]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpenSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpenSuggestions(false);
    if (query.trim()) {
      router.push(`/tim-kiem?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/tim-kiem");
    }
  };

  const hasResults = suggestions.movies.length > 0 || suggestions.actors.length > 0;

  const isNavActive = (item: { href: string; label: string; paramKey?: string; paramValue?: string; fallbackHref?: string }) => {
    if (pathname === "/tim-kiem" && item.paramKey) {
      return searchParams?.get(item.paramKey) === item.paramValue;
    }
    return pathname === item.href || (Boolean(item.fallbackHref) && pathname === item.fallbackHref);
  };

  const isHomeActive = pathname === "/" && (!searchParams || searchParams.toString() === "");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Background 1: Trong suốt có Gradient mờ ở đỉnh */}
        <div
          className={`aria-hidden pointer-events-none absolute inset-0 hidden bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 md:block ${
            isScrolled ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Background 2: Nền đục màu tối có viền dưới nhẹ */}
        <div
          className={`aria-hidden pointer-events-none absolute inset-0 border-b border-elevated bg-surface/95 backdrop-blur-md transition-opacity duration-300 ${
            isScrolled ? "opacity-100" : "opacity-100 md:opacity-0"
          }`}
        />

        {/* Nội dung Header */}
        <div className="relative z-10 mx-auto flex h-14 max-w-[1600px] items-center gap-1.5 sm:gap-3 lg:gap-4 lg:h-16 px-2.5 sm:px-6 lg:px-8">
          {/* Nút Hamburger cho Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Mở menu điều hướng"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95 lg:hidden"
          >
            <MenuIcon className="h-5.5 w-5.5" />
          </button>

          {/* Logo Brand */}
          <Link
            href="/"
            className="flex shrink-0 whitespace-nowrap items-center gap-1.5 font-display text-base font-extrabold tracking-tight text-ink sm:text-lg lg:text-xl"
          >
            <PlayIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-accent shrink-0" />
            <span className="hidden xs:inline">PHIM HAY</span>
            <span className="xs:hidden">PHIM</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-0.5 xl:gap-1.5 lg:flex shrink-0" aria-label="Điều hướng chính">
            <Link
              href="/"
              className={`rounded-lg px-2.5 py-1.5 xl:px-3 xl:py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                isHomeActive
                  ? "bg-white/15 text-accent font-bold"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              Trang chủ
            </Link>

            {NAV_LINKS.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-2.5 py-1.5 xl:px-3 xl:py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? "bg-white/15 text-accent font-bold"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <GenreDropdown />
            <CountryDropdown />

            {NAV_AFTER.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-2.5 py-1.5 xl:px-3 xl:py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? "bg-white/15 text-accent font-bold"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Ô Tìm Kiếm Header với Live Dropdown */}
          <div ref={searchContainerRef} className="relative ml-auto flex items-center min-w-0">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <SearchIcon className="pointer-events-none absolute left-3 z-10 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/70" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => {
                  if (query.trim()) setIsOpenSuggestions(true);
                }}
                placeholder="Tìm phim..."
                className="h-8.5 sm:h-9 w-28 xs:w-36 sm:w-52 md:w-64 lg:w-72 xl:w-80 rounded-full border border-white/15 bg-white/10 pl-8 sm:pl-9 pr-7 sm:pr-8 text-xs text-white placeholder:text-white/50 backdrop-blur-md transition-all focus:border-accent focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-accent/40 sm:text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSuggestions({ movies: [], actors: [] });
                    setIsOpenSuggestions(false);
                  }}
                  className="absolute right-2.5 z-10 flex h-4 w-4 items-center justify-center rounded-full text-white/50 hover:text-white transition cursor-pointer"
                  aria-label="Xóa tìm kiếm"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* Dropdown Gợi Ý Tìm Kiếm Nhanh */}
            {isOpenSuggestions && (
              <div className="absolute top-full right-0 z-50 mt-2 max-h-[75vh] w-[calc(100vw-1.5rem)] sm:w-80 md:w-96 max-w-[380px] overflow-y-auto rounded-2xl border border-white/15 bg-[#14141a]/95 p-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                {isLoading ? (
                  <div className="space-y-2 p-1 select-none">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl p-2 bg-white/[0.02] border border-white/5 animate-shimmer"
                      >
                        <div className="h-12 w-9 shrink-0 rounded-md bg-white/10" />
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="h-3.5 w-4/5 rounded bg-white/15 animate-pulse" />
                          <div className="h-2.5 w-1/2 rounded bg-white/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasResults ? (
                  <div className="space-y-3">
                    {/* Mục PHIM */}
                    {suggestions.movies.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/40">
                          Phim
                        </div>
                        {suggestions.movies.map((item) => (
                          <Link
                            key={item.id}
                            href={`/phim/${item.slug}`}
                            onClick={() => setIsOpenSuggestions(false)}
                            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/10"
                          >
                            <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-800">
                              <Image
                                src={item.posterUrl}
                                alt={item.name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold text-white sm:text-sm">
                                {item.name}
                              </div>
                              <div className="truncate text-[11px] text-white/50">
                                {item.originName || `${item.year || 2026} • ${item.quality || "HD"}`}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/40">
                                <span>{item.year || 2026}</span>
                                <span>•</span>
                                <span>{item.quality || "HD"}</span>
                                {item.ratingAvg > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                                      <StarIcon className="h-2.5 w-2.5 fill-amber-400" />
                                      {item.ratingAvg.toFixed(1)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Mục DIỄN VIÊN */}
                    {suggestions.actors.length > 0 && (
                      <div className="space-y-1 border-t border-white/10 pt-2">
                        <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/40">
                          Diễn viên & Đạo diễn
                        </div>
                        {suggestions.actors.map((actor) => (
                          <Link
                            key={actor.id}
                            href={`/tim-kiem?q=${encodeURIComponent(actor.name)}`}
                            onClick={() => setIsOpenSuggestions(false)}
                            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/10"
                          >
                            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-800 border border-white/10">
                              {actor.avatarUrl ? (
                                <Image
                                  src={actor.avatarUrl}
                                  alt={actor.name}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/40">
                                  <UserIcon className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold text-white">
                                {actor.name}
                              </div>
                              <div className="truncate text-[10px] text-white/50">
                                {actor.knownFor ? `Phim: ${actor.knownFor}` : actor.role}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-2 px-1">
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="w-full rounded-xl bg-white/5 py-2 text-center text-xs font-semibold text-accent transition hover:bg-white/10"
                      >
                        Xem tất cả kết quả cho &ldquo;{query}&rdquo; &rarr;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-white/50">
                    Không tìm thấy kết quả nào cho &ldquo;{query}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu & Auth Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 min-h-[36px]">
            {mounted ? (
              isAuthenticated ? (
                <>
                  <NotificationDropdown />
                  <UserMenu />
                </>
              ) : (
                <Link
                  href="/dang-nhap"
                  className="flex items-center justify-center rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-95 cursor-pointer"
                >
                  Đăng nhập
                </Link>
              )
            ) : (
              <div className="h-8 w-20 rounded-full bg-white/5 animate-pulse" />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </>
  );
}
