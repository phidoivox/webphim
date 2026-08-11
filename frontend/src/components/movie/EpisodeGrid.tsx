import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons";
import type { MovieEpisode } from "@/types/movie";

interface EpisodeGridProps {
  episodes: MovieEpisode[];
  baseHref: string; // `/xem/${slug}`
  currentSlug?: string; // episode slug đang xem
}

// Mock: 3 tập đầu coi như đã xem (chưa có lịch sử thật — Phase 4)
const WATCHED_COUNT = 3;

export default function EpisodeGrid({ episodes, baseHref, currentSlug }: EpisodeGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
      {episodes.map((ep, i) => {
        const active = ep.slug === currentSlug;
        const watched = i < WATCHED_COUNT;
        return (
          <Link
            key={ep.id}
            href={`${baseHref}/${ep.slug}`}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
              active
                ? "border-accent bg-accent text-(--color-base)"
                : "border-elevated bg-surface text-muted hover:border-accent/60 hover:text-ink"
            }`}
          >
            {watched && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-(--color-base)" aria-hidden="true">
                <CheckIcon className="h-2.5 w-2.5" />
              </span>
            )}
            {ep.name}
          </Link>
        );
      })}
    </div>
  );
}
