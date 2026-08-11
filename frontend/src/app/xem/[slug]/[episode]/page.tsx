"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { NotFoundError } from "@/lib/api";
import PlayerShell from "@/components/player/PlayerShell";
import AdSlot from "@/components/ui/AdSlot";
import EpisodeGrid from "@/components/movie/EpisodeGrid";
import { BookmarkIcon, ChevronDownIcon, FlagIcon, ThumbsUpIcon } from "@/components/ui/icons";
import type { MovieDetail, MovieEpisode } from "@/types/movie";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

/** Player + server tabs + pre-roll — remount theo tập (key) để reset trạng thái. */
function PlayerArea({ movie, current }: { movie: MovieDetail; current: MovieEpisode | null }) {
  const [serverId, setServerId] = useState<number | null>(null);
  const [adDone, setAdDone] = useState(false);
  const activeServer = current?.servers.find((s) => s.id === serverId) ?? current?.servers[0] ?? null;

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-black">
        <AdSlot onEnded={() => setAdDone(true)} />
        <PlayerShell src={activeServer?.linkM3u8 ?? null} title={current?.name ?? movie.name} autoPlay={adDone} />
      </div>

      {current && current.servers.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-faint">Server:</span>
          {current.servers.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServerId(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                s.id === activeServer?.id ? "bg-accent text-(--color-base)" : "bg-surface text-muted hover:text-ink"
              }`}
            >
              {s.serverName}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function WatchPage() {
  const { slug, episode } = useParams<{ slug: string; episode: string }>();
  const { data: movie, loading, error, retry } = useMovieDetail(slug);
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [showContinue, setShowContinue] = useState(true);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  // Render gate: hook giữ movie cũ khi đổi slug — gate bằng error/loading/stale
  // để không render nhầm phim cũ khi refetch đang chạy hoặc lỗi.
  const stale = movie !== null && movie.slug !== slug;

  // Lỗi
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-10">
        {error instanceof NotFoundError ? (
          <>
            <p className="text-sm text-muted">Không tìm thấy phim hoặc tập này.</p>
            <Link href="/" className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover">
              Về trang chủ
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">{error.message}</p>
            <button type="button" onClick={retry} className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover">
              Thử lại
            </button>
          </>
        )}
      </div>
    );
  }

  // Skeleton
  if (loading || stale) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-10">
        <SkeletonBlock className="aspect-video w-full rounded-xl" />
        <SkeletonBlock className="mt-4 h-6 w-1/3" />
        <SkeletonBlock className="mt-6 h-8 w-24" />
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10" />
          ))}
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const current = movie.episodes.find((e) => e.slug === episode) ?? null;

  // Episode không tồn tại (slug lạ hoặc phim chưa có tập) → UI riêng (spec §5)
  if (!current) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-10">
        <p className="text-sm text-muted">Không tìm thấy tập này.</p>
        <Link
          href={`/phim/${movie.slug}`}
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover"
        >
          Về trang chi tiết
        </Link>
      </div>
    );
  }

  const episodeNum = Number(episode.replace(/^tap-/, "")) || 0; // "Full" → 0
  const mockMinutes = episodeNum > 1 ? ((episodeNum * 3) % 15) + 5 : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Cột chính */}
        <div className="min-w-0 flex-1">
          <PlayerArea key={current?.id ?? "none"} movie={movie} current={current} />

          {/* Ad banner placeholder — user free */}
          <div className="mt-4 hidden h-[90px] w-full max-w-[728px] items-center justify-center rounded-lg border border-dashed border-elevated bg-surface text-xs text-faint lg:flex">
            Ad Slot 728×90
          </div>

          {/* Nhắc tiếp tục xem (mock — Phase 4 sẽ seek thật từ lịch sử) */}
          {mockMinutes && showContinue && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-elevated bg-surface px-4 py-3 text-sm text-muted">
              <p>
                Bạn đang xem ở phút <span className="font-semibold text-ink">{mockMinutes}</span> — muốn tiếp tục?
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setShowContinue(false)}
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-(--color-base) transition-colors hover:bg-accent-hover"
                >
                  Xem tiếp
                </button>
                <button
                  type="button"
                  onClick={() => setShowContinue(false)}
                  className="rounded-md border border-elevated px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {/* Thông tin + toolbar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold text-ink">{movie.name}</h1>
              <p className="mt-0.5 text-sm text-muted">
                {current?.name ?? "—"} · {current?.servers[0]?.serverName ?? "—"} ·{" "}
                <Link href={`/phim/${movie.slug}`} className="text-accent transition-colors hover:text-accent-hover">
                  Trang chi tiết
                </Link>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setBookmarked((v) => !v); flash(bookmarked ? "Đã bỏ lưu" : "Đã lưu phim"); }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  bookmarked ? "border-accent bg-accent/15 text-accent" : "border-elevated bg-surface text-muted hover:text-ink"
                }`}
              >
                <BookmarkIcon className={`h-4 w-4 ${bookmarked ? "fill-accent" : ""}`} />
                {bookmarked ? "Đã lưu" : "Lưu phim"}
              </button>
              <button
                type="button"
                onClick={() => { setLiked((v) => !v); flash(liked ? "Đã bỏ thích" : "Cảm ơn bạn!"); }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  liked ? "border-accent bg-accent/15 text-accent" : "border-elevated bg-surface text-muted hover:text-ink"
                }`}
              >
                <ThumbsUpIcon className="h-4 w-4" />
                Thích
              </button>
              <button
                type="button"
                onClick={() => flash("Đã gửi báo lỗi — cảm ơn bạn!")}
                className="flex items-center gap-1.5 rounded-lg border border-elevated bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-ink"
              >
                <FlagIcon className="h-4 w-4" />
                Báo lỗi
              </button>
            </div>
          </div>

          {/* Danh sách tập — desktop ẩn (cột phải), mobile hiện khi bật tab */}
          {movie.episodes.length > 0 && (
            <div className="mt-4 lg:hidden">
              <button
                type="button"
                onClick={() => setShowEpisodeList((v) => !v)}
                aria-expanded={showEpisodeList}
                className="flex items-center gap-2 rounded-lg border border-elevated bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
              >
                Tập ({movie.episodes.length})
                <ChevronDownIcon className={`h-4 w-4 text-faint transition-transform ${showEpisodeList ? "rotate-180" : ""}`} />
              </button>
              {showEpisodeList && (
                <div className="mt-3">
                  <EpisodeGrid episodes={movie.episodes} baseHref={`/xem/${movie.slug}`} currentSlug={episode} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cột phải desktop: danh sách tập */}
        <aside className="hidden w-80 shrink-0 lg:block">
          <h2 className="font-display text-lg font-bold text-ink">Tập</h2>
          <div className="mt-3 max-h-[60vh] overflow-y-auto pr-1">
            <EpisodeGrid episodes={movie.episodes} baseHref={`/xem/${movie.slug}`} currentSlug={episode} />
          </div>
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-elevated px-4 py-2 text-sm text-ink shadow-xl lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
