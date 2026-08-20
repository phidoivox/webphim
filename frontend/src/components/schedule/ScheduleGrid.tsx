"use client";

import { useMemo, useState } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from "@/components/ui/icons";
import { ScheduleMovieCard } from "./ScheduleMovieCard";
import type { ScheduleMovieItem, WeeklyScheduleData } from "@/types/schedule";

interface ScheduleGridProps {
  initialSchedule: WeeklyScheduleData;
}

const DAY_NAMES: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

interface DayItem {
  date: Date;
  dateStr: string; // "DD/MM"
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dayLabel: string; // "Thứ 3", "Thứ 4", "Hôm nay", etc.
  isToday: boolean;
  dateKey: string; // "YYYY-MM-DD"
}

export function ScheduleGrid({ initialSchedule }: ScheduleGridProps) {
  // Reference today date
  const [todayDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [offsetDays, setOffsetDays] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Generate 7 days centered or anchored with offsetDays
  const daysList: DayItem[] = useMemo(() => {
    const list: DayItem[] = [];
    // 7 days window: 2 days before today, today, 4 days after today (relative to offsetDays)
    for (let i = -2; i <= 4; i++) {
      const d = new Date(todayDate.getTime() + (i + offsetDays) * 86400000);
      const isToday =
        d.getDate() === todayDate.getDate() &&
        d.getMonth() === todayDate.getMonth() &&
        d.getFullYear() === todayDate.getFullYear();

      const dayOfWeek = d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      list.push({
        date: d,
        dateStr,
        dayOfWeek,
        dayLabel: isToday ? "Hôm nay" : DAY_NAMES[dayOfWeek],
        isToday,
        dateKey,
      });
    }
    return list;
  }, [todayDate, offsetDays]);

  // Determine currently selected DayItem
  const currentSelectedDay = useMemo(() => {
    const found = daysList.find((d) => d.dateKey === selectedDateKey);
    return found || daysList[2] || daysList[0];
  }, [daysList, selectedDateKey]);

  // Movies for the selected day
  const moviesForSelectedDay = useMemo(() => {
    const rawList = initialSchedule[currentSelectedDay.dayOfWeek] || [];
    if (!searchQuery.trim()) return rawList;

    const query = searchQuery.trim().toLowerCase();
    return rawList.filter(
      (m: ScheduleMovieItem) =>
        m.name.toLowerCase().includes(query) ||
        (m.originName && m.originName.toLowerCase().includes(query)) ||
        (m.notifySchedule && m.notifySchedule.toLowerCase().includes(query)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(query)))
    );
  }, [initialSchedule, currentSelectedDay.dayOfWeek, searchQuery]);

  const handlePrevDay = () => {
    setOffsetDays((prev) => prev - 1);
  };

  const handleNextDay = () => {
    setOffsetDays((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER & SEARCH ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-white" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Lịch chiếu
          </h1>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm phim theo tên, thể loại..."
            className="w-full rounded-xl border border-white/10 bg-[#161622] py-2 pl-9 pr-8 text-xs text-white placeholder-white/35 focus:border-amber-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── DAY SELECTOR CAROUSEL ── */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrevDay}
          aria-label="Ngày trước"
          className="flex h-14 w-8 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#14141c] border border-white/5 text-white/60 transition hover:bg-[#1e1e2d] hover:text-white active:scale-95 cursor-pointer"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        {/* 7 Days Bar */}
        <div className="grid flex-1 grid-cols-7 gap-1 sm:gap-2">
          {daysList.map((day) => {
            const isSelected = day.dateKey === currentSelectedDay.dateKey;

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateKey(day.dateKey)}
                className={`flex flex-col items-center justify-center rounded-xl py-2 sm:py-2.5 transition cursor-pointer ${
                  isSelected
                    ? "border-t-2 border-amber-400 bg-[#1e1e2d] text-amber-400 shadow-md"
                    : "border-t-2 border-transparent bg-[#14141c] text-white/60 hover:bg-[#1a1a24] hover:text-white"
                }`}
              >
                <span className={`text-[11px] sm:text-xs font-semibold ${isSelected ? "text-amber-400" : "text-white/70"}`}>
                  {day.dateStr}
                </span>
                <span className={`mt-0.5 text-xs sm:text-sm font-bold ${isSelected ? "text-amber-400" : "text-white"}`}>
                  {day.dayLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNextDay}
          aria-label="Ngày tiếp theo"
          className="flex h-14 w-8 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#14141c] border border-white/5 text-white/60 transition hover:bg-[#1e1e2d] hover:text-white active:scale-95 cursor-pointer"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* ── MOVIE CARDS LIST ── */}
      <div>
        {moviesForSelectedDay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {moviesForSelectedDay.map((movie) => (
              <ScheduleMovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14141c]/60 py-16 text-center">
            <CalendarIcon className="h-10 w-10 text-white/20" />
            <h3 className="mt-3 text-sm font-bold text-white">
              Không có phim phát sóng
            </h3>
            <p className="mt-1 text-xs text-white/40">
              {searchQuery
                ? "Không tìm thấy phim phù hợp với từ khóa."
                : `Chưa có phim nào được xếp lịch phát sóng vào ${currentSelectedDay.dayLabel} (${currentSelectedDay.dateStr}).`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
