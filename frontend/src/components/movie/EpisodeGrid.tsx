"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayIcon, SearchIcon } from "@/components/ui/icons";
import type { MovieEpisode } from "@/types/movie";

interface EpisodeGridProps {
  episodes: MovieEpisode[];
  baseHref: string; // `/xem/${slug}`
  currentSlug?: string; // episode slug đang xem
}

const ITEMS_PER_RANGE = 30;

function formatEpisodeName(name: string, slug?: string): string {
  const cleanName = name.trim();
  
  if (cleanName.toLowerCase() === "full") return "Full";

  // Kiểm tra nếu là số thuần túy (e.g. "1", "2")
  const numMatch = cleanName.match(/^(\d+)$/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    return `Tập ${num < 10 ? `0${num}` : num}`;
  }

  // Kiểm tra nếu có chữ "Tập 1", "Tập 2"
  const tapMatch = cleanName.match(/^Tập\s*(\d+)$/i);
  if (tapMatch) {
    const num = parseInt(tapMatch[1], 10);
    return `Tập ${num < 10 ? `0${num}` : num}`;
  }

  // Fallback theo slug nếu slug là "tap-1"
  if (slug) {
    const slugMatch = slug.match(/^tap-(\d+)$/i);
    if (slugMatch) {
      const num = parseInt(slugMatch[1], 10);
      return `Tập ${num < 10 ? `0${num}` : num}`;
    }
  }

  return cleanName.startsWith("Tập") ? cleanName : `Tập ${cleanName}`;
}

export default function EpisodeGrid({
  episodes,
  baseHref,
  currentSlug,
}: EpisodeGridProps) {
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  if (!episodes || episodes.length === 0) return null;

  // Search filter
  const filteredEpisodes = searchQuery.trim()
    ? episodes.filter(
        (ep) =>
          ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : episodes;

  // Calculate episode ranges if total episodes > 30
  const showRanges = episodes.length > ITEMS_PER_RANGE && !searchQuery.trim();
  const totalRanges = Math.ceil(episodes.length / ITEMS_PER_RANGE);

  const displayedEpisodes = showRanges
    ? episodes.slice(
        selectedRangeIndex * ITEMS_PER_RANGE,
        (selectedRangeIndex + 1) * ITEMS_PER_RANGE
      )
    : filteredEpisodes;

  return (
    <div className="space-y-4">
      {/* Search & Range Filter Bar (Nếu nhiều tập) */}
      {(episodes.length > 15 || showRanges) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input when > 15 episodes */}
          {episodes.length > 15 && (
            <div className="relative flex-1 max-w-xs">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Tìm tập phim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141520] pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Range Tabs */}
          {showRanges && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {Array.from({ length: totalRanges }).map((_, idx) => {
                const start = idx * ITEMS_PER_RANGE + 1;
                const end = Math.min((idx + 1) * ITEMS_PER_RANGE, episodes.length);
                const isActive = idx === selectedRangeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedRangeIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                      isActive
                        ? "bg-orange-500/20 text-orange-500 border-orange-500"
                        : "bg-[#141520] text-gray-400 border-white/5 hover:text-white hover:bg-[#1a1c2a]"
                    }`}
                  >
                    {start} - {end}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Episode Buttons Grid — URL sạch 100% */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {displayedEpisodes.map((ep) => {
          const active = ep.slug === currentSlug;
          return (
            <Link
              key={ep.id}
              href={`${baseHref}/${ep.slug}`}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center justify-center gap-2 h-11 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                active
                  ? "border-orange-500 bg-orange-500/10 text-orange-500 font-bold shadow-md shadow-orange-500/10"
                  : "border-white/5 bg-[#141520] text-gray-300 hover:border-orange-500 hover:text-orange-500 hover:bg-[#181a28]"
              }`}
            >
              <PlayIcon
                className={`h-3 w-3 fill-current shrink-0 transition-colors duration-200 ${
                  active
                    ? "text-orange-500"
                    : "text-gray-400 group-hover:text-orange-500"
                }`}
              />
              <span className="truncate">{formatEpisodeName(ep.name, ep.slug)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
