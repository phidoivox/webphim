"use client";

import { ClockIcon } from "@/components/ui/icons";
import { ScheduleMovieCard } from "./ScheduleMovieCard";
import type { ScheduleMovieItem } from "@/types/schedule";

interface ScheduleDayColumnProps {
  dayNumber: number;
  dayName: string;
  isToday: boolean;
  movies: ScheduleMovieItem[];
}

export function ScheduleDayColumn({
  dayName,
  isToday,
  movies,
}: ScheduleDayColumnProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-3 transition ${
        isToday
          ? "border-accent/50 bg-accent/[0.04] shadow-lg shadow-accent/5 ring-1 ring-accent/30"
          : "border-white/10 bg-[#121218]/70"
      }`}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-bold text-white tracking-tight">{dayName}</h2>
          {isToday && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-white/45">
          {movies.length} phim
        </span>
      </div>

      {/* Movies List */}
      {movies.length > 0 ? (
        <div className="space-y-2.5">
          {movies.map((movie) => (
            <ScheduleMovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-white/30">
          <ClockIcon className="h-5 w-5 stroke-white/20" />
          <p className="mt-1.5 text-[11px]">Chưa có lịch chiếu</p>
        </div>
      )}
    </div>
  );
}
