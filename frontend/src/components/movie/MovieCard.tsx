import Link from "next/link";
import type { MovieSummary } from "@/types/movie";
import { PlayIcon } from "@/components/ui/icons";

export default function MovieCard({ movie }: { movie: MovieSummary }) {
  return (
    <Link href={`/phim/${movie.slug}`} className="group block w-[140px] shrink-0 sm:w-[170px] lg:w-[185px]">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.thumbUrl}
          alt={movie.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {movie.quality && (
          <span className="absolute left-1.5 top-1.5 rounded bg-elevated/95 px-1.5 py-0.5 text-[10px] font-bold text-muted">
            {movie.quality}
          </span>
        )}
        {movie.isNew && (
          <span className="absolute right-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-base">
            MỚI
          </span>
        )}
        {/* Overlay hover: nút play + glow */}
        <div className="absolute inset-0 flex items-center justify-center bg-base/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-(--color-base) shadow-[0_0_24px_rgba(255,92,26,0.55)] transition-transform duration-200 group-hover:scale-110">
            <PlayIcon className="h-5 w-5" />
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-ink">{movie.name}</p>
      <p className="mt-0.5 text-xs text-faint">
        {[movie.year, movie.episodeCurrent ?? movie.episodeTotal ?? movie.quality ?? "HD"]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  );
}
