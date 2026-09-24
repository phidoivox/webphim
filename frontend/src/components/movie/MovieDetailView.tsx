"use client";

import { useMemo, useState, useOptimistic, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  PlayIcon,
  ServerIcon,
  ShareIcon,
  TagIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";

import EpisodeGrid from "@/components/movie/EpisodeGrid";
import CommentSection from "@/components/movie/comments/CommentSection";
import CarouselRow from "@/components/home/CarouselRow";
import MovieGallerySection from "@/components/movie/MovieGallerySection";
import type { CarouselSection, MovieDetail } from "@/types/movie";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { QualityBadge } from "@/components/ui/QualityBadge";
import { ServerIconComponent, getServerIcon } from "@/components/movie/ServerBadge";
import { useBookmark } from "@/hooks/useBookmark";

const TYPE_LABEL: Record<string, string> = {
  series: "Phim Bộ",
  single: "Phim Lẻ",
  "tv-show": "TV Show",
};

const TABS = ["Tập phim", "Gallery", "Diễn viên", "Đề xuất"] as const;
type TabKey = (typeof TABS)[number];

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MovieDetailView({ movie }: { movie: MovieDetail }) {
  const slug = movie.slug;
  const { isFavorite: baseFavorite, isWatchLater: baseWatchLater, toggleBookmark } = useBookmark(movie.id);

  // React 19 useOptimistic for 0ms interaction
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(
    Boolean(baseFavorite),
    (current) => !current
  );

  const [optimisticWatchLater, setOptimisticWatchLater] = useOptimistic(
    Boolean(baseWatchLater),
    (current) => !current
  );

  const [activeTab, setActiveTab] = useState<TabKey>("Tập phim");
  const [selectedServerKey, setSelectedServerKey] = useState<string | null>(null);

  // Tính toán danh sách Máy chủ thực tế từ dữ liệu tập phim (episodes)
  const servers = useMemo(() => {
    if (!movie?.episodes || movie.episodes.length === 0) return [];

    const map = new Map<string, { name: string; langType?: string; count: number }>();

    for (const ep of movie.episodes) {
      if (!ep.servers || ep.servers.length === 0) continue;
      for (const s of ep.servers) {
        const name = s.serverName?.trim() || "Mặc định";
        const existing = map.get(name);
        if (existing) {
          existing.count += 1;
          if (!existing.langType && s.langType) existing.langType = s.langType;
        } else {
          map.set(name, {
            name,
            langType: s.langType,
            count: 1,
          });
        }
      }
    }

    return Array.from(map.values()).map((s) => ({
      key: s.name,
      name: s.name,
      langType: s.langType,
      icon: getServerIcon(s.name, s.langType),
      count: s.count,
    }));
  }, [movie]);

  const handleSelectServer = (serverName: string) => {
    setSelectedServerKey(serverName);
    if (typeof window !== "undefined") {
      localStorage.setItem(`server_${slug}`, serverName);
      localStorage.setItem("preferred_server_name", serverName);
    }
  };

  const activeServer = useMemo(() => {
    if (servers.length === 0) return null;
    if (selectedServerKey) {
      const found = servers.find((s) => s.key === selectedServerKey);
      if (found) return found;
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`server_${slug}`) || localStorage.getItem("preferred_server_name");
      if (saved) {
        const found = servers.find((s) => s.name === saved);
        if (found) return found;
      }
    }
    return servers[0];
  }, [servers, selectedServerKey, slug]);

  // Lọc danh sách tập theo máy chủ đang chọn
  const filteredEpisodes = useMemo(() => {
    if (!movie?.episodes) return [];
    if (!activeServer) return movie.episodes;
    return movie.episodes.filter((ep) =>
      ep.servers?.some((s) => (s.serverName?.trim() || "Mặc định") === activeServer.name)
    );
  }, [movie, activeServer]);

  const firstEpisode = movie.episodes[0];
  const firstEpisodeSlug = firstEpisode?.slug;
  const similarSection: CarouselSection = { id: "similar", title: "Phim tương tự", movies: movie.similar };

  const episodeLabel = movie.episodeCurrent
    ? movie.episodeTotal
      ? `Hoàn tất (${movie.episodeCurrent}/${movie.episodeTotal})`
      : movie.episodeCurrent
    : movie.episodeTotal
      ? `Hoàn tất (${movie.episodeTotal}/${movie.episodeTotal})`
      : "Hoàn tất (12/12)";

  const handleShareMovie = async () => {

    const shareData = {
      title: `${movie.name} (${movie.year || 2026}) | WebPhim`,
      text: movie.content ? movie.content.slice(0, 120) + "..." : `Xem phim ${movie.name} Full HD Vietsub miễn phí.`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Đã sao chép liên kết phim vào clipboard!");
        }
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết phim vào clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e12] text-gray-100 pb-20">

      {/* ═══════════════ TOP BACKDROP OVERLAY ═══════════════ */}
      <div className="relative w-full">
        {/* Backdrop Background Image */}
        <div className="absolute inset-0 h-[460px] lg:h-[520px] overflow-hidden pointer-events-none">
          <Image
            src={movie.thumbUrl || movie.posterUrl}
            alt={movie.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter blur-[1px] opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e12]/50 via-[#0e0e12]/80 to-[#0e0e12] z-10" />
        </div>

        {/* ═══════════════ MAIN CONTENT GRID ═══════════════ */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-10 pt-20 lg:pt-24">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* ── LEFT COLUMN: Poster & Description ── */}
            <div className="w-full sm:w-64 lg:w-[260px] shrink-0 space-y-6">
              
              {/* Poster Card */}
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#16171f]">
                <Image
                  src={movie.posterUrl}
                  alt={movie.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 256px, 260px"
                  className="object-cover"
                />
              </div>

              {/* Nội dung phim (Below poster) */}
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-white text-base">Nội dung phim</h3>
                <p className="text-xs leading-relaxed text-gray-300">
                  {movie.content || "Một công tố viên đầy tham vọng bị mất trí nhớ và chuyển đến sống cùng một huấn luyện viên quyền Anh tự nhận là bạn trai cô. Liệu tình huống éo le này có dẫn đến tình yêu đích thực?"}
                </p>
              </div>

            </div>

            {/* ── RIGHT COLUMN: Info, Badges, Meta, Actions, Tabs & Episode Content ── */}
            <div className="flex-1 min-w-0 space-y-6">
              
              {/* Title & Original Subtitle */}
              <div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {movie.name}
                </h1>
                {movie.originName && (
                  <p className="mt-1 text-sm text-gray-400 font-medium">{movie.originName}</p>
                )}
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                {/* TMDb Rating Badge */}
                <RatingBadge provider="TMDb" rating={movie.ratingAvg || "8.0"} />

                {/* IMDb Rating Badge */}
                <RatingBadge provider="IMDb" rating={movie.imdbRating || "8.5"} />

                {/* Quality Badge (4K / HD / CAM) */}
                <QualityBadge quality={movie.quality || "4K"} />

                {/* Subtitle / Language Badge */}
                {movie.lang && (
                  <span className="px-2 py-0.5 rounded-md border border-white/20 text-white font-medium bg-black/40 backdrop-blur-sm shadow-xs text-[10px] sm:text-[11px]">
                    {movie.lang}
                  </span>
                )}

                {/* Episode Status Badge */}
                <span className="px-2 py-0.5 rounded-md border border-white/20 text-white font-medium bg-black/40 backdrop-blur-sm shadow-xs text-[10px] sm:text-[11px]">
                  {episodeLabel}
                </span>
              </div>

              {/* Metadata 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 text-xs sm:text-sm text-gray-300 max-w-xl">
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 min-w-[70px]">Trạng thái:</span>
                  <span className="text-white font-medium">{episodeLabel}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 min-w-[70px]">Loại:</span>
                  <span className="text-white font-medium">{TYPE_LABEL[movie.type] ?? movie.type}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 min-w-[70px]">Năm:</span>
                  <span className="text-white font-medium">{movie.year || 2026}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 min-w-[70px]">Thời lượng:</span>
                  <span className="text-white font-medium">
                    {movie.durationMinutes ? `${movie.durationMinutes} phút / tập` : "60 phút / tập"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 min-w-[70px]">Thể loại:</span>
                  <span className="text-white font-medium">
                    {movie.genres.length > 0 ? movie.genres.join(", ") : "Hài Hước, Chính Kịch"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-gray-400 min-w-[70px]">Quốc gia:</span>
                  <span className="text-white font-medium">
                    {movie.countries.length > 0 ? movie.countries.join(", ") : "Hàn Quốc"}
                  </span>
                </div>

                {movie.credits?.directors && movie.credits.directors.length > 0 && (
                  <div className="flex items-baseline gap-2 sm:col-span-2">
                    <span className="text-gray-400 min-w-[70px]">Đạo diễn:</span>
                    <span className="text-white font-medium">
                      {movie.credits.directors.map((d) => d.name).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                
                {/* Orange Xem ngay Button */}
                <Link
                  href={firstEpisodeSlug ? `/xem/${movie.slug}/${firstEpisodeSlug}` : `/xem/${movie.slug}`}
                  className="flex items-center gap-2 rounded-full bg-accent hover:bg-accent-hover px-7 py-2.5 text-sm font-extrabold text-white transition-transform hover:scale-105 active:scale-95 shadow-md shadow-accent/30"
                >
                  <PlayIcon className="h-4 w-4 fill-current ml-0.5" />
                  <span>Xem ngay</span>
                </Link>

                {/* Dark Trailer Button */}
                <a
                  href={movie.trailerUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[#27272a] hover:bg-[#3f3f46] px-6 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
                >
                  <span>Trailer</span>
                </a>

                {/* Quick Action Icons */}
                <div className="flex items-center gap-5 ml-2">
                  {/* Yêu thích (favorite) */}
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(async () => {
                        setOptimisticFavorite(null);
                        await toggleBookmark(
                          {
                            id: movie.id,
                            name: movie.name,
                            originName: movie.originName,
                            slug: movie.slug,
                            posterUrl: movie.posterUrl,
                            thumbUrl: movie.thumbUrl,
                            year: movie.year,
                            quality: typeof movie.quality === "string" ? movie.quality : undefined,
                            ratingAvg: movie.ratingAvg,
                            genres: movie.genres,
                          },
                          "favorite"
                        );
                      });
                    }}
                    className="flex flex-col items-center gap-1 text-[11px] text-gray-300 hover:text-white transition-all transform active:scale-90 cursor-pointer group"
                    title={optimisticFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                  >
                    <HeartIcon
                      className={`h-5 w-5 transition-all duration-150 ${
                        optimisticFavorite
                          ? "fill-rose-500 text-rose-500 scale-110"
                          : "group-hover:scale-110 text-gray-300 group-hover:text-white"
                      }`}
                    />
                    <span className={optimisticFavorite ? "font-bold text-rose-400" : ""}>
                      {optimisticFavorite ? "Đã thích" : "Yêu thích"}
                    </span>
                  </button>

                  {/* Lưu vào tủ phim / Xem sau (watchlater) */}
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(async () => {
                        setOptimisticWatchLater(null);
                        await toggleBookmark(
                          {
                            id: movie.id,
                            name: movie.name,
                            originName: movie.originName,
                            slug: movie.slug,
                            posterUrl: movie.posterUrl,
                            thumbUrl: movie.thumbUrl,
                            year: movie.year,
                            quality: typeof movie.quality === "string" ? movie.quality : undefined,
                            ratingAvg: movie.ratingAvg,
                            genres: movie.genres,
                          },
                          "watchlater"
                        );
                      });
                    }}
                    className="flex flex-col items-center gap-1 text-[11px] text-gray-300 hover:text-white transition-all transform active:scale-90 cursor-pointer group"
                    title={optimisticWatchLater ? "Bỏ lưu khỏi tủ phim" : "Lưu vào tủ phim"}
                  >
                    <BookmarkIcon
                      className={`h-5 w-5 transition-all duration-150 ${
                        optimisticWatchLater
                          ? "fill-accent text-accent scale-110"
                          : "group-hover:scale-110 text-gray-300 group-hover:text-white"
                      }`}
                    />
                    <span className={optimisticWatchLater ? "font-bold text-accent" : ""}>
                      {optimisticWatchLater ? "Trong tủ" : "Lưu tủ"}
                    </span>
                  </button>

                  {/* Bình luận */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("Tập phim");
                      const el = document.getElementById("comments-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex flex-col items-center gap-1 text-[11px] text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <MessageCircleIcon className="h-5 w-5" />
                    <span>Bình luận</span>
                  </button>

                  {/* Chia sẻ Native Web Share */}
                  <button
                    type="button"
                    onClick={handleShareMovie}
                    className="flex flex-col items-center gap-1 text-[11px] text-gray-300 hover:text-white transition-all transform active:scale-90 cursor-pointer group"
                    title="Chia sẻ phim"
                  >
                    <ShareIcon className="h-5 w-5 group-hover:scale-110 text-gray-300 group-hover:text-white transition-all" />
                    <span>Chia sẻ</span>
                  </button>
                </div>


              </div>

              {/* Tags / Hashtags Bar */}
              {movie.tags && movie.tags.length > 0 && (
                <div className="pt-3 pb-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-gray-400 font-bold mr-1 shrink-0">
                    <TagIcon className="h-3.5 w-3.5 text-accent" />
                    <span>Hashtags:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {movie.tags.map((t: { name: string } | string, idx: number) => {
                      const tagName = typeof t === "string" ? t : t.name;
                      return (
                        <Link
                          key={idx}
                          href={`/tim-kiem?q=${encodeURIComponent(tagName)}`}
                          className="inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.04] hover:border-accent/40 hover:bg-accent/10 px-2 py-0.5 font-medium text-slate-300 hover:text-white transition shadow-xs cursor-pointer group"
                        >
                          <span className="text-accent font-bold">#</span>
                          <span>{tagName}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══════════════ TABS BAR ═══════════════ */}
              <div className="border-b border-white/10 pt-4">
                <nav className="flex gap-6 text-sm font-bold">
                  {TABS.map((tab) => {
                    const count =
                      tab === "Diễn viên"
                        ? (movie.credits?.actors?.length || 0) + (movie.credits?.directors?.length || 0)
                        : tab === "Gallery"
                          ? movie.gallery?.length || 0
                          : null;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`relative pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
                          activeTab === tab
                            ? "text-accent"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        <span>{tab}</span>
                        {count !== null && count > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                              activeTab === tab
                                ? "bg-accent/20 text-accent font-bold"
                                : "bg-white/10 text-gray-400"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                        {activeTab === tab && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* ═══════════════ TAB CONTENT ═══════════════ */}
              <div className="pt-2 space-y-8">
                
                {/* ── TAB 1: TẬP PHIM ── */}
                {activeTab === "Tập phim" && (
                  <div className="space-y-6">
                    
                    {/* Máy chủ Selector Row */}
                    {servers.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-gray-400 flex items-center gap-2 mr-1">
                          <ServerIcon className="h-4 w-4 text-gray-400" />
                          Máy chủ:
                        </span>
                        {servers.map((server) => {
                          const isSelected = activeServer?.key === server.key;
                          return (
                            <button
                              key={server.key}
                              type="button"
                              onClick={() => handleSelectServer(server.key)}
                              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? "border-white/50 bg-[#161824] text-white font-bold shadow-md"
                                  : "border-white/5 bg-[#12131b] text-gray-400 hover:bg-[#181924] hover:text-gray-200"
                              }`}
                            >
                              <ServerIconComponent
                                name={server.name}
                                langType={server.langType}
                                isSelected={isSelected}
                              />
                              <span>{server.name}</span>
                              <span
                                className={`flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold transition-colors ${
                                  isSelected
                                    ? "bg-white text-black font-black"
                                    : "bg-white/10 text-gray-400"
                                }`}
                              >
                                {server.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Danh sách tập Header */}
                    <div className="space-y-3 pt-2">
                      <h2 className="text-base font-bold text-white tracking-tight">
                        Danh sách tập ( <span className="text-white">{filteredEpisodes.length}</span> / <span className="text-amber-400 font-extrabold">{movie.episodeTotal || movie.episodes.length}</span> )
                      </h2>

                      {/* Episode Grid Component */}
                      <EpisodeGrid
                        episodes={filteredEpisodes.length > 0 ? filteredEpisodes : movie.episodes}
                        baseHref={`/xem/${movie.slug}`}
                      />
                    </div>

                    {/* Comments Section */}
                    <CommentSection movieId={movie.id} />
                  </div>
                )}

                {/* ── TAB 2: GALLERY ── */}
                {activeTab === "Gallery" && (
                  <MovieGallerySection
                    gallery={movie.gallery}
                    fallbackImages={{
                      thumbUrl: movie.thumbUrl,
                      posterUrl: movie.posterUrl,
                      trailerUrl: movie.trailerUrl,
                    }}
                    movieName={movie.name}
                  />
                )}

                {/* ── TAB 3: DIỄN VIÊN ── */}
                {activeTab === "Diễn viên" && (
                  <div className="space-y-10 animate-fade-in">
                    {/* Đạo diễn */}
                    {movie.credits?.directors && movie.credits.directors.length > 0 && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                          <h3 className="text-base font-bold text-white tracking-tight">
                            Đạo diễn
                          </h3>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300 font-mono">
                            {movie.credits.directors.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                          {movie.credits.directors.map((p, idx) => (
                            <div key={p.id || idx} className="group flex flex-col items-center text-center cursor-default">
                              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden bg-[#16171f] border-2 border-white/10 group-hover:border-accent group-hover:ring-4 group-hover:ring-accent/30 group-hover:shadow-[0_0_20px_rgba(255,92,26,0.35)] transition-all duration-300 shadow-lg">
                                {p.avatarUrl ? (
                                  <Image
                                    src={p.avatarUrl}
                                    alt={p.name}
                                    fill
                                    sizes="(max-width: 640px) 96px, 112px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1b332b] to-[#12141c] text-emerald-300 font-extrabold text-xl select-none">
                                    {getInitials(p.name)}
                                  </div>
                                )}
                              </div>
                              <p
                                className="mt-3 text-sm sm:text-base font-bold text-white text-center break-words w-full px-1 leading-snug"
                                style={{ color: "#ffffff" }}
                              >
                                {p.name}
                              </p>
                              <p
                                className="mt-1 text-xs text-gray-400 text-center leading-tight"
                                style={{ color: "#9ca3af" }}
                              >
                                Đạo diễn
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diễn viên */}
                    {movie.credits?.actors && movie.credits.actors.length > 0 ? (
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                          <h3 className="text-base font-bold text-white tracking-tight">
                            Dàn diễn viên
                          </h3>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300 font-mono">
                            {movie.credits.actors.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                          {movie.credits.actors.map((p, idx) => (
                            <div key={p.id || idx} className="group flex flex-col items-center text-center cursor-default">
                              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden bg-[#16171f] border-2 border-white/10 group-hover:border-accent group-hover:ring-4 group-hover:ring-accent/30 group-hover:shadow-[0_0_20px_rgba(255,92,26,0.35)] transition-all duration-300 shadow-lg">
                                {p.avatarUrl ? (
                                  <Image
                                    src={p.avatarUrl}
                                    alt={p.name}
                                    fill
                                    sizes="(max-width: 640px) 96px, 112px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#252a3b] to-[#12141c] text-white font-extrabold text-xl select-none">
                                    {getInitials(p.name)}
                                  </div>
                                )}
                              </div>
                              <p
                                className="mt-3 text-sm sm:text-base font-bold text-white text-center break-words w-full px-1 leading-snug"
                                style={{ color: "#ffffff" }}
                              >
                                {p.name}
                              </p>
                              {p.characterName ? (
                                <p
                                  className="mt-1 text-xs text-gray-400 text-center break-words w-full px-1 leading-tight"
                                  style={{ color: "#9ca3af" }}
                                >
                                  {p.characterName}
                                </p>
                              ) : (
                                <p
                                  className="mt-1 text-xs text-gray-400 text-center leading-tight"
                                  style={{ color: "#9ca3af" }}
                                >
                                  Diễn viên
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      (!movie.credits?.directors || movie.credits.directors.length === 0) && (
                        <div className="py-12 text-center">
                          <p className="text-sm text-gray-400">
                            Chưa có thông tin danh sách diễn viên cho bộ phim này.
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* ── TAB 4: ĐỀ XUẤT ── */}
                {activeTab === "Đề xuất" && (
                  <div>
                    {movie.similar.length > 0 ? (
                      <CarouselRow section={similarSection} />
                    ) : (
                      <p className="text-sm text-gray-400 py-6">Chưa có phim đề xuất.</p>
                    )}
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
