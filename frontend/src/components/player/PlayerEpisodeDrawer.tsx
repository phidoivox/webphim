"use client";

import React from "react";
import Link from "next/link";
import { PlayIcon, XIcon } from "@/components/ui/icons";
import type { MovieEpisode } from "@/types/movie";
import { cn } from "@/lib/utils";

interface PlayerEpisodeDrawerProps {
  showDrawer: boolean;
  movieName: string;
  title: string;
  posterUrl: string;
  episodes: MovieEpisode[];
  currentSlug: string;
  baseHref: string;
  onClose: () => void;
}

export default function PlayerEpisodeDrawer({
  showDrawer,
  movieName,
  title,
  posterUrl,
  episodes,
  currentSlug,
  baseHref,
  onClose,
}: PlayerEpisodeDrawerProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute right-0 top-0 bottom-0 z-40 w-72 sm:w-80 bg-[#121116]/75 border-l border-white/20 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-300 ease-in-out",
        showDrawer ? "translate-x-0" : "translate-x-full pointer-events-none"
      )}
    >
      {/* Drawer Header: Movie Name + Close Button */}
      <div className="flex items-center justify-between border-b border-white/10 p-4 shrink-0">
        <h3
          className="font-display text-sm sm:text-base font-extrabold text-white truncate max-w-[200px]"
          style={{ color: "#ffffff" }}
        >
          {movieName || title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Đóng danh sách tập"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Episode List Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin]">
        {episodes.map((ep) => {
          const active = ep.slug === currentSlug;
          return (
            <Link
              key={ep.id}
              href={`${baseHref}/${ep.slug}`}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-xl p-2 transition-all cursor-pointer",
                active ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              {/* Episode 16:9 Thumbnail Image */}
              <div
                className={cn(
                  "relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden shrink-0 bg-surface border-2 transition-all",
                  active
                    ? "border-amber-500 shadow-md shadow-amber-500/20"
                    : "border-white/10 group-hover:border-white/30"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterUrl}
                  alt={ep.name}
                  className="h-full w-full object-cover"
                />
                {active && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <PlayIcon className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </div>
                )}
              </div>

              {/* Episode Title */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-xs sm:text-sm font-bold truncate block",
                    active ? "text-amber-400" : "text-white/80 group-hover:text-white"
                  )}
                >
                  {ep.name.startsWith("Tập") ? ep.name : `Tập ${ep.name}`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
