"use client";

import React, { useRef, useState } from "react";
import {
  CastIcon,
  MaximizeIcon,
  PauseIcon,
  PipIcon,
  PlayIcon,
  RotateCcw10Icon,
  RotateCw10Icon,
  ServerIcon,
  SettingsIcon,
  Volume2Icon,
  VolumeXIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlayerControlsProps {
  playing: boolean;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  activeMenu: string;
  onTogglePlay: () => void;
  onSkipTime: (seconds: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (newVol: number) => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePip: () => void;
  onToggleFullscreen: () => void;
  onToggleSettings: () => void;
  onToggleServerMenu: () => void;
}

export default function PlayerControls({
  playing,
  muted,
  volume,
  currentTime,
  duration,
  activeMenu,
  onTogglePlay,
  onSkipTime,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onTogglePip,
  onToggleFullscreen,
  onToggleSettings,
  onToggleServerMenu,
}: PlayerControlsProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = (offsetX / rect.width) * 100;
    const time = (offsetX / rect.width) * duration;
    setHoverPos(pct);
    setHoverTime(time);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  const formatTime = (sec: number, matchDuration?: number) => {
    const totalDuration = matchDuration ?? duration;
    const showHours = totalDuration >= 3600;

    if (!Number.isFinite(sec) || sec <= 0) {
      return showHours ? "00:00:00" : "00:00";
    }

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);

    const paddedH = h.toString().padStart(2, "0");
    const paddedM = m.toString().padStart(2, "0");
    const paddedS = s.toString().padStart(2, "0");

    if (h > 0 || showHours) {
      return `${paddedH}:${paddedM}:${paddedS}`;
    }
    return `${paddedM}:${paddedS}`;
  };

  return (
    <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
      {/* Timeline Progress Bar */}
      <div
        ref={timelineRef}
        onMouseMove={handleTimelineMouseMove}
        onMouseLeave={handleTimelineMouseLeave}
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center group/slider cursor-pointer py-2 sm:py-1"
      >
        {/* Hover/Scrub Time Tooltip Badge */}
        {hoverTime !== null && (
          <div
            className="absolute -top-8 z-30 -translate-x-1/2 rounded-md bg-black/90 px-2.5 py-0.5 text-xs font-bold text-white shadow-lg border border-white/15 pointer-events-none whitespace-nowrap"
            style={{ left: `${hoverPos}%` }}
          >
            {formatTime(hoverTime, duration)}
          </div>
        )}

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={onSeek}
          aria-label="Tua phim"
          className="h-2 w-full cursor-pointer appearance-none rounded-lg focus:outline-none transition-all hover:h-2.5"
          style={{
            background: `linear-gradient(to right, #ff5c1a 0%, #ff5c1a ${
              duration > 0 ? (currentTime / duration) * 100 : 0
            }%, rgba(255, 255, 255, 0.25) ${
              duration > 0 ? (currentTime / duration) * 100 : 0
            }%, rgba(255, 255, 255, 0.25) 100%)`,
          }}
        />
      </div>

      {/* Controls Button Row */}
      <div className="flex items-center justify-between text-white/90 gap-2">
        {/* Left Controls Group */}
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3.5 min-w-0">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "Tạm dừng" : "Phát"}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-white hover:text-accent transition-colors active:scale-95 cursor-pointer shrink-0"
          >
            {playing ? (
              <PauseIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            ) : (
              <PlayIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            )}
          </button>

          {/* Skip -10s */}
          <button
            type="button"
            onClick={() => onSkipTime(-10)}
            title="Lùi 10 giây"
            className="flex h-8 w-8 sm:h-auto sm:w-auto items-center justify-center text-white/80 hover:text-white transition-colors active:scale-90 cursor-pointer shrink-0"
          >
            <RotateCcw10Icon className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
          </button>

          {/* Skip +10s */}
          <button
            type="button"
            onClick={() => onSkipTime(10)}
            title="Tiến 10 giây"
            className="flex h-8 w-8 sm:h-auto sm:w-auto items-center justify-center text-white/80 hover:text-white transition-colors active:scale-90 cursor-pointer shrink-0"
          >
            <RotateCw10Icon className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
          </button>

          {/* Volume Control Group (Chỉ hiển thị trên máy tính Desktop có chuột) */}
          <div className="hidden sm:flex group/volume items-center">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted || volume === 0 ? "Bật tiếng" : "Tắt tiếng"}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              {muted || volume === 0 ? (
                <VolumeXIcon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
              ) : (
                <Volume2Icon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
              )}
            </button>

            {/* Smooth Expandable Slider on Hover */}
            <div className="w-0 group-hover/volume:w-20 sm:group-hover/volume:w-24 overflow-hidden transition-all duration-300 ease-out flex items-center pl-0 group-hover/volume:pl-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Tăng giảm âm lượng"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #ff5c1a 0%, #ff5c1a ${
                    (muted ? 0 : volume) * 100
                  }%, rgba(255, 255, 255, 0.25) ${
                    (muted ? 0 : volume) * 100
                  }%, rgba(255, 255, 255, 0.25) 100%)`,
                }}
              />
            </div>
          </div>

          {/* Time Display */}
          <span className="font-mono text-[10px] sm:text-xs font-bold tracking-tight text-white/90 truncate ml-0.5">
            {formatTime(currentTime, duration)} / {formatTime(duration, duration)}
          </span>
        </div>

        {/* Right Controls Group */}
        <div className="relative flex items-center gap-1.5 sm:gap-3.5 shrink-0">
          {/* Server Quick Selector Button */}
          <button
            type="button"
            onClick={onToggleServerMenu}
            title="Chọn Máy chủ phát"
            className={cn(
              "flex h-8 w-8 sm:h-auto sm:w-auto items-center justify-center transition-colors cursor-pointer active:scale-90",
              activeMenu === "server" ? "text-accent scale-110" : "text-white/80 hover:text-white"
            )}
          >
            <ServerIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Screen Cast (Desktop / Large screen) */}
          <button
            type="button"
            onClick={() => toast.info("Tính năng truyền màn hình (Cast) đang sẵn sàng.")}
            title="Truyền màn hình (Cast)"
            className="hidden md:flex h-8 w-8 sm:h-auto sm:w-auto items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <CastIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Picture in Picture */}
          <button
            type="button"
            onClick={onTogglePip}
            title="Xem dạng cửa sổ thu nhỏ (PiP)"
            className="hidden sm:flex h-8 w-8 sm:h-auto sm:w-auto items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <PipIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Settings Gear Toggle Button */}
          <button
            type="button"
            onClick={onToggleSettings}
            title="Cài đặt phát video"
            className={cn(
              "flex h-8 w-8 sm:h-auto sm:w-auto items-center justify-center transition-transform cursor-pointer active:scale-90",
              ["main", "quality", "speed", "aspect"].includes(activeMenu)
                ? "text-accent rotate-45"
                : "text-white/80 hover:text-white"
            )}
          >
            <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label="Toàn màn hình"
            className="flex h-8 w-8 sm:h-auto sm:w-auto items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer active:scale-90"
          >
            <MaximizeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
