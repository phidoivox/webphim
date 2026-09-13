"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import EpisodeGrid from "@/components/movie/EpisodeGrid";
import { QualityBadge } from "@/components/ui/QualityBadge";
import { GenreBadge } from "@/components/ui/GenreBadge";
import {
  ChevronRightIcon,
  ServerIcon,
  UserIcon,
} from "@/components/ui/icons";
import type { Credit, MovieDetail } from "@/types/movie";
import { ServerIconComponent } from "@/components/movie/ServerBadge";

const CommentSection = dynamic(() => import("@/components/movie/comments/CommentSection"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-xl bg-white/5" />,
});

// Dynamic import PlayerShell with SSR disabled to keep hls.js out of main bundle
const PlayerShell = dynamic(() => import("@/components/player/PlayerShell"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  ),
});

interface WatchViewClientProps {
  movie: MovieDetail;
  episodeSlug: string;
}

export default function WatchViewClient({ movie, episodeSlug }: WatchViewClientProps) {
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const episodesRef = useRef<HTMLDivElement>(null);

  // Tìm tập phim hiện tại
  const currentEpisode = movie.episodes?.find((e) => e.slug === episodeSlug) ?? null;

  // Đọc preference từ localStorage sau khi mount để tránh lỗi SSR hydration
  useEffect(() => {
    if (currentEpisode?.servers && currentEpisode.servers.length > 0 && selectedServerId === null) {
      try {
        const saved =
          localStorage.getItem(`server_${movie.slug}`) ||
          localStorage.getItem("preferred_server_name");
        if (saved) {
          const found = currentEpisode.servers.find(
            (s) => s.serverName?.trim().toLowerCase() === saved.trim().toLowerCase()
          );
          if (found) {
            setSelectedServerId(found.id);
          }
        }
      } catch {
        // Safe fallback for restricted storage environments
      }
    }
  }, [currentEpisode, movie.slug, selectedServerId]);

  // Active Server calculation
  const activeServer = useMemo(() => {
    if (!currentEpisode?.servers || currentEpisode.servers.length === 0) return null;

    if (selectedServerId !== null) {
      const found = currentEpisode.servers.find((s) => s.id === selectedServerId);
      if (found) return found;
    }

    return currentEpisode.servers[0] ?? null;
  }, [currentEpisode, selectedServerId]);

  // Fallback cast data if movie has actors
  const castList: Credit[] =
    movie.credits?.actors && movie.credits.actors.length > 0
      ? movie.credits.actors
      : [
          { id: 1, name: "Zoey Deutch", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", characterName: "(voice)" },
          { id: 2, name: "Christoph W.", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", characterName: "Max (voice)" },
          { id: 3, name: "Jeff Bridges", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", characterName: "(voice)" },
          { id: 4, name: "Jesse E.", avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80", characterName: "(voice)" },
          { id: 5, name: "Allison J.", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80", characterName: "(voice)" },
          { id: 6, name: "Phil LaMarr", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80", characterName: "(voice)" },
        ];

  const handleSelectServer = (serverId: number, serverName: string) => {
    setSelectedServerId(serverId);
    try {
      localStorage.setItem(`server_${movie.slug}`, serverName);
      localStorage.setItem("preferred_server_name", serverName);
    } catch {
      // Ignore storage errors
    }
  };

  const scrollToEpisodes = () => {
    episodesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!currentEpisode) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-10">
        <p className="text-sm text-muted">Không tìm thấy tập phim yêu cầu.</p>
        <Link
          href={`/phim/${movie.slug}`}
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
        >
          Về trang chi tiết
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base pb-20 pt-14 lg:pt-16">
      {/* 1. TOP PLAYER CONTAINER */}
      <div className="bg-[#0b0c10] border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
          {/* Video Player Box */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/15 shadow-2xl">
            <PlayerShell
              src={activeServer?.linkM3u8 ?? null}
              embedUrl={activeServer?.linkEmbed ?? null}
              title={`${movie.name} - ${currentEpisode.name}`}
              autoPlay={true}
              episodes={movie.episodes}
              baseHref={`/xem/${movie.slug}`}
              currentSlug={episodeSlug}
              posterUrl={movie.thumbUrl || movie.posterUrl}
              movieName={movie.name}
              movieId={movie.id}
              episodeId={currentEpisode.id}
              serverId={activeServer ? Number(activeServer.id) : undefined}
              movieSlug={movie.slug}
              episodeName={currentEpisode.name}
              servers={currentEpisode.servers}
              selectedServerId={activeServer ? String(activeServer.id) : undefined}
              onSelectServer={(serverId) => {
                const sFound = currentEpisode.servers.find((s) => String(s.id) === String(serverId));
                if (sFound) {
                  handleSelectServer(sFound.id, sFound.serverName);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER (2 COLUMNS: LEFT 70%, RIGHT 30%) */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-8">
          
          {/* LEFT COLUMN: Notices, Movie Details, Server Selector & Episode List */}
          <div className="space-y-6">
            
            {/* NOTICE BANNER 1: Yellow Warning Callout */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 shadow-lg">
              <span className="text-base shrink-0">⚠️</span>
              <p className="leading-relaxed">
                Phim bị lỗi âm thanh, giật lag, chất lượng kém? Vui lòng chuyển sang{" "}
                <button type="button" onClick={scrollToEpisodes} className="font-bold text-amber-300 underline hover:text-amber-100">
                  Máy chủ Dự phòng
                </button>{" "}
                bên dưới.
              </p>
            </div>

            {/* MOVIE INFO CARD (Poster + Title + Badges + Description) */}
            <div className="rounded-2xl bg-surface/70 border border-white/10 p-5 backdrop-blur-md shadow-xl">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                
                {/* Poster 2:3 Thumbnail */}
                <Link
                  href={`/phim/${movie.slug}`}
                  className="group relative shrink-0 w-28 sm:w-36 aspect-[2/3] overflow-hidden rounded-xl bg-surface border border-white/10 shadow-lg"
                >
                  <Image
                    src={movie.posterUrl}
                    alt={movie.name}
                    fill
                    sizes="(max-width: 640px) 112px, 144px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <span className="text-[11px] font-bold text-white bg-accent px-2.5 py-1 rounded-md shadow">
                      Chi tiết
                    </span>
                  </div>
                </Link>

                {/* Movie Details Content */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <h2 className="font-display text-2xl font-black text-white leading-tight">
                      {movie.name}
                    </h2>
                    {movie.originName && (
                      <p className="text-xs sm:text-sm font-medium text-amber-400/90 mt-0.5">
                        {movie.originName}
                      </p>
                    )}
                  </div>

                  {/* Badges Row 1: Quality / Year / Type / Episode Status */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <QualityBadge quality={movie.quality || "FHD"} />
                    {movie.year && (
                      <span className="rounded-md bg-white/10 px-2 py-0.5 font-semibold text-white/90 border border-white/10">
                        {movie.year}
                      </span>
                    )}
                    {movie.episodeTotal && (
                      <span className="rounded-md bg-white/10 px-2 py-0.5 font-semibold text-white/90 border border-white/10">
                        Phần {movie.episodeTotal}
                      </span>
                    )}
                    <span className="rounded-md bg-white/10 px-2 py-0.5 font-semibold text-white/90 border border-white/10">
                      {currentEpisode.name}
                    </span>
                  </div>

                  {/* Badges Row 2: Genres Tags */}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {movie.genres.map((g) => (
                        <GenreBadge key={g} name={g} />
                      ))}
                    </div>
                  )}

                  {/* Green Status Pill: Hoàn tất */}
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Hoàn tất ({movie.episodeCurrent || "1/1"})
                    </span>
                  </div>

                  {/* Movie Synopsis Description */}
                  {movie.content && (
                    <div className="pt-1 text-xs text-muted leading-relaxed">
                      <p className={showFullDesc ? "" : "line-clamp-3"}>
                        {movie.content.replace(/<[^>]*>?/gm, "")}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {movie.content.length > 100 && (
                          <button
                            type="button"
                            onClick={() => setShowFullDesc((v) => !v)}
                            className="text-xs font-bold text-amber-400 hover:underline"
                          >
                            {showFullDesc ? "Thu gọn" : "Xem thêm"}
                          </button>
                        )}
                        <Link
                          href={`/phim/${movie.slug}`}
                          className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
                        >
                          <span>Thông tin phim</span>
                          <ChevronRightIcon className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {movie.tags && movie.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                      <span className="font-bold text-gray-400 mr-0.5">Hashtags:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {movie.tags.map((t: any, idx: number) => {
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

                </div>
              </div>
            </div>

            {/* DANH SÁCH TẬP & SERVER SELECTOR SECTION */}
            <div ref={episodesRef} className="rounded-2xl bg-surface/70 border border-white/10 p-5 backdrop-blur-md shadow-xl space-y-4">
              
              {/* Header Bar: Title */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="text-accent text-lg">≡</span>
                <h3 className="font-display text-base font-bold text-white">Danh sách tập</h3>
              </div>

              {/* Máy chủ Selector Row */}
              {currentEpisode.servers && currentEpisode.servers.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="text-sm font-semibold text-gray-400 flex items-center gap-2 mr-1">
                    <ServerIcon className="h-4 w-4 text-gray-400" />
                    Máy chủ:
                  </span>
                  {currentEpisode.servers.map((server) => {
                    const isSelected = activeServer?.id === server.id;
                    return (
                      <button
                        key={server.id}
                        type="button"
                        onClick={() => handleSelectServer(server.id, server.serverName)}
                        className={`flex items-center gap-2.5 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "border-white/50 bg-[#161824] text-white font-bold shadow-md"
                            : "border-white/5 bg-[#12131b] text-gray-400 hover:bg-[#181924] hover:text-gray-200"
                        }`}
                      >
                        <ServerIconComponent
                          name={server.serverName}
                          langType={server.langType}
                          isSelected={isSelected}
                        />
                        <span>{server.serverName}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Episode Grid Selector */}
              <div className="pt-2">
                <EpisodeGrid
                  episodes={movie.episodes}
                  baseHref={`/xem/${movie.slug}`}
                  currentSlug={episodeSlug}
                />
              </div>

              {/* Comments Section */}
              <CommentSection movieId={movie.id} />

            </div>

          </div>

          {/* RIGHT COLUMN: Cast Section & Recommended Movies Sidebar */}
          <div className="space-y-6">
            
            {/* CAST SECTION (Diễn viên) */}
            <div className="rounded-2xl bg-surface/70 border border-white/10 p-5 backdrop-blur-md shadow-xl">
              <h3 className="font-display text-base font-bold text-white mb-4 border-b border-white/10 pb-2.5">
                Diễn viên
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                {castList.slice(0, 7).map((actor) => (
                  <div key={actor.id} className="group flex flex-col items-center space-y-1.5">
                    {/* Circle Avatar */}
                    <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/15 bg-elevated shadow-md shrink-0 group-hover:border-accent group-hover:ring-2 group-hover:ring-accent/30 group-hover:shadow-[0_0_12px_rgba(255,92,26,0.35)] transition-all duration-300">
                      {actor.avatarUrl ? (
                        <Image
                          src={actor.avatarUrl}
                          alt={actor.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <UserIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    {/* Actor Name & Role */}
                    <div className="w-full px-0.5">
                      <p
                        className="text-[11px] font-semibold text-white break-words text-center leading-snug"
                        style={{ color: "#ffffff" }}
                      >
                        {actor.name}
                      </p>
                      {actor.characterName && (
                        <p
                          className="text-[10px] text-gray-400 break-words text-center mt-0.5 leading-tight"
                          style={{ color: "#9ca3af" }}
                        >
                          {actor.characterName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECOMMENDED FOR YOU (Đề xuất cho bạn) */}
            <div className="rounded-2xl bg-surface/70 border border-white/10 p-5 backdrop-blur-md shadow-xl">
              <h3 className="font-display text-base font-bold text-white mb-4 border-b border-white/10 pb-2.5">
                Đề xuất cho bạn
              </h3>

              {movie.similar && movie.similar.length > 0 ? (
                <div className="space-y-3">
                  {movie.similar.slice(0, 6).map((item) => (
                    <Link
                      key={item.id}
                      href={`/phim/${item.slug}`}
                      className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-elevated/70"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface border border-white/10 shadow">
                        <Image
                          src={item.posterUrl}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      {/* Movie Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-accent transition-colors">
                          {item.name}
                        </h4>
                        {item.originName && (
                          <p className="text-[11px] text-faint line-clamp-1 mt-0.5">
                            {item.originName}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
                          {item.year && <span>{item.year}</span>}
                          {item.quality && (
                            <span className="px-1 rounded bg-white/10 font-medium">
                              {item.quality}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-faint">Đang cập nhật phim đề xuất...</p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
