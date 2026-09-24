"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import MovieForm, { MovieFormHandle } from "@/components/admin/MovieForm";
import EpisodeManager from "@/components/admin/EpisodeManager";
import { useAuth } from "@/context/AuthContext";
import { getAdminMovieDetailApi } from "@/lib/api";
import {
  ChevronLeftIcon,
  ExternalLinkIcon,
  FilmIcon,
  PlayIcon,
  SparklesIcon,
} from "@/components/ui/icons";

interface AdminMovieEditClientProps {
  id: string;
}

export default function AdminMovieEditClient({ id }: AdminMovieEditClientProps) {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "episodes" ? "episodes" : "info";

  const formRef = useRef<MovieFormHandle>(null);
  const [activeTab, setActiveTab] = useState<"info" | "episodes">(initialTab);
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "episodes") {
      setActiveTab("episodes");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadMovie() {
      try {
        setLoading(true);
        const data = await getAdminMovieDetailApi(id, token);
        setMovie(data);
      } catch (err: any) {
        setError(err?.message || "Không thể tải thông tin phim.");
      } finally {
        setLoading(false);
      }
    }
    loadMovie();
  }, [id, token]);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6 pb-24">
      {/* ── PAGE HERO & PRIMARY ACTIONS ── */}
      <AdminPageHeader
        title={movie ? `Chỉnh Sửa: ${movie.name}` : "Studio Chỉnh Sửa Phim"}
        description={
          movie
            ? `Định dạng: ${movie.type === "series" ? "Phim Bộ" : movie.type === "tv-show" ? "TV Show" : "Phim Lẻ"} • Chất lượng: ${movie.quality || "HD"} • Năm: ${movie.year || "N/A"}`
            : "Đang tải dữ liệu từ máy chủ..."
        }
      >
        <div className="flex items-center gap-2">
          {movie && (
            <Link
              href={`/phim/${movie.slug}`}
              target="_blank"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <span>Xem trang web</span>
              <ExternalLinkIcon className="h-3 w-3" />
            </Link>
          )}
          <Link
            href="/admin/movies"
            className="flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            <span>Quản lý phim</span>
          </Link>
        </div>
      </AdminPageHeader>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-500">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent mb-2" />
          <p>Đang tải thông tin phim...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-5 text-center text-xs text-rose-400 font-medium">
          {error}
        </div>
      ) : movie ? (
        <>
          {/* ── TOP TABS: INFO VS EPISODES ── */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex rounded-lg bg-white/[0.03] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  activeTab === "info"
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FilmIcon className="h-3.5 w-3.5" />
                <span>1. Thông Tin & Media</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("episodes")}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  activeTab === "episodes"
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <PlayIcon className="h-3.5 w-3.5" />
                <span>2. Tập Phim & Video</span>
                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                  {movie.episodes?.length || 0}
                </span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Slug:</span>
              <code className="font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {movie.slug}
              </code>
              {activeTab === "info" && (
                <button
                  type="button"
                  onClick={() => formRef.current?.fetchPhimApi()}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                  title="Tự động lấy toàn bộ thông tin & ảnh từ PhimAPI"
                >
                  <SparklesIcon className="h-3 w-3 text-slate-400" />
                  <span>Lấy từ PhimAPI</span>
                </button>
              )}
            </div>
          </div>

          {/* ── TAB CONTENT ── */}
          {activeTab === "info" ? (
            <MovieForm ref={formRef} initialData={movie} isEdit={true} />
          ) : (
            <EpisodeManager movieId={movie.id} />
          )}
        </>
      ) : null}
    </main>
  );
}
