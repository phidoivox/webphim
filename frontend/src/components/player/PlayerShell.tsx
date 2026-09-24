"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  ListVideoIcon,
  LockIcon,
  PauseIcon,
  PlayIcon,
  RotateCcw10Icon,
  UnlockIcon,
  XIcon,
} from "@/components/ui/icons";
import type { MovieEpisode } from "@/types/movie";
import { useVideoSession } from "@/hooks/useVideoSession";
import { cn } from "@/lib/utils";
import PlayerControls from "./PlayerControls";
import PlayerSettingsModal, { type MovieServerItem } from "./PlayerSettingsModal";
import PlayerEpisodeDrawer from "./PlayerEpisodeDrawer";

export type { MovieServerItem };

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
  const [flashState, setFlashState] = useState<{ type: "play" | "pause"; id: number } | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  // Time and Context Tracking Refs
  const currentTimeRef = useRef<number>(0);
  const prevSrcRef = useRef<string | null>(src);
  const prevEpisodeSlugRef = useRef<string>(currentSlug);
  const prevEpisodeIdRef = useRef<number | undefined>(episodeId);

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
    videoRef.current?.play().catch(() => {});
  }, [autoPlay]);

  // =================== UNIFIED VIDEO SESSION ===================
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
    if (resolvedStartTime > 0 && currentTimeRef.current <= 0) {
      targetSeekTimeRef.current = resolvedStartTime;
    }
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
      prevSrcRef.current = null;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Kiểm tra nếu là đổi Server trong cùng 1 tập phim
    const isSameEpisode =
      (prevEpisodeSlugRef.current === currentSlug ||
        (episodeId !== undefined && prevEpisodeIdRef.current === episodeId)) &&
      Boolean(prevSrcRef.current && prevSrcRef.current !== src);

    let startPos = 0;

    if (isSameEpisode) {
      // Giữ nguyên mốc thời gian đang xem dở trước khi đổi Server
      const currentPos = video.currentTime > 0 ? video.currentTime : currentTimeRef.current;
      startPos = currentPos > 0 ? currentPos : (resolvedStartTime > 0 ? resolvedStartTime : 0);
      wasPlayingRef.current = !video.paused;
    } else {
      // Đổi tập mới hoặc nạp lần đầu: Sử dụng resolvedStartTime
      startPos = resolvedStartTime > 0 ? resolvedStartTime : 0;
      prevEpisodeSlugRef.current = currentSlug;
      prevEpisodeIdRef.current = episodeId;
      wasPlayingRef.current = autoPlay;
    }

    targetSeekTimeRef.current = startPos;
    prevSrcRef.current = src;

    const restoreTime = () => {
      const t = targetSeekTimeRef.current;
      if (t > 0 && video) {
        try {
          if (video.readyState >= 1) {
            if (Math.abs(video.currentTime - t) > 1.5) {
              video.currentTime = t;
              setCurrentTime(t);
              currentTimeRef.current = t;
            }
            targetSeekTimeRef.current = 0;
            unlockSession();
          }
        } catch {}
      } else {
        unlockSession();
      }
    };

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startPosition: startPos > 0 ? startPos : -1,
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

      let recoverMediaCount = 0;
      let recoverNetworkCount = 0;

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (recoverNetworkCount < 3) {
                recoverNetworkCount++;
                hls.startLoad();
              } else {
                hls.destroy();
                setVideoError(true);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (recoverMediaCount < 3) {
                recoverMediaCount++;
                hls.recoverMediaError();
              } else {
                hls.destroy();
                setVideoError(true);
              }
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
  }, [src, autoPlay, currentSlug, episodeId, resolvedStartTime, unlockSession]);

  // Clean timers
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
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

  const skipTime = useCallback((seconds: number) => {
    if (isLocked) return;
    const video = videoRef.current;
    if (!video) return;
    targetSeekTimeRef.current = 0;
    const newTime = Math.min(Math.max(video.currentTime + seconds, 0), duration);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    currentTimeRef.current = newTime;
    updateCurrentTime(newTime, duration);
    unlockSession();
    showControls();
  }, [isLocked, duration, updateCurrentTime, unlockSession, showControls]);

  // HTML5 Screen Wake Lock API
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

  // HTML5 Media Session API
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
        togglePlay();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        togglePlay();
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
  }, [movieName, episodeName, title, posterUrl, skipTime, togglePlay]);

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

  // Keyboard Hotkeys: Space (Play/Pause), Left/Right (Seek), Up/Down (Volume), F (Fullscreen), M (Mute)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (isLocked) return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
        case "j":
        case "J":
          e.preventDefault();
          skipTime(-10);
          break;
        case "ArrowRight":
        case "l":
        case "L":
          e.preventDefault();
          skipTime(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, videoRef.current.volume + 0.1);
            handleVolumeChange(newVol);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, videoRef.current.volume - 0.1);
            handleVolumeChange(newVol);
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLocked, togglePlay, skipTime, handleVolumeChange, toggleMute]);

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
    currentTimeRef.current = newTime;
    updateCurrentTime(newTime, duration);
    unlockSession();
    showControls();
  };

  // Embed iframe fallback
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
            currentTimeRef.current = t;
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
                  currentTimeRef.current = t;
                }
                targetSeekTimeRef.current = 0;
              } catch {}
            }
          }}
          onCanPlay={() => {
            const t = targetSeekTimeRef.current;
            if (t > 0 && videoRef.current) {
              try {
                if (Math.abs(videoRef.current.currentTime - t) > 1.5) {
                  videoRef.current.currentTime = t;
                  setCurrentTime(t);
                  currentTimeRef.current = t;
                }
                targetSeekTimeRef.current = 0;
              } catch {}
            }
            if (wasPlayingRef.current || autoPlay) {
              videoRef.current?.play().catch(() => {});
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
                  currentTimeRef.current = 0;
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
                  currentTimeRef.current = resumeModal.time;
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

      {/* LOCK SCREEN BUTTON */}
      <div
        className={cn(
          "absolute left-5 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLocked((v) => !v);
            showControls();
          }}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-xl cursor-pointer",
            isLocked
              ? "bg-accent text-white scale-110"
              : "bg-black/40 text-white/80 hover:text-white hover:bg-black/70"
          )}
          title={isLocked ? "Mở khóa màn hình" : "Khóa màn hình"}
        >
          {isLocked ? <LockIcon className="h-5.5 w-5.5" /> : <UnlockIcon className="h-5.5 w-5.5" />}
        </button>
      </div>

      {/* CONTROLS OVERLAY */}
      {!isLocked && (
        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-black/95 via-transparent to-black/70 p-3.5 sm:p-5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-[max(0.875rem,env(safe-area-inset-bottom))] pl-[max(0.875rem,env(safe-area-inset-left))] pr-[max(0.875rem,env(safe-area-inset-right))] transition-opacity duration-300",
            controlsVisible || showDrawer ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={handleVideoClick}
        >
          {/* TOP OVERLAY BAR */}
          <div
            className="flex items-center justify-between text-sm text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="font-display font-extrabold text-sm sm:text-base text-white truncate max-w-lg drop-shadow-md"
              style={{ color: "#ffffff" }}
            >
              {title}
            </span>

            {/* Top-Right Episode List Toggle Button */}
            {episodes.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDrawer((v) => !v);
                  setActiveMenu("none");
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-400 transition-colors drop-shadow-sm cursor-pointer"
                style={{ color: "#ffffff" }}
              >
                <ListVideoIcon className="h-4 w-4" style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>Danh sách tập</span>
              </button>
            )}
          </div>

          {/* BOTTOM CONTROLS & TIMELINE BAR */}
          <PlayerControls
            playing={playing}
            muted={muted}
            volume={volume}
            currentTime={currentTime}
            duration={duration}
            activeMenu={activeMenu}
            onTogglePlay={togglePlay}
            onSkipTime={skipTime}
            onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange}
            onSeek={seek}
            onTogglePip={togglePip}
            onToggleFullscreen={toggleFullscreen}
            onToggleSettings={() => {
              setActiveMenu((curr) => (curr === "main" ? "none" : "main"));
              setShowDrawer(false);
            }}
            onToggleServerMenu={() => {
              setActiveMenu((curr) => (curr === "server" ? "none" : "server"));
              setShowDrawer(false);
            }}
          />
        </div>
      )}

      {/* EPISODE DRAWER OVERLAY */}
      <PlayerEpisodeDrawer
        showDrawer={showDrawer}
        movieName={movieName}
        title={title}
        posterUrl={posterUrl}
        episodes={episodes}
        currentSlug={currentSlug}
        baseHref={baseHref}
        onClose={() => setShowDrawer(false)}
      />

      {/* CUSTOM SETTINGS MENU POPOVER */}
      <PlayerSettingsModal
        activeMenu={activeMenu}
        qualities={qualities}
        selectedQuality={selectedQuality}
        playbackSpeed={playbackSpeed}
        aspectMode={aspectMode}
        servers={servers}
        selectedServerId={selectedServerId}
        onClose={() => setActiveMenu("none")}
        onSetMenu={setActiveMenu}
        onChangeQuality={changeQuality}
        onChangeSpeed={changeSpeed}
        onChangeAspect={changeAspect}
        onSelectServer={onSelectServer}
      />
    </div>
  );
}
