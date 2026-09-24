"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminEpisodeApi,
  deleteAdminEpisodeApi,
  getAdminEpisodesApi,
  syncAdminEpisodesApi,
  updateAdminEpisodeApi,
} from "@/lib/api";
import { parseEpisodesFromPhimApi } from "@/lib/phimapi";
import { slugifyVietnamese } from "@/lib/slug";
import type { AdminEpisodeItem, AdminEpisodeServer } from "@/types/admin";
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  FilmIcon,
  GridIcon,
  ListIcon,
  MaximizeIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
  SparklesIcon,
  TrashIcon,
  VideoIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EpisodeManagerProps {
  movieId: number | string;
}

type EpisodeViewMode = "grid" | "list";

interface StreamDiagnosticInfo {
  status: "idle" | "loading" | "playing" | "buffering" | "error";
  resolution: string;
  bitrate: string;
  bufferLength: number;
  errorMessage?: string;
  isLive?: boolean;
}

/**
 * Live HLS Stream Tester Component
 * Nhúng trực tiếp HLS.js để phát thử link .m3u8 hoặc hiển thị iframe nhúng
 */
function LiveHlsStreamTester({
  url,
  isEmbed = false,
  serverName,
  onClose,
}: {
  url: string;
  isEmbed?: boolean;
  serverName: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [diagnostics, setDiagnostics] = useState<StreamDiagnosticInfo>({
    status: "loading",
    resolution: "Đang dò tìm...",
    bitrate: "Đang tính toán...",
    bufferLength: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isEmbed || !url) return;

    const video = videoRef.current;
    if (!video) return;

    let hlsInstance: Hls | null = null;
    let bufferTimer: NodeJS.Timeout | null = null;

    setDiagnostics({
      status: "loading",
      resolution: "Đang nạp manifest...",
      bitrate: "Đang kết nối...",
      bufferLength: 0,
    });

    const setupBufferPolling = (hls: Hls) => {
      bufferTimer = setInterval(() => {
        if (!video) return;
        const buffered = video.buffered;
        if (buffered.length > 0) {
          const current = video.currentTime;
          let end = 0;
          for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= current && current <= buffered.end(i)) {
              end = buffered.end(i);
              break;
            }
          }
          const bufLen = Math.max(0, end - current);
          setDiagnostics((prev) => ({
            ...prev,
            bufferLength: Number(bufLen.toFixed(1)),
          }));
        }
      }, 800);
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Safari HLS
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        setDiagnostics((prev) => ({
          ...prev,
          status: "playing",
          resolution: `${video.videoWidth}x${video.videoHeight}`,
        }));
        video.play().catch(() => {});
      });
      video.addEventListener("playing", () => {
        setIsPlaying(true);
        setDiagnostics((prev) => ({ ...prev, status: "playing" }));
      });
      video.addEventListener("waiting", () => {
        setDiagnostics((prev) => ({ ...prev, status: "buffering" }));
      });
      video.addEventListener("error", () => {
        setDiagnostics({
          status: "error",
          resolution: "N/A",
          bitrate: "N/A",
          bufferLength: 0,
          errorMessage: "Trình duyệt không thể nạp luồng video (Kiểm tra CORS hoặc link hỏng).",
        });
      });
    } else if (Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const firstLevel = data.levels[0];
        const res = firstLevel ? `${firstLevel.width}x${firstLevel.height}` : "HD";
        const bit = firstLevel ? `${Math.round(firstLevel.bitrate / 1000)} kbps` : "Auto";

        setDiagnostics((prev) => ({
          ...prev,
          status: "playing",
          resolution: res,
          bitrate: bit,
        }));

        video.play().catch(() => {});
      });

      hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (hlsInstance) {
          const level = hlsInstance.levels[data.level];
          if (level) {
            setDiagnostics((prev) => ({
              ...prev,
              resolution: `${level.width}x${level.height}`,
              bitrate: `${Math.round(level.bitrate / 1000)} kbps`,
            }));
          }
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          let msg = "Lỗi phát stream HLS.";
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            msg = "Lỗi mạng hoặc bị chặn bởi chính sách CORS từ máy chủ chứa video.";
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            msg = "Lỗi giải mã codec phương tiện (Media Decode Error). Đang thử khôi phục...";
            hlsInstance?.recoverMediaError();
            return;
          }

          setDiagnostics({
            status: "error",
            resolution: "Lỗi",
            bitrate: "Lỗi",
            bufferLength: 0,
            errorMessage: msg,
          });
        }
      });

      setupBufferPolling(hlsInstance);
      hlsRef.current = hlsInstance;
    } else {
      setDiagnostics({
        status: "error",
        resolution: "N/A",
        bitrate: "N/A",
        bufferLength: 0,
        errorMessage: "Trình duyệt hiện tại không hỗ trợ phát HLS stream.",
      });
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      if (bufferTimer) clearInterval(bufferTimer);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [url, isEmbed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-[#0c0f17] p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <PlayIcon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Live Stream Tester &mdash;</span>
                <span className="text-accent">{serverName}</span>
              </h4>
              <p className="text-[10px] text-white/40 font-mono line-clamp-1 max-w-lg">
                {url}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-base font-bold cursor-pointer p-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Video Player or Embed iframe */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center group">
          {isEmbed ? (
            <iframe
              src={url}
              title="Embed Stream Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                controls={false}
                playsInline
                className="h-full w-full object-contain"
              />

              {/* Custom Mini Controls Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition duration-200">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-accent transition cursor-pointer"
                  >
                    {isPlaying ? (
                      <span className="font-mono text-xs font-bold">||</span>
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleMute}
                    className="text-white/80 hover:text-white cursor-pointer"
                  >
                    {isMuted ? (
                      <VolumeXIcon className="h-4 w-4 text-red-400" />
                    ) : (
                      <Volume2Icon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-white/70">
                    Buffer: {diagnostics.bufferLength}s
                  </span>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="text-white/80 hover:text-white cursor-pointer"
                  >
                    <MaximizeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Real-time Diagnostics Bar */}
        {!isEmbed && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <ActivityIcon className="h-3.5 w-3.5 text-accent" />
                <span>Bảng Chẩn Đoán Luồng Phát Trực Tiếp</span>
              </span>

              {/* Status Badge */}
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  diagnostics.status === "playing"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : diagnostics.status === "buffering"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                    : diagnostics.status === "loading"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    diagnostics.status === "playing"
                      ? "bg-emerald-400"
                      : diagnostics.status === "error"
                      ? "bg-red-400"
                      : "bg-amber-400"
                  }`}
                />
                <span>
                  {diagnostics.status === "playing"
                    ? "Đang phát tốt"
                    : diagnostics.status === "buffering"
                    ? "Nạp buffer..."
                    : diagnostics.status === "loading"
                    ? "Đang kết nối..."
                    : "Lỗi luồng stream"}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="rounded-lg bg-black/40 p-2 border border-white/5">
                <span className="text-white/40 block text-[10px]">Độ phân giải:</span>
                <span className="font-mono font-bold text-white">{diagnostics.resolution}</span>
              </div>
              <div className="rounded-lg bg-black/40 p-2 border border-white/5">
                <span className="text-white/40 block text-[10px]">Băng thông (Bitrate):</span>
                <span className="font-mono font-bold text-white">{diagnostics.bitrate}</span>
              </div>
              <div className="rounded-lg bg-black/40 p-2 border border-white/5">
                <span className="text-white/40 block text-[10px]">Bộ nhớ đệm (Buffer):</span>
                <span className="font-mono font-bold text-accent">{diagnostics.bufferLength}s</span>
              </div>
            </div>

            {diagnostics.errorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-[11px] text-red-400 font-medium">
                {diagnostics.errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition cursor-pointer"
          >
            Đóng Trình Phát
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EpisodeManager({ movieId }: EpisodeManagerProps) {
  const { token } = useAuth();
  const [episodes, setEpisodes] = useState<AdminEpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: Grid vs List
  const [viewMode, setViewMode] = useState<EpisodeViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Add / Edit Episode
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<AdminEpisodeItem | null>(null);

  // Form states for Episode
  const [epName, setEpName] = useState("");
  const [epSlug, setEpSlug] = useState("");
  const [servers, setServers] = useState<AdminEpisodeServer[]>([
    {
      serverName: "VIP #1 (HLS)",
      langType: "vietsub",
      linkM3u8: "",
      linkEmbed: "",
      isActive: true,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Stream Tester Modal State
  const [testingStream, setTestingStream] = useState<{
    url: string;
    isEmbed: boolean;
    serverName: string;
  } | null>(null);

  // PhimAPI Bulk Sync Modal State
  const [movieInfo, setMovieInfo] = useState<{ id: number; name: string; slug: string } | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncSlug, setSyncSlug] = useState("");
  const [clearExisting, setClearExisting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadEpisodes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminEpisodesApi(movieId, token);
      if (isMountedRef.current) {
        setEpisodes(res.episodes);
        if (res.movie) {
          setMovieInfo(res.movie);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error("Lỗi tải tập phim", err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [movieId, token]);

  useEffect(() => {
    void loadEpisodes();
  }, [loadEpisodes]);

  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return episodes;
    const q = searchQuery.trim().toLowerCase();
    return episodes.filter(
      (ep) =>
        ep.name.toLowerCase().includes(q) || ep.slug.toLowerCase().includes(q)
    );
  }, [episodes, searchQuery]);

  const handleEpNameChange = (name: string) => {
    setEpName(name);
    setEpSlug(slugifyVietnamese(name));
  };

  const openSyncModal = () => {
    setSyncSlug(movieInfo?.slug || "");
    setClearExisting(false);
    setShowSyncModal(true);
  };

  const handleSyncPhimApi = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = syncSlug
      .trim()
      .replace(/^https?:\/\/.*\/phim\//, "")
      .replace(/[\?#].*$/, "")
      .replace(/\/+$/, "")
      .trim();

    if (!cleanSlug) {
      toast.error("Vui lòng nhập slug phim hoặc đường dẫn từ PhimAPI.");
      return;
    }

    try {
      setSyncing(true);
      const res = await fetch(`https://phimapi.com/v1/api/phim/${encodeURIComponent(cleanSlug)}`);
      if (!res.ok) {
        throw new Error(`Không tìm thấy phim với slug "${cleanSlug}" trên PhimAPI (HTTP ${res.status}).`);
      }
      const json = await res.json();
      if (json.status !== "success" || !json.data?.item) {
        throw new Error(json.message || "Không tìm thấy dữ liệu bộ phim trên PhimAPI.");
      }

      const parsedEpisodes = parseEpisodesFromPhimApi(json.data.item.episodes);
      if (parsedEpisodes.length === 0) {
        toast.warning("Phim này chưa có danh sách tập hoặc máy chủ phát nào trên PhimAPI.");
        return;
      }

      const syncResult = await syncAdminEpisodesApi(
        movieId,
        {
          episodes: parsedEpisodes,
          clear_existing: clearExisting,
        },
        token
      );

      toast.success(syncResult.message || `Đã đồng bộ thành công ${syncResult.data.count} tập phim!`);
      setShowSyncModal(false);
      await loadEpisodes();
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra khi đồng bộ tập phim từ PhimAPI.");
    } finally {
      setSyncing(false);
    }
  };

  const openAddModal = () => {
    const nextEpNum = episodes.length + 1;
    const defaultName = episodes.length === 0 ? "Tập 1" : `Tập ${nextEpNum}`;
    setEditingEpisode(null);
    setEpName(defaultName);
    setEpSlug(slugifyVietnamese(defaultName));
    setServers([
      {
        serverName: "VIP #1 (HLS)",
        langType: "vietsub",
        linkM3u8: "",
        linkEmbed: "",
        isActive: true,
      },
    ]);
    setError(null);
    setShowAddModal(true);
  };

  const openEditModal = (ep: AdminEpisodeItem) => {
    setEditingEpisode(ep);
    setEpName(ep.name);
    setEpSlug(ep.slug);
    setServers(
      ep.servers.length > 0
        ? ep.servers
        : [
            {
              serverName: "VIP #1 (HLS)",
              langType: "vietsub",
              linkM3u8: "",
              linkEmbed: "",
              isActive: true,
            },
          ]
    );
    setError(null);
    setShowAddModal(true);
  };

  const handleAddServerRow = () => {
    setServers((prev) => [
      ...prev,
      {
        serverName: `Server Dự phòng #${prev.length + 1}`,
        langType: "thuyet-minh",
        linkM3u8: "",
        linkEmbed: "",
        isActive: true,
      },
    ]);
  };

  const handleRemoveServerRow = (index: number) => {
    setServers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServerChange = (index: number, field: keyof AdminEpisodeServer, val: any) => {
    setServers((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const updated = { ...s, [field]: val };
        // Smart URL auto-route
        if (field === "linkM3u8" && typeof val === "string") {
          const trimmed = val.trim();
          if (trimmed.includes("<iframe") || (trimmed.startsWith("http") && !trimmed.includes(".m3u8") && !trimmed.includes(".mp4") && trimmed.includes("embed"))) {
            updated.linkEmbed = trimmed;
            updated.linkM3u8 = "";
          }
        } else if (field === "linkEmbed" && typeof val === "string") {
          const trimmed = val.trim();
          if (trimmed.includes(".m3u8") || trimmed.endsWith(".mp4")) {
            updated.linkM3u8 = trimmed;
            updated.linkEmbed = "";
          }
        }
        return updated;
      })
    );
  };

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epName.trim()) {
      setError("Vui lòng nhập tên tập phim.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: epName,
        slug: epSlug || epName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        servers: servers.map((s, idx) => ({
          server_name: s.serverName,
          lang_type: s.langType,
          link_m3u8: s.linkM3u8 || null,
          link_embed: s.linkEmbed || null,
          sort_order: idx + 1,
          is_active: s.isActive ?? true,
        })),
      };

      if (editingEpisode) {
        await updateAdminEpisodeApi(editingEpisode.id, payload, token);
      } else {
        await createAdminEpisodeApi(movieId, payload, token);
      }

      toast.success(editingEpisode ? "Đã cập nhật tập phim!" : "Đã thêm tập phim mới!");
      setShowAddModal(false);
      loadEpisodes();
    } catch (err: any) {
      const msg = err?.message || "Lỗi khi lưu tập phim.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEpisode = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${name}" cùng toàn bộ link stream liên quan không?`)) {
      return;
    }
    try {
      await deleteAdminEpisodeApi(id, token);
      setEpisodes((prev) => prev.filter((ep) => ep.id !== id));
      toast.success(`Đã xóa tập phim "${name}" thành công.`);
    } catch (err: any) {
      const msg = err?.message || "Lỗi khi xóa tập phim.";
      toast.error(msg);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-6 space-y-5 shadow-sm">
      {/* ── HEADER & TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <FilmIcon className="h-4 w-4" />
            <span>Quản Lý Tập Phim & Nguồn Video</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng cộng <span className="font-semibold text-white">{episodes.length}</span> tập phim. Hỗ trợ kiểm duyệt trực tiếp HLS Stream (.m3u8) & iFrame.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid / List View Mode Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Chế độ lưới"
              className={`flex items-center justify-center h-7 w-7 rounded transition cursor-pointer ${
                viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
              }`}
            >
              <GridIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Chế độ bảng"
              className={`flex items-center justify-center h-7 w-7 rounded transition cursor-pointer ${
                viewMode === "list" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
              }`}
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={openSyncModal}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>Lấy từ PhimAPI</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition cursor-pointer"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>Thêm Tập</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER ROW ── */}
      {episodes.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tập phim..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredEpisodes.length} / {episodes.length} tập
          </div>
        </div>
      )}

      {/* ── EPISODES CONTENT ── */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent mb-2" />
          <p>Đang tải danh sách tập phim...</p>
        </div>
      ) : episodes.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
          <VideoIcon className="h-8 w-8 mx-auto mb-2 text-slate-600" />
          <p className="font-semibold text-slate-300">Chưa có tập phim nào.</p>
          <p className="text-[11px] mt-0.5 text-slate-500">
            Bấm &quot;Thêm Tập&quot; để thiết lập link phát hoặc &quot;Lấy tập từ PhimAPI&quot; để nạp tự động toàn bộ.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={openAddModal}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition cursor-pointer"
            >
              Thêm Tập Mới
            </button>
            <button
              type="button"
              onClick={openSyncModal}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>Lấy tập từ PhimAPI</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID CARD VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEpisodes.map((ep) => (
            <div
              key={ep.id}
              className="rounded-xl border border-white/[0.08] bg-[#121620] p-3.5 flex flex-col justify-between hover:border-white/15 transition group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <PlayIcon className="h-3 w-3 text-slate-400" />
                    <span>{ep.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{ep.slug}</span>
                </div>

                {/* Server badges & tester shortcuts */}
                <div className="mt-2.5 space-y-1.5">
                  {ep.servers.map((s, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300 text-[11px] line-clamp-1">
                          {s.serverName}
                        </span>
                        <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] uppercase font-semibold text-slate-300">
                          {s.langType}
                        </span>
                      </div>

                      {/* Stream Test Buttons */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {s.linkM3u8 && (
                          <button
                            type="button"
                            onClick={() =>
                              setTestingStream({
                                url: s.linkM3u8!,
                                isEmbed: false,
                                serverName: `${ep.name} - ${s.serverName} (HLS)`,
                              })
                            }
                            className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                          >
                            <PlayIcon className="h-2.5 w-2.5" />
                            <span>Phát thử HLS</span>
                          </button>
                        )}

                        {s.linkEmbed && (
                          <button
                            type="button"
                            onClick={() =>
                              setTestingStream({
                                url: s.linkEmbed!,
                                isEmbed: true,
                                serverName: `${ep.name} - ${s.serverName} (iFrame)`,
                              })
                            }
                            className="flex items-center gap-1 rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 hover:text-white transition cursor-pointer"
                          >
                            <ExternalLinkIcon className="h-2.5 w-2.5" />
                            <span>iFrame</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-white/[0.06] mt-3">
                <button
                  type="button"
                  onClick={() => openEditModal(ep)}
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEpisode(ep.id, ep.name)}
                  className="rounded border border-rose-500/20 bg-rose-500/10 p-1 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                  title="Xóa tập"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── LIST TABLE VIEW ── */
        <div className="rounded-xl border border-white/[0.08] bg-[#121620] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4 font-bold">Tập phim</th>
                  <th className="py-3 px-4 font-bold">Slug</th>
                  <th className="py-3 px-4 font-bold">Máy chủ phát (Servers)</th>
                  <th className="py-3 px-4 font-bold text-center">Kiểm duyệt Stream</th>
                  <th className="py-3 px-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEpisodes.map((ep) => (
                  <tr key={ep.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <PlayIcon className="h-3.5 w-3.5 text-accent" />
                      <span>{ep.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-white/40">{ep.slug}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {ep.servers.map((s, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/80"
                          >
                            {s.serverName} ({s.langType})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {ep.servers.some((s) => s.linkM3u8) && (
                          <button
                            type="button"
                            onClick={() => {
                              const s = ep.servers.find((srv) => srv.linkM3u8);
                              if (s?.linkM3u8) {
                                setTestingStream({
                                  url: s.linkM3u8,
                                  isEmbed: false,
                                  serverName: `${ep.name} - ${s.serverName}`,
                                });
                              }
                            }}
                            className="flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer"
                          >
                            <PlayIcon className="h-2.5 w-2.5" />
                            <span>Phát thử stream</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(ep)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEpisode(ep.id, ep.name)}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL ADD / EDIT EPISODE ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f121b] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FilmIcon className="h-4 w-4 text-accent" />
                <span>{editingEpisode ? `Sửa: ${editingEpisode.name}` : "Thêm Tập Phim Mới"}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEpisode} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white">
                  Tên tập phim <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={epName}
                  onChange={(e) => handleEpNameChange(e.target.value)}
                  placeholder="VD: Tập 1, Tập 12, hoặc Full"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                />

                {/* Quick name chips & Auto slug preview */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Gợi ý nhanh:</span>
                    {["Tập 1", "Tập 2", "Tập 3", "Full", "Bản Chiếu Rạp"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleEpNameChange(preset)}
                        className="text-[10px] rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {epSlug && (
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <span className="text-slate-500">Slug:</span>
                      <span className="text-slate-300">/{epSlug}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Server List Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                    <ServerIcon className="h-3.5 w-3.5" />
                    <span>Máy Chủ Phát Video (Streaming Servers)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddServerRow}
                    className="text-xs text-accent hover:underline font-semibold cursor-pointer"
                  >
                    + Thêm máy chủ phát
                  </button>
                </div>

                {servers.map((srv, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="Tên Server (VD: VIP #1 (HLS), Hydrax...)"
                        value={srv.serverName}
                        onChange={(e) => handleServerChange(idx, "serverName", e.target.value)}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-accent focus:outline-none"
                      />
                      <select
                        value={srv.langType}
                        onChange={(e) => handleServerChange(idx, "langType", e.target.value)}
                        className="rounded-lg border border-white/10 bg-[#141722] px-3 py-1.5 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                      >
                        <option value="vietsub">Vietsub</option>
                        <option value="thuyet-minh">Thuyết minh</option>
                        <option value="long-tieng">Lồng tiếng</option>
                        <option value="engsub">Engsub</option>
                        <option value="raw">Raw</option>
                      </select>

                      {servers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveServerRow(idx)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded cursor-pointer"
                        >
                          Xóa
                        </button>
                      )}
                    </div>

                    {/* M3U8 Direct Link + Test Button */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                          <span>🟢 Link m3u8 (Khuyên Dùng)</span>
                          <span className="text-slate-500 font-normal">&mdash; Luồng video HLS trực tiếp (.m3u8, .mp4)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Dán link m3u8: https://.../video.m3u8"
                          value={srv.linkM3u8 || ""}
                          onChange={(e) => handleServerChange(idx, "linkM3u8", e.target.value)}
                          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-accent focus:outline-none"
                        />
                        {srv.linkM3u8 && (
                          <button
                            type="button"
                            onClick={() =>
                              setTestingStream({
                                url: srv.linkM3u8!,
                                isEmbed: false,
                                serverName: `${epName} - ${srv.serverName}`,
                              })
                            }
                            className="flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer shrink-0"
                          >
                            <PlayIcon className="h-3 w-3" />
                            <span>Phát thử</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Embed iFrame Link + Test Button */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-sky-400 flex items-center gap-1">
                          <span>🔵 Link embed (Dự Phòng)</span>
                          <span className="text-slate-500 font-normal">&mdash; Link nhúng iFrame từ trang web thứ 3</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Dán link embed: https://.../embed/..."
                          value={srv.linkEmbed || ""}
                          onChange={(e) => handleServerChange(idx, "linkEmbed", e.target.value)}
                          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-accent focus:outline-none"
                        />
                        {srv.linkEmbed && (
                          <button
                            type="button"
                            onClick={() =>
                              setTestingStream({
                                url: srv.linkEmbed!,
                                isEmbed: true,
                                serverName: `${epName} - ${srv.serverName}`,
                              })
                            }
                            className="flex items-center gap-1 rounded-lg bg-blue-500/15 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/25 transition cursor-pointer shrink-0"
                          >
                            <ExternalLinkIcon className="h-3 w-3" />
                            <span>Thử iFrame</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white shadow-md shadow-accent/25 hover:bg-accent/90 disabled:opacity-50 transition cursor-pointer"
                >
                  {saving ? "Đang lưu..." : "Lưu tập phim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LIVE HLS STREAM TESTER MODAL ── */}
      {testingStream && (
        <LiveHlsStreamTester
          url={testingStream.url}
          isEmbed={testingStream.isEmbed}
          serverName={testingStream.serverName}
          onClose={() => setTestingStream(null)}
        />
      )}

      {/* ── MODAL BULK SYNC FROM PHIMAPI ── */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f121b] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-amber-400" />
                <span>Đồng Bộ Tập Phim Từ PhimAPI</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSyncPhimApi} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white">
                  Slug phim hoặc Link PhimAPI <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={syncSlug}
                  onChange={(e) => setSyncSlug(e.target.value)}
                  placeholder="VD: tinh-yeu-lap-lanh-phan-1 hoặc https://phimapi.com/phim/..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Hệ thống sẽ lấy danh sách toàn bộ các tập phim và các server phát (Vietsub, Thuyết minh,...) từ PhimAPI để nạp vào cơ sở dữ liệu.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200">Xóa toàn bộ tập phim cũ trước khi đồng bộ</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Nếu không chọn, hệ thống sẽ tự động cập nhật hoặc thêm mới các tập mà không làm mất bình luận hay lịch sử xem phim của tập cũ.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={syncing}
                  onClick={() => setShowSyncModal(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/25 hover:bg-amber-400 disabled:opacity-50 transition cursor-pointer"
                >
                  {syncing ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      <span>Đang nạp tập...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-3.5 w-3.5" />
                      <span>Bắt đầu đồng bộ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
