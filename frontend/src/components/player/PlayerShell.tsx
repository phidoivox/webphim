"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Hls from "hls.js";
import {
  AspectRatioIcon,
  CastIcon,
  ChevronRightIcon,
  GaugeIcon,
  ListVideoIcon,
  LockIcon,
  MaximizeIcon,
  PauseIcon,
  PipIcon,
  PlayIcon,
  RotateCcw10Icon,
  RotateCw10Icon,
  ServerIcon,
  SettingsIcon,
  SlidersIcon,
  UnlockIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "@/components/ui/icons";
import type { MovieEpisode } from "@/types/movie";
import { useVideoSession } from "@/hooks/useVideoSession";
import { toast } from "sonner";

export interface MovieServerItem {
  id: string | number;
  name?: string;
  serverName?: string;
}

interface PlayerShellProps {
  src: string | null;
  embedUrl?: string | null;
  title: string;
  autoPlay?: boolean;
  episodes?: MovieEpisode[];
  baseHref?: string;
  currentSlug?: string;
  posterUrl?: string;
  movieName?: string;
  movieId?: number;
  episodeId?: number;
  serverId?: number;
  movieSlug?: string;
  episodeName?: string;
  servers?: MovieServerItem[];
  selectedServerId?: string;
  onSelectServer?: (serverId: string) => void;
}

const HIDE_DELAY_MS = 3500;

export default function PlayerShell({
  src,
  embedUrl,
  title,
  autoPlay = false,
  episodes = [],
  baseHref = "",
  currentSlug = "",
  posterUrl = "",
  movieName = "",
  movieId,
  episodeId,
  serverId,
  movieSlug,
  episodeName,
  servers = [],
  selectedServerId = "",
  onSelectServer,
}: PlayerShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  // States
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [flashState, setFlashState] = useState<{ type: "play" | "pause"; id: number } | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  // Custom Settings Popover States
  const [activeMenu, setActiveMenu] = useState<"none" | "main" | "quality" | "speed" | "aspect" | "server">("none");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectMode, setAspectMode] = useState<"contain" | "cover" | "fill">("contain");

  // HLS Quality levels state
  const [qualities, setQualities] = useState<{ id: number; label: string }[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto

  // Autoplay
  useEffect(() => {
    if (!autoPlay) return;
    videoRef.current?.play().catch(() => {
      // Trình duyệt có thể chặn autoplay nếu chưa có tương tác người dùng, không báo lỗi hỏng video
    });
  }, [autoPlay]);

  // =================== UNIFIED VIDEO SESSION (FSM & SYNC ENGINE) ===================
  const {
    resolvedStartTime,
    resumeModal,
    dismissModal,
    unlockSession,
    updateCurrentTime,
    syncProgress,
  } = useVideoSession({
    movieId,
    episodeId,
    serverId,
    movieSlug: movieSlug || currentSlug,
    episodeSlug: currentSlug,
    movieName: movieName || title,
    episodeName,
    posterUrl,
  });

  const targetSeekTimeRef = useRef<number>(resolvedStartTime);
  useEffect(() => {
    targetSeekTimeRef.current = resolvedStartTime;
  }, [resolvedStartTime]);

  // Heartbeat đồng bộ Cloud định kỳ mỗi 5 giây khi video đang phát
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      syncProgress(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [playing, syncProgress]);

  // HLS stream binding & src change
  useEffect(() => {
    if (!src) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    wasPlayingRef.current = !video.paused;

    const restoreTime = () => {
      const t = targetSeekTimeRef.current;
      if (t > 0 && video) {
        try {
          if (video.readyState >= 1) {
            if (Math.abs(video.currentTime - t) > 1.5) {
              video.currentTime = t;
              setCurrentTime(t);
            }
            targetSeekTimeRef.current = 0; // Mốc khôi phục chỉ chạy đúng 1 lần duy nhất lúc mở phim
            unlockSession();
          }
        } catch {
          // Retry on next media event
        }
      } else {
        unlockSession();
      }
    };

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      // Chuẩn Netflix & VOD: Cấu hình startPosition, tối ưu độ phân giải theo kích thước màn hình và đệm mượt mà
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startPosition: resolvedStartTime > 0 ? resolvedStartTime : -1,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        restoreTime();
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setVideoError(false);
        if (data.levels && data.levels.length > 0) {
          const list = data.levels.map((lvl, idx) => ({
            id: idx,
            label: lvl.height ? `${lvl.height}p` : `Level ${idx + 1}`,
          }));
          setQualities(list);
        }

        restoreTime();

        if (autoPlay || wasPlayingRef.current) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (hls.autoLevelEnabled) {
          setSelectedQuality(-1);
        } else {
          setSelectedQuality(data.level);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setVideoError(true);
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.load();
    } else {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  // Clean timer
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && activeMenu === "none" && !showDrawer) {
        setControlsVisible(false);
      }
    }, HIDE_DELAY_MS);
  }, [activeMenu, showDrawer]);

  const triggerFlash = (type: "play" | "pause") => {
    setFlashState({ type, id: Date.now() });
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      setFlashState(null);
    }, 550);
  };

  const togglePlay = () => {
    if (isLocked) return;
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
      triggerFlash("play");
    } else {
      video.play().catch(() => setVideoError(true));
      triggerFlash("pause");
    }
    showControls();
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMenu !== "none") {
      setActiveMenu("none");
      return;
    }
    if (showDrawer) {
      setShowDrawer(false);
      return;
    }
    togglePlay();
  };

  const toggleMute = () => {
    if (isLocked) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || volume === 0) {
      const restoreVol = volume > 0 ? volume : 1;
      video.muted = false;
      video.volume = restoreVol;
      setMuted(false);
      setVolume(restoreVol);
    } else {
      video.muted = true;
      setMuted(true);
    }
    showControls();
  };

  const handleVolumeChange = (newVolume: number) => {
    if (isLocked) return;
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      video.muted = newVolume === 0;
    }
    setVolume(newVolume);
    setMuted(newVolume === 0);
    showControls();
  };

  const skipTime = (seconds: number) => {
    if (isLocked) return;
    const video = videoRef.current;
    if (!video) return;
    targetSeekTimeRef.current = 0;
    const newTime = Math.min(Math.max(video.currentTime + seconds, 0), duration);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    updateCurrentTime(newTime, duration);
    unlockSession();
    showControls();
  };

  // ── HTML5 SCREEN WAKE LOCK API (Chống tắt màn hình khi đang phát video) ──
  useEffect(() => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;

    let wakeLockSentinel: { release: () => Promise<void> } | null = null;

    const requestWakeLock = async () => {
      try {
        if (playing && !document.hidden) {
          const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } };
          wakeLockSentinel = await nav.wakeLock.request("screen");
        }
      } catch (e) {
        console.debug("WakeLock request error", e);
      }
    };

    const releaseWakeLock = async () => {
      try {
        if (wakeLockSentinel) {
          await wakeLockSentinel.release();
          wakeLockSentinel = null;
        }
      } catch (e) {
        console.debug("WakeLock release error", e);
      }
    };

    if (playing) {
      void requestWakeLock();
    } else {
      void releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        void releaseWakeLock();
      } else if (playing) {
        void requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      void releaseWakeLock();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playing]);

  // ── HTML5 MEDIA SESSION API (Đồng bộ màn hình khóa, phím media & tai nghe Bluetooth) ──
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const displayTitle = episodeName ? `${movieName || title} - ${episodeName}` : movieName || title;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: displayTitle,
      artist: "WebPhim HD",
      album: movieName || "Xem Phim Online",
      artwork: posterUrl
        ? [
            { src: posterUrl, sizes: "96x96", type: "image/jpeg" },
            { src: posterUrl, sizes: "256x256", type: "image/jpeg" },
            { src: posterUrl, sizes: "512x512", type: "image/jpeg" },
          ]
        : [],
    });

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        videoRef.current?.play();
        setPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        videoRef.current?.pause();
        setPlaying(false);
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const skip = details.seekOffset || 10;
        skipTime(-skip);
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const skip = details.seekOffset || 10;
        skipTime(skip);
      });
    } catch (e) {
      console.debug("MediaSession handler error", e);
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
      }
    };
  }, [movieName, episodeName, title, posterUrl, duration]);


  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
    showControls();
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      await video.requestPictureInPicture();
    }
  };

  const changeQuality = (qualityId: number) => {
    targetSeekTimeRef.current = 0;
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityId;
      setSelectedQuality(qualityId);
    }
    setActiveMenu("none");
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const changeAspect = (mode: "contain" | "cover" | "fill") => {
    setAspectMode(mode);
    const video = videoRef.current;
    if (video) {
      video.style.objectFit = mode;
      if (mode === "cover") {
        video.style.transform = "scale(1.33)";
      } else if (mode === "fill") {
        video.style.transform = "scale(1, 1.33)";
      } else {
        video.style.transform = "scale(1)";
      }
      video.style.transformOrigin = "center center";
      video.style.transition = "transform 0.3s ease, object-fit 0.3s ease";
    }
    setActiveMenu("none");
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const video = videoRef.current;
    if (!video) return;
    targetSeekTimeRef.current = 0;
    const newTime = Number(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    updateCurrentTime(newTime, duration);
    unlockSession();
    showControls();
  };

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

  // Embed iframe fallback với sandbox bảo mật cao
  if (!src && embedUrl) {
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={embedUrl}
          title={title}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  const currentQualityLabel =
    selectedQuality === -1
      ? "Auto"
      : qualities.find((q) => q.id === selectedQuality)?.label || "Auto";

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full bg-black overflow-hidden select-none"
      onMouseMove={showControls}
      onMouseLeave={() => {
        if (activeMenu === "none" && !showDrawer) setControlsVisible(false);
      }}
      onClick={handleVideoClick}
    >
      {src ? (
        <video
          ref={videoRef}
          className="h-full w-full block transition-transform duration-300 ease-out origin-center cursor-pointer"
          style={{
            objectFit: aspectMode,
            transform:
              aspectMode === "cover"
                ? "scale(1.33)"
                : aspectMode === "fill"
                ? "scale(1, 1.33)"
                : "scale(1)",
            transformOrigin: "center center",
          }}
          muted={muted}
          aria-label={title}
          playsInline
          onPlay={() => {
            setPlaying(true);
            showControls();
            if (resolvedStartTime <= 0 || (videoRef.current && Math.abs(videoRef.current.currentTime - resolvedStartTime) < 5)) {
              unlockSession();
            }
          }}
          onPause={() => {
            setPlaying(false);
            setControlsVisible(true);
            syncProgress(true);
          }}
          onEnded={() => {
            setPlaying(false);
            syncProgress(true);
          }}
          onSeeked={() => {
            unlockSession();
          }}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setCurrentTime(t);
            updateCurrentTime(t, duration);
          }}
          onLoadedMetadata={(e) => {
            setVideoError(false);
            setDuration(e.currentTarget.duration);
            const t = targetSeekTimeRef.current;
            if (t > 0) {
              try {
                if (Math.abs(e.currentTarget.currentTime - t) > 1.5) {
                  e.currentTarget.currentTime = t;
                  setCurrentTime(t);
                }
                targetSeekTimeRef.current = 0;
              } catch {}
            }
          }}
          onCanPlay={(e) => {
            const t = targetSeekTimeRef.current;
            if (t > 0) {
              try {
                if (Math.abs(e.currentTarget.currentTime - t) > 1.5) {
                  e.currentTarget.currentTime = t;
                  setCurrentTime(t);
                }
                targetSeekTimeRef.current = 0;
              } catch {}
            }
            unlockSession();
          }}
          onPlaying={() => setVideoError(false)}
          onError={() => setVideoError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-faint">
          Không có nguồn phát cho server này
        </div>
      )}

      {/* CINEMA RESUME CHOICE MODAL */}
      {resumeModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-[#14141a]/95 p-5 text-white shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200">
            {/* Header with badge & Close button */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 text-accent ring-1 ring-accent/30">
                  <PlayIcon className="h-4 w-4 fill-accent" />
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent">
                    Tiếp tục xem phim
                  </h4>
                  <span className="text-[10px] text-white/50">Lịch sử xem gần nhất</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  dismissModal();
                  unlockSession();
                }}
                className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white cursor-pointer"
                aria-label="Đóng hộp thoại"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Body Description */}
            <div className="py-4 space-y-1.5">
              <p className="text-sm font-semibold text-white/90 line-clamp-1">
                {resumeModal.movieName || title}
                {resumeModal.episodeName ? ` - ${resumeModal.episodeName}` : ""}
              </p>
              <p className="text-xs text-white/60 leading-relaxed">
                Bạn đã xem đến mốc{" "}
                <span className="font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                  {resumeModal.formattedTime}
                </span>
                . Bạn muốn tiếp tục xem từ đây hay bắt đầu lại từ đầu?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  targetSeekTimeRef.current = 0;
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                  if (hlsRef.current) {
                    try {
                      hlsRef.current.startLoad(0);
                    } catch {}
                  }
                  const targetSlug = currentSlug || movieSlug;
                  if (targetSlug && typeof window !== "undefined") {
                    try {
                      localStorage.setItem(
                        `webphim_progress_${targetSlug}`,
                        JSON.stringify({ time: 0, duration: Math.floor(duration), updated: Date.now() })
                      );
                    } catch {}
                  }
                  updateCurrentTime(0, duration);
                  syncProgress(true);
                  unlockSession();
                  dismissModal();
                  videoRef.current?.play().catch(() => {});
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <RotateCcw10Icon className="h-3.5 w-3.5" />
                <span>Xem từ đầu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  targetSeekTimeRef.current = resumeModal.time;
                  if (videoRef.current) {
                    videoRef.current.currentTime = resumeModal.time;
                    setCurrentTime(resumeModal.time);
                  }
                  unlockSession();
                  dismissModal();
                  videoRef.current?.play().catch(() => {});
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-hover cursor-pointer"
              >
                <PlayIcon className="h-3.5 w-3.5 fill-white" />
                <span>Tiếp tục xem</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTER ANIMATED ACTION RIPPLE INDICATOR */}
      {flashState && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div
            key={flashState.id}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md shadow-2xl animate-player-ripple"
          >
            {flashState.type === "play" ? (
              <PlayIcon className="h-8 w-8 text-white fill-white ml-0.5 shrink-0" />
            ) : (
              <PauseIcon className="h-8 w-8 text-white fill-white shrink-0" />
            )}
          </div>
        </div>
      )}

      {/* Video Error Message */}
      {videoError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/90 text-sm text-muted">
          <p>Không thể tải luồng video — vui lòng chuyển Server khác.</p>
        </div>
      )}

      {/* LOCK SCREEN BUTTON (Middle-Left Edge) */}
      <div
        className={`absolute left-5 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLocked((v) => !v);
            showControls();
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-xl ${
            isLocked
              ? "bg-accent text-white scale-110"
              : "bg-black/40 text-white/80 hover:text-white hover:bg-black/70"
          }`}
          title={isLocked ? "Mở khóa màn hình" : "Khóa màn hình"}
        >
          {isLocked ? <LockIcon className="h-5.5 w-5.5" /> : <UnlockIcon className="h-5.5 w-5.5" />}
        </button>
      </div>

      {/* CONTROLS OVERLAY (HIDDEN WHEN LOCKED OR INACTIVE) */}
      {!isLocked && (
        <div
          className={`absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-black/95 via-transparent to-black/70 p-4 sm:p-5 transition-opacity duration-300 ${
            controlsVisible || showDrawer ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={handleVideoClick}
        >
          {/* TOP OVERLAY BAR */}
          <div
            className="flex items-center justify-between text-sm text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Pure White Title */}
            <span
              className="font-display font-extrabold text-sm sm:text-base text-white truncate max-w-lg drop-shadow-md"
              style={{ color: "#ffffff" }}
            >
              {title}
            </span>

            {/* 2. Top-Right Episode List Toggle Button */}
            {episodes.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDrawer((v) => !v);
                  setActiveMenu("none");
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-400 transition-colors drop-shadow-sm"
                style={{ color: "#ffffff" }}
              >
                <ListVideoIcon className="h-4 w-4" style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>Danh sách tập</span>
              </button>
            )}
          </div>

          {/* BOTTOM CONTROLS & TIMELINE BAR */}
          <div
            className="space-y-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Timeline Progress Bar */}
            <div
              ref={timelineRef}
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={handleTimelineMouseLeave}
              onClick={(e) => e.stopPropagation()}
              className="relative flex items-center group/slider cursor-pointer py-1"
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
                onChange={seek}
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

            {/* Controls Button Row (Borderless Transparent Icons) */}
            <div className="flex items-center justify-between text-white/90">
              {/* Left Controls Group */}
              <div className="flex items-center gap-2 sm:gap-3.5">
                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Tạm dừng" : "Phát"}
                  className="text-white hover:text-accent transition-colors"
                >
                  {playing ? <PauseIcon className="h-7 w-7 sm:h-8 sm:w-8" /> : <PlayIcon className="h-7 w-7 sm:h-8 sm:w-8" />}
                </button>

                {/* Skip -10s */}
                <button
                  type="button"
                  onClick={() => skipTime(-10)}
                  title="Lùi 10 giây"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <RotateCcw10Icon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                </button>

                {/* Skip +10s */}
                <button
                  type="button"
                  onClick={() => skipTime(10)}
                  title="Tiến 10 giây"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <RotateCw10Icon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                </button>

                {/* Volume Control Group (Hover to expand slider bar) */}
                <div className="group/volume flex items-center">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted || volume === 0 ? "Bật tiếng" : "Tắt tiếng"}
                    className="text-white/80 hover:text-white transition-colors"
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
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
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
                <span className="font-mono text-xs sm:text-sm font-bold tracking-wide text-white shrink-0 ml-1">
                  {formatTime(currentTime, duration)} / {formatTime(duration, duration)}
                </span>
              </div>

              {/* Right Controls Group */}
              <div className="relative flex items-center gap-2 sm:gap-3.5">
                {/* Server Quick Selector Button (Server Icon) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu((curr) => (curr === "server" ? "none" : "server"));
                    setShowDrawer(false);
                  }}
                  title="Chọn Máy chủ phát"
                  className={`transition-colors ${
                    activeMenu === "server" ? "text-accent scale-110" : "text-white/80 hover:text-white"
                  }`}
                >
                  <ServerIcon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                </button>

                {/* Screen Cast */}
                <button
                  type="button"
                  onClick={() => toast.info("Tính năng truyền màn hình (Cast) đang sẵn sàng.")}
                  title="Truyền màn hình (Cast)"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <CastIcon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                </button>

                {/* Picture in Picture */}
                <button
                  type="button"
                  onClick={togglePip}
                  title="Xem dạng cửa sổ thu nhỏ (PiP)"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <PipIcon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                </button>

                {/* Settings Gear Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu((curr) => (curr === "main" ? "none" : "main"));
                    setShowDrawer(false);
                  }}
                  title="Cài đặt phát video"
                  className={`transition-transform ${
                    ["main", "quality", "speed", "aspect"].includes(activeMenu)
                      ? "text-accent rotate-45"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <SettingsIcon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label="Toàn màn hình"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <MaximizeIcon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EPISODE DRAWER OVERLAY (SLIDE-OVER PANEL ON THE RIGHT SIDE) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute right-0 top-0 bottom-0 z-40 w-72 sm:w-80 bg-[#121116]/75 border-l border-white/20 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-300 ease-in-out ${
          showDrawer ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
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
            onClick={() => setShowDrawer(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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
                onClick={() => setShowDrawer(false)}
                className={`group flex items-center gap-3 rounded-xl p-2 transition-all ${
                  active ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                {/* Episode 16:9 Thumbnail Image */}
                <div
                  className={`relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden shrink-0 bg-surface border-2 transition-all ${
                    active ? "border-amber-500 shadow-md shadow-amber-500/20" : "border-white/10 group-hover:border-white/30"
                  }`}
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
                    className={`text-xs sm:text-sm font-bold truncate block ${
                      active ? "text-amber-400" : "text-white/80 group-hover:text-white"
                    }`}
                  >
                    {ep.name.startsWith("Tập") ? ep.name : `Tập ${ep.name}`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CUSTOM SETTINGS MENU POPOVER (BOTTOM-RIGHT POPUP) */}
      {activeMenu !== "none" && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-16 right-4 sm:right-6 z-40 w-64 sm:w-72 rounded-[22px] border border-white/20 bg-[#121116]/70 p-4 text-xs sm:text-sm text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 ease-out animate-rise"
        >
          {/* Main Settings Menu (Matching Screenshot 1) */}
          {activeMenu === "main" && (
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-white text-base mb-3 px-1">
                Cài đặt
              </h4>

              {/* Quality Item */}
              <button
                type="button"
                onClick={() => setActiveMenu("quality")}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-white/5 transition-colors group"
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
                onClick={() => setActiveMenu("speed")}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-white/5 transition-colors group"
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
                onClick={() => setActiveMenu("aspect")}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-white/5 transition-colors group"
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

          {/* Sub-menu: Quality Selection (Matching Screenshot 2) */}
          {activeMenu === "quality" && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setActiveMenu("main")}
                className="flex items-center gap-2 text-sm font-bold text-white pb-2.5 border-b border-white/10 w-full text-left"
              >
                <ChevronRightIcon className="h-4 w-4 rotate-180 text-white/70" />
                <span>Chất lượng</span>
              </button>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => changeQuality(-1)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs sm:text-sm transition-colors ${
                    selectedQuality === -1 ? "font-bold text-white" : "font-medium text-white/70 hover:text-white"
                  }`}
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
                      onClick={() => changeQuality(q.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs sm:text-sm transition-colors ${
                        isSelected ? "font-bold text-white" : "font-medium text-white/70 hover:text-white"
                      }`}
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

          {/* Sub-menu: Speed Selection (Matching Screenshot 3) */}
          {activeMenu === "speed" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setActiveMenu("main")}
                className="flex items-center gap-2 text-sm font-bold text-white pb-2.5 border-b border-white/10 w-full text-left"
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
                  onClick={() => changeSpeed(Math.max(0.25, Number((playbackSpeed - 0.25).toFixed(2))))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#323136] hover:bg-[#3e3d43] text-white font-bold text-base transition-colors shrink-0"
                >
                  -
                </button>
                <input
                  type="range"
                  min={0.25}
                  max={2.0}
                  step={0.05}
                  value={playbackSpeed}
                  onChange={(e) => changeSpeed(Number(e.target.value))}
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
                  onClick={() => changeSpeed(Math.min(2.0, Number((playbackSpeed + 0.25).toFixed(2))))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#323136] hover:bg-[#3e3d43] text-white font-bold text-base transition-colors shrink-0"
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
                      onClick={() => changeSpeed(s)}
                      className={`flex-1 rounded-[14px] py-2 text-xs transition-all ${
                        isActive
                          ? "bg-[#3a393e] text-white font-bold shadow-md"
                          : "bg-[#252428] text-white/70 hover:text-white font-semibold"
                      }`}
                    >
                      {s.toFixed(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-menu: Aspect Ratio Selection (Matching Screenshot 4) */}
          {activeMenu === "aspect" && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setActiveMenu("main")}
                className="flex items-center gap-2 text-sm font-bold text-white pb-2.5 border-b border-white/10 w-full text-left"
              >
                <ChevronRightIcon className="h-4 w-4 rotate-180 text-white/70" />
                <span>Tỉ lệ màn hình</span>
              </button>

              <div className="space-y-3 pt-1">
                {/* Contain */}
                <button
                  type="button"
                  onClick={() => changeAspect("contain")}
                  className="w-full text-left transition-colors group"
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

                {/* Cover */}
                <button
                  type="button"
                  onClick={() => changeAspect("cover")}
                  className="w-full text-left transition-colors group"
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

                {/* Fill / Stretch */}
                <button
                  type="button"
                  onClick={() => changeAspect("fill")}
                  className="w-full text-left transition-colors group"
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

          {/* Sub-menu: Server Selection (Clean Minimalist List) */}
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
                  onClick={() => setActiveMenu("none")}
                  className="text-white/60 hover:text-white transition-colors"
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
                        setActiveMenu("none");
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs sm:text-sm transition-colors ${
                        isSelected
                          ? "bg-white/10 font-bold text-white"
                          : "font-medium text-white/70 hover:text-white hover:bg-white/5"
                      }`}
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
      )}
    </div>
  );
}


