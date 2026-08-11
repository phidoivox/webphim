"use client";

import { useEffect, useRef, useState } from "react";
import { MaximizeIcon, PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from "@/components/ui/icons";

interface PlayerShellProps {
  src: string | null;
  title: string;
  autoPlay?: boolean;
}

const HIDE_DELAY_MS = 3000;

export default function PlayerShell({ src, title, autoPlay = false }: PlayerShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Autoplay sau khi hết pre-roll (autoPlay = true từ parent)
  useEffect(() => {
    if (!autoPlay) return;
    videoRef.current?.play().catch(() => setVideoError(true));
  }, [autoPlay]);

  // Đổi src (chuyển server): giữ thời điểm hiện tại, phát lại nếu đang phát
  useEffect(() => {
    if (!src) return;
    const video = videoRef.current;
    if (!video) return;
    pendingSeekRef.current = video.currentTime;
    wasPlayingRef.current = !video.paused;
    video.load();
  }, [src]);

  // Dọn timer khi unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const showControls = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, HIDE_DELAY_MS);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setVideoError(true));
    } else {
      video.pause();
    }
    showControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    showControls();
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
    showControls();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
    setCurrentTime(video.currentTime);
    showControls();
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="group relative aspect-video w-full bg-black"
      onMouseMove={showControls}
      onMouseLeave={() => setControlsVisible(false)}
      onClick={togglePlay}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-contain"
          muted={muted}
          aria-label={title}
          onPlay={() => { setPlaying(true); showControls(); }}
          onPause={() => { setPlaying(false); setControlsVisible(true); }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            if (pendingSeekRef.current != null) {
              e.currentTarget.currentTime = pendingSeekRef.current;
              pendingSeekRef.current = null;
            }
            if (wasPlayingRef.current) {
              e.currentTarget.play().catch(() => setVideoError(true));
              wasPlayingRef.current = false;
            }
          }}
          onError={() => setVideoError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-faint">
          Không có nguồn phát cho server này
        </div>
      )}

      {videoError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-base/90 text-sm text-muted">
          <p>Không thể phát video — thử chọn server khác.</p>
        </div>
      )}

      {/* Controls: tự ẩn sau 3s khi đang phát */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát"} className="text-ink hover:text-accent">
          {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          aria-label="Tua phim"
          className="h-1 flex-1 cursor-pointer accent-accent"
        />
        <span className="text-xs tabular-nums text-ink">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Bật tiếng" : "Tắt tiếng"} className="text-ink hover:text-accent">
          {muted ? <VolumeXIcon className="h-5 w-5" /> : <Volume2Icon className="h-5 w-5" />}
        </button>
        <button type="button" onClick={toggleFullscreen} aria-label="Toàn màn hình" className="text-ink hover:text-accent">
          <MaximizeIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
