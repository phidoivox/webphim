"use client";

import React from "react";
import {
  AspectRatioIcon,
  ChevronRightIcon,
  GaugeIcon,
  SlidersIcon,
  XIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface MovieServerItem {
  id: string | number;
  name?: string;
  serverName?: string;
}

interface PlayerSettingsModalProps {
  activeMenu: "none" | "main" | "quality" | "speed" | "aspect" | "server";
  qualities: { id: number; label: string }[];
  selectedQuality: number;
  playbackSpeed: number;
  aspectMode: "contain" | "cover" | "fill";
  servers: MovieServerItem[];
  selectedServerId: string;
  onClose: () => void;
  onSetMenu: (menu: "none" | "main" | "quality" | "speed" | "aspect" | "server") => void;
  onChangeQuality: (qualityId: number) => void;
  onChangeSpeed: (speed: number) => void;
  onChangeAspect: (mode: "contain" | "cover" | "fill") => void;
  onSelectServer?: (serverId: string) => void;
}

export default function PlayerSettingsModal({
  activeMenu,
  qualities,
  selectedQuality,
  playbackSpeed,
  aspectMode,
  servers,
  selectedServerId,
  onClose,
  onSetMenu,
  onChangeQuality,
  onChangeSpeed,
  onChangeAspect,
  onSelectServer,
}: PlayerSettingsModalProps) {
  if (activeMenu === "none") return null;

  const currentQualityLabel =
    selectedQuality === -1
      ? "Auto"
      : qualities.find((q) => q.id === selectedQuality)?.label || "Auto";

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-16 right-4 sm:right-6 z-40 w-64 sm:w-72 rounded-[22px] border border-white/20 bg-[#121116]/70 p-4 text-xs sm:text-sm text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 ease-out animate-rise"
    >
      {/* Main Settings Menu */}
      {activeMenu === "main" && (
        <div className="space-y-1.5">
          <h4 className="font-extrabold text-white text-base mb-3 px-1">
            Cài đặt
          </h4>

          {/* Quality Item */}
          <button
            type="button"
            onClick={() => onSetMenu("quality")}
            className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-white/5 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-bold text-white">
              <SlidersIcon className="h-4 w-4 text-white/80 group-hover:text-white" />
              <span>Chất lượng</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 font-medium text-xs">
              <span>{currentQualityLabel}</span>
              <ChevronRightIcon className="h-4 w-4 text-white/40" />
            </div>
          </button>

          {/* Speed Item */}
          <button
            type="button"
            onClick={() => onSetMenu("speed")}
            className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-white/5 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-bold text-white">
              <GaugeIcon className="h-4 w-4 text-white/80 group-hover:text-white" />
              <span>Tốc độ</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 font-medium text-xs">
              <span>{playbackSpeed}x</span>
              <ChevronRightIcon className="h-4 w-4 text-white/40" />
            </div>
          </button>

          {/* Aspect Ratio Item */}
          <button
            type="button"
            onClick={() => onSetMenu("aspect")}
            className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-white/5 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 font-bold text-white">
              <AspectRatioIcon className="h-4 w-4 text-white/80 group-hover:text-white" />
              <span>Tỉ lệ màn hình</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 font-medium text-xs">
              <span className="truncate max-w-[85px]">
                {aspectMode === "contain"
                  ? "Vừa màn..."
                  : aspectMode === "cover"
                  ? "Tràn màn..."
                  : "Tỉ lệ 16:9"}
              </span>
              <ChevronRightIcon className="h-4 w-4 text-white/40" />
            </div>
          </button>
        </div>
      )}

      {/* Sub-menu: Quality Selection */}
      {activeMenu === "quality" && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onSetMenu("main")}
            className="flex items-center gap-2 text-sm font-bold text-white pb-2.5 border-b border-white/10 w-full text-left cursor-pointer"
          >
            <ChevronRightIcon className="h-4 w-4 rotate-180 text-white/70" />
            <span>Chất lượng</span>
          </button>

          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => onChangeQuality(-1)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs sm:text-sm transition-colors cursor-pointer",
                selectedQuality === -1 ? "font-bold text-white" : "font-medium text-white/70 hover:text-white"
              )}
            >
              {selectedQuality === -1 ? (
                <span className="h-2 w-2 rounded-full bg-white shrink-0" />
              ) : (
                <span className="w-2" />
              )}
              <span>Auto</span>
            </button>
            {qualities.map((q) => {
              const isSelected = selectedQuality === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onChangeQuality(q.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs sm:text-sm transition-colors cursor-pointer",
                    isSelected ? "font-bold text-white" : "font-medium text-white/70 hover:text-white"
                  )}
                >
                  {isSelected ? (
                    <span className="h-2 w-2 rounded-full bg-white shrink-0" />
                  ) : (
                    <span className="w-2" />
                  )}
                  <span>{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-menu: Speed Selection */}
      {activeMenu === "speed" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSetMenu("main")}
            className="flex items-center gap-2 text-sm font-bold text-white pb-2.5 border-b border-white/10 w-full text-left cursor-pointer"
          >
            <ChevronRightIcon className="h-4 w-4 rotate-180 text-white/70" />
            <span>Tốc độ phát</span>
          </button>

          {/* Big bold speed display */}
          <div className="text-center font-extrabold text-2xl sm:text-3xl text-white tracking-tight py-1">
            {playbackSpeed.toFixed(2)}x
          </div>

          {/* Slider with minus and plus buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChangeSpeed(Math.max(0.25, Number((playbackSpeed - 0.25).toFixed(2))))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#323136] hover:bg-[#3e3d43] text-white font-bold text-base transition-colors shrink-0 cursor-pointer"
            >
              -
            </button>
            <input
              type="range"
              min={0.25}
              max={2.0}
              step={0.05}
              value={playbackSpeed}
              onChange={(e) => onChangeSpeed(Number(e.target.value))}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Tốc độ phát video"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg focus:outline-none"
              style={{
                background: `linear-gradient(to right, #ffffff 0%, #ffffff ${
                  ((playbackSpeed - 0.25) / (2.0 - 0.25)) * 100
                }%, rgba(255, 255, 255, 0.2) ${
                  ((playbackSpeed - 0.25) / (2.0 - 0.25)) * 100
                }%, rgba(255, 255, 255, 0.2) 100%)`,
              }}
            />
            <button
              type="button"
              onClick={() => onChangeSpeed(Math.min(2.0, Number((playbackSpeed + 0.25).toFixed(2))))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#323136] hover:bg-[#3e3d43] text-white font-bold text-base transition-colors shrink-0 cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Quick preset pill buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {[1.0, 1.25, 1.5, 2.0].map((s) => {
              const isActive = Math.abs(playbackSpeed - s) < 0.01;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChangeSpeed(s)}
                  className={cn(
                    "flex-1 rounded-[14px] py-2 text-xs transition-all cursor-pointer",
                    isActive
                      ? "bg-[#3a393e] text-white font-bold shadow-md"
                      : "bg-[#252428] text-white/70 hover:text-white font-semibold"
                  )}
                >
                  {s.toFixed(1)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-menu: Aspect Ratio Selection */}
      {activeMenu === "aspect" && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onSetMenu("main")}
            className="flex items-center gap-2 text-sm font-bold text-white pb-2.5 border-b border-white/10 w-full text-left cursor-pointer"
          >
            <ChevronRightIcon className="h-4 w-4 rotate-180 text-white/70" />
            <span>Tỉ lệ màn hình</span>
          </button>

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => onChangeAspect("contain")}
              className="w-full text-left transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {aspectMode === "contain" ? (
                  <span className="h-2 w-2 rounded-full bg-white shrink-0" />
                ) : (
                  <span className="w-2" />
                )}
                <span className="text-sm font-bold text-white">
                  Vừa màn hình
                </span>
              </div>
              <p className="text-xs text-white/50 pl-4.5 mt-0.5">
                Giữ nguyên tỉ lệ phim
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChangeAspect("cover")}
              className="w-full text-left transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {aspectMode === "cover" ? (
                  <span className="h-2 w-2 rounded-full bg-white shrink-0" />
                ) : (
                  <span className="w-2" />
                )}
                <span className="text-sm font-bold text-white">
                  Lấp đầy
                </span>
              </div>
              <p className="text-xs text-white/50 pl-4.5 mt-0.5">
                Cắt bớt viền để phủ màn hình
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChangeAspect("fill")}
              className="w-full text-left transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {aspectMode === "fill" ? (
                  <span className="h-2 w-2 rounded-full bg-white shrink-0" />
                ) : (
                  <span className="w-2" />
                )}
                <span className="text-sm font-bold text-white">
                  Kéo giãn
                </span>
              </div>
              <p className="text-xs text-white/50 pl-4.5 mt-0.5">
                Ép theo tỉ lệ màn hình
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Sub-menu: Server Selection */}
      {activeMenu === "server" && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <h4
              className="font-extrabold text-white text-sm sm:text-base drop-shadow-sm"
              style={{ color: "#ffffff" }}
            >
              Chọn Máy chủ
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1 pt-1 max-h-52 overflow-y-auto [scrollbar-width:thin]">
            {servers.map((srv, idx) => {
              const isSelected = String(selectedServerId) === String(srv.id);
              const serverTitle = srv.serverName || srv.name || `Server #${idx + 1}`;
              return (
                <button
                  key={srv.id || idx}
                  type="button"
                  onClick={() => {
                    onSelectServer?.(String(srv.id));
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs sm:text-sm transition-colors cursor-pointer",
                    isSelected
                      ? "bg-white/10 font-bold text-white"
                      : "font-medium text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span style={{ color: isSelected ? "#ffffff" : "rgba(255,255,255,0.85)" }}>
                    {serverTitle}
                  </span>
                  {isSelected && (
                    <span className="text-[11px] font-bold text-accent">
                      Đang phát
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
