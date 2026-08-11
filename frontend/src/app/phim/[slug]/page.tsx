"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { NotFoundError } from "@/lib/api";
import { BookmarkIcon, ChevronDownIcon, PlayIcon } from "@/components/ui/icons";
import RatingStars from "@/components/movie/RatingStars";
import EpisodeGrid from "@/components/movie/EpisodeGrid";
import CommentItem, { type MockComment } from "@/components/movie/CommentItem";
import CarouselRow from "@/components/home/CarouselRow";
import type { CarouselSection } from "@/types/movie";

const TYPE_LABEL: Record<string, string> = {
  series: "Phim bộ",
  single: "Phim lẻ",
  "tv-show": "TV Show",
};

const MOCK_COMMENTS: MockComment[] = [
  { id: 1, author: "PhimHayFan", avatarUrl: "https://picsum.photos/seed/avt-1/80/80", time: "2 giờ trước", content: "Phim hay quá, diễn viên chính diễn xuất cực đỉnh!", likes: 12 },
  { id: 2, author: "Cinephile_VN", avatarUrl: "https://picsum.photos/seed/avt-2/80/80", time: "5 giờ trước", content: "Tập mới căng quá, mong chờ tập sau.", likes: 8 },
  { id: 3, author: "XemPhimMoi", avatarUrl: "https://picsum.photos/seed/avt-3/80/80", time: "1 ngày trước", content: "Chất lượng hình ảnh rất tốt, đáng xem.", likes: 5 },
];

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

export default function MovieDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: movie, loading, error, retry } = useMovieDetail(slug);
  const [bookmarked, setBookmarked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // Render gate: hook giữ data của phim cũ khi slug đổi (nav từ "Phim tương tự"),
  // nên cần đối chiếu slug để không hiển thị nhầm phim cũ trong lúc refetch.
  const stale = movie !== null && movie.slug !== slug;

  // Lỗi mạng / backend down → thử lại
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-10">
        {error instanceof NotFoundError ? (
          <>
            <p className="text-sm text-muted">Không tìm thấy phim này.</p>
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

  // Skeleton khi tải lần đầu (hoặc đang chuyển sang phim khác)
  if (loading || stale) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <SkeletonBlock className="aspect-[2/3] w-48 lg:w-64" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-9 w-2/3" />
            <SkeletonBlock className="h-5 w-1/2" />
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-11 w-40" />
          </div>
        </div>
        <SkeletonBlock className="mt-10 h-8 w-40" />
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10" />
          ))}
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const firstEpisode = movie.episodes[0];
  const firstEpisodeSlug = firstEpisode?.slug ?? "tap-1";
  const similarSection: CarouselSection = { id: "similar", title: "Phim tương tự", movies: movie.similar };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-10">
      {/* Hero */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="relative mx-auto w-48 shrink-0 lg:mx-0 lg:w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={movie.posterUrl} alt={movie.name} className="aspect-[2/3] w-full rounded-xl object-cover shadow-2xl" />
          {movie.isNew && (
            <span className="absolute left-2 top-2 rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-(--color-base)">MỚI</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-extrabold text-ink lg:text-4xl">{movie.name}</h1>
          {movie.originName && <p className="mt-1 text-sm text-faint">{movie.originName}</p>}

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            <span>{movie.year}</span>
            <span>{movie.quality}</span>
            <span>{TYPE_LABEL[movie.type] ?? movie.type}</span>
            {movie.episodeTotal && <span>{movie.episodeTotal} tập</span>}
            <span className="text-faint">{movie.viewCount.toLocaleString("vi-VN")} lượt xem</span>
          </div>

          {movie.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span key={g} className="rounded-full border border-elevated bg-surface px-3 py-1 text-xs text-muted">{g}</span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <RatingStars value={movie.ratingAvg} interactive onChange={setUserRating} />
            <span className="text-sm font-semibold text-ink">{movie.ratingAvg.toFixed(1)}</span>
            <span className="text-xs text-faint">
              ({movie.ratingCount.toLocaleString("vi-VN")} lượt đánh giá{userRating > 0 ? ` — bạn đã chấm ${userRating} sao` : ""})
            </span>
          </div>

          {movie.content && (
            <p className={`mt-3 max-w-2xl text-sm leading-relaxed text-muted ${expanded ? "" : "line-clamp-3"}`}>{movie.content}</p>
          )}
          {movie.content && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover"
            >
              {expanded ? "Thu gọn" : "Xem thêm"}
              <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/xem/${movie.slug}/${firstEpisodeSlug}`}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover"
            >
              <PlayIcon className="h-4 w-4" />
              XEM PHIM
            </Link>
            <button
              type="button"
              onClick={() => setBookmarked((v) => !v)}
              className={`flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition-colors ${
                bookmarked ? "border-accent bg-accent/15 text-accent" : "border-elevated bg-surface text-muted hover:text-ink"
              }`}
            >
              <BookmarkIcon className={`h-4 w-4 ${bookmarked ? "fill-accent" : ""}`} />
              {bookmarked ? "Đã lưu" : "Bookmark"}
            </button>
            {movie.trailerUrl && (
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-elevated bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
              >
                Xem trailer
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Chọn tập */}
      {movie.episodes.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink lg:text-xl">Chọn tập</h2>
          <div className="mt-3">
            <EpisodeGrid episodes={movie.episodes} baseHref={`/xem/${movie.slug}`} />
          </div>
        </section>
      )}

      {/* Diễn viên / Đạo diễn */}
      {(movie.credits.directors.length > 0 || movie.credits.actors.length > 0) && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink lg:text-xl">Diễn viên & đạo diễn</h2>
          {movie.credits.directors.length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-muted">Đạo diễn</h3>
              <div className="mt-2 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {movie.credits.directors.map((p) => (
                  <div key={p.id} className="w-20 shrink-0 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatarUrl ?? `https://picsum.photos/seed/person-${p.id}/160/160`} alt={p.name} className="mx-auto h-20 w-20 rounded-full object-cover" />
                    <p className="mt-2 line-clamp-2 text-xs text-ink">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {movie.credits.actors.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-muted">Diễn viên</h3>
              <div className="mt-2 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {movie.credits.actors.map((p) => (
                  <div key={p.id} className="w-20 shrink-0 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatarUrl ?? `https://picsum.photos/seed/person-${p.id}/160/160`} alt={p.name} className="mx-auto h-20 w-20 rounded-full object-cover" />
                    <p className="mt-2 line-clamp-2 text-xs text-ink">{p.name}</p>
                    {p.characterName && <p className="line-clamp-1 text-[10px] text-faint">{p.characterName}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Phim tương tự */}
      {movie.similar.length > 0 && (
        <div className="mt-10">
          <CarouselRow section={similarSection} />
        </div>
      )}

      {/* Bình luận */}
      <section className="mt-10 max-w-2xl">
        <h2 className="font-display text-lg font-bold text-ink lg:text-xl">Bình luận</h2>
        <div className="mt-4 space-y-5">
          {MOCK_COMMENTS.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-dashed border-elevated bg-surface p-4 text-center text-sm text-faint">
          Đăng nhập để bình luận — tính năng sẽ có ở giai đoạn sau.
        </div>
      </section>
    </div>
  );
}
