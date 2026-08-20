"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminTaxonomyGenreApi,
  deleteAdminTaxonomyGenreApi,
  getAdminTaxonomyGenresApi,
  updateAdminTaxonomyGenreApi,
} from "@/lib/api";
import { slugifyVietnamese } from "@/lib/slug";
import {
  CheckCircleIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  FilmIcon,
  FlameIcon,
  LayersIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { genreSchema, type GenreInput } from "@/schemas/taxonomy";
import { setFormApiErrors } from "@/lib/form-utils";

interface GenreData {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  movies_count?: number;
}

export default function AdminGenresPage() {
  const { token } = useAuth();
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Slide-over Drawer / Modal State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<GenreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError: setFormError,
    formState: { errors: formErrors, isSubmitting: saving },
  } = useForm<GenreInput>({
    resolver: zodResolver(genreSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  const currentSlug = watch("slug");

  // Delete Confirm Modal
  const [deletingGenre, setDeletingGenre] = useState<GenreData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    if (type === "error") toast.error(text);
    else toast.success(text);
  };

  const loadGenres = async () => {
    try {
      setLoading(true);
      const data = await getAdminTaxonomyGenresApi(token);
      setGenres(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err?.message || "Không thể tải danh sách thể loại.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGenres();
  }, [token]);

  const openAddDrawer = () => {
    setEditingGenre(null);
    reset({ name: "", slug: "", description: "" });
    setError(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (genre: GenreData) => {
    setEditingGenre(genre);
    reset({
      name: genre.name,
      slug: genre.slug,
      description: genre.description || "",
    });
    setError(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setIsDrawerOpen(false);
    setEditingGenre(null);
  };

  const handleSave = async (data: GenreInput) => {
    try {
      setError(null);
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || undefined,
      };

      if (editingGenre) {
        await updateAdminTaxonomyGenreApi(editingGenre.id, payload, token);
        showToast(`Đã cập nhật thể loại "${payload.name}" thành công.`);
      } else {
        await createAdminTaxonomyGenreApi(payload, token);
        showToast(`Đã thêm thể loại "${payload.name}" thành công.`);
      }

      setIsDrawerOpen(false);
      await loadGenres();
    } catch (err: any) {
      setFormApiErrors(err, setFormError, setError, "Có lỗi xảy ra khi lưu thể loại.");
    }
  };


  const confirmDelete = async () => {
    if (!deletingGenre) return;
    try {
      setDeleting(true);
      await deleteAdminTaxonomyGenreApi(deletingGenre.id, token);
      setGenres((prev) => prev.filter((g) => g.id !== deletingGenre.id));
      showToast(`Đã xóa thể loại "${deletingGenre.name}" thành công.`);
      setDeletingGenre(null);
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi xóa thể loại.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép slug "${text}" vào clipboard.`);
  };

  // Filtered List
  const filteredGenres = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }, [genres, search]);

  // KPI Computations
  const stats = useMemo(() => {
    const total = genres.length;
    let totalAssignments = 0;
    let emptyCount = 0;
    let topGenre: GenreData | null = null;
    let maxMovies = -1;

    for (const g of genres) {
      const count = g.movies_count ?? 0;
      totalAssignments += count;
      if (count === 0) emptyCount++;
      if (count > maxMovies) {
        maxMovies = count;
        topGenre = g;
      }
    }

    return {
      total,
      totalAssignments,
      emptyCount,
      topGenre: maxMovies > 0 ? topGenre : null,
      topCount: maxMovies > 0 ? maxMovies : 0,
    };
  }, [genres]);

  return (
    <>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* ── PAGE HERO & PRIMARY ACTIONS ── */}
        <AdminPageHeader
          title="Quản Lý Thể Loại"
          description="Danh mục phân loại thể loại phim theo chuẩn hệ thống"
        >
          <button
            type="button"
            onClick={openAddDrawer}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 h-9 text-xs font-semibold text-white shadow-sm hover:bg-accent/90 transition cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Thêm Thể Loại</span>
          </button>
        </AdminPageHeader>

        {/* ── KPI STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Genres */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tổng Thể Loại</span>
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
                <LayersIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">{stats.total}</span>
              <span className="text-[11px] text-slate-500">danh mục</span>
            </div>
          </div>

          {/* Top Genre */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Nhiều Phim Nhất</span>
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
                <FlameIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-sm font-semibold text-white truncate">
                {stats.topGenre ? stats.topGenre.name : "Chưa có"}
              </div>
              <span className="text-[11px] text-slate-400">
                {stats.topCount > 0 ? `${stats.topCount.toLocaleString()} phim` : "0 phim"}
              </span>
            </div>
          </div>

          {/* Total Movie Assignments */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tổng Lượt Gán</span>
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
                <FilmIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {stats.totalAssignments.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">lượt gán</span>
            </div>
          </div>

          {/* Empty Genres */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Chưa Gán Phim</span>
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
                <SparklesIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">{stats.emptyCount}</span>
              <span className="text-[11px] text-slate-500">thể loại trống</span>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR: SEARCH & ACTIONS ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-white/[0.08] bg-[#0d1017] p-3 sm:p-3.5">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên thể loại, slug..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>
              {filteredGenres.length} / {genres.length} thể loại
            </span>
            <button
              type="button"
              onClick={loadGenres}
              disabled={loading}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition disabled:opacity-40 cursor-pointer"
              title="Tải lại danh sách"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── CRM DATA TABLE ── */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-3.5">Thể Loại</th>
                  <th className="py-3 px-3.5">Đường Dẫn Tĩnh (Slug)</th>
                  <th className="py-3 px-3.5 text-center">Số Lượng Phim</th>
                  <th className="py-3 px-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCwIcon className="h-5 w-5 animate-spin text-accent" />
                        <span>Đang tải danh sách thể loại...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredGenres.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <LayersIcon className="h-6 w-6 text-slate-600" />
                        <span>Không tìm thấy thể loại nào phù hợp.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGenres.map((genre) => {
                    const count = genre.movies_count ?? 0;
                    return (
                      <tr
                        key={genre.id}
                        className="hover:bg-white/[0.02] transition group"
                      >
                        {/* Name + Description */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 shrink-0">
                              <LayersIcon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-white text-xs group-hover:text-accent transition-colors">
                                {genre.name}
                              </div>
                              {genre.description && (
                                <p className="text-[10px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                                  {genre.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Slug + Copy + Preview Link */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <code className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                              {genre.slug}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(genre.slug)}
                              className="p-1 rounded text-slate-500 hover:text-white transition cursor-pointer"
                              title="Sao chép slug"
                            >
                              <CopyIcon className="h-3 w-3" />
                            </button>
                            <Link
                              href={`/the-loai/${genre.slug}`}
                              target="_blank"
                              className="p-1 rounded text-slate-500 hover:text-white transition"
                              title="Xem trang thể loại trên web"
                            >
                              <ExternalLinkIcon className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>

                        {/* Movie Count Badge */}
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300 tabular-nums">
                            <span>{count.toLocaleString()} phim</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditDrawer(genre)}
                              className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                            >
                              <EditIcon className="h-3 w-3" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingGenre(genre)}
                              className="p-1 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Xóa thể loại"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SLIDE-OVER DRAWER (ADD / EDIT GENRE) ── */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={closeDrawer}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
              <div className="w-screen max-w-md bg-[#0f121b] border-l border-white/10 shadow-2xl flex flex-col">
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                      {editingGenre ? <EditIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        {editingGenre ? `Sửa Thể Loại: ${editingGenre.name}` : "Thêm Thể Loại Mới"}
                      </h2>
                      <p className="text-[11px] text-white/50">
                        {editingGenre ? "Cập nhật tên, slug và mô tả phân loại." : "Điền thông tin thể loại phim mới."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Drawer Form Body */}
                <form onSubmit={handleSubmit(handleSave)} className="flex-1 overflow-y-auto p-6 space-y-5" noValidate>
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 font-medium">
                      {error}
                    </div>
                  )}

                  {/* Field: Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white">
                      Tên thể loại <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("name", {
                        onChange: (e) => {
                          setValue("slug", slugifyVietnamese(e.target.value), { shouldValidate: true });
                        },
                      })}
                      placeholder="VD: Khoa Học Viễn Tưởng, Võ Thuật..."
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-white placeholder-white/30 backdrop-blur-sm transition focus:outline-none ${
                        formErrors.name
                          ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                          : "border-white/10 bg-white/5 focus:border-accent"
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-400 font-medium">{formErrors.name.message}</p>
                    )}
                    {currentSlug && (
                      <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <span className="text-slate-500">Slug tự động:</span>
                        <span className="text-slate-300">/the-loai/{currentSlug}</span>
                      </p>
                    )}
                  </div>

                  {/* Field: Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white">Mô tả thể loại</label>
                    <textarea
                      rows={4}
                      {...register("description")}
                      placeholder="Mô tả tóm tắt nội dung các bộ phim thuộc thể loại này..."
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-white placeholder-white/30 backdrop-blur-sm transition focus:outline-none resize-none ${
                        formErrors.description
                          ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                          : "border-white/10 bg-white/5 focus:border-accent"
                      }`}
                    />
                    {formErrors.description && (
                      <p className="text-xs text-red-400 font-medium">{formErrors.description.message}</p>
                    )}
                  </div>


                  {editingGenre && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[11px] space-y-1 text-white/50">
                      <div>
                        ID Thể loại: <span className="text-white font-mono">{editingGenre.id}</span>
                      </div>
                      <div>
                        Số phim đang gắn:{" "}
                        <span className="text-accent font-bold">{editingGenre.movies_count ?? 0}</span> phim
                      </div>
                    </div>
                  )}

                  {/* Drawer Footer Actions */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeDrawer}
                      disabled={saving}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-accent/25 hover:bg-accent/90 disabled:opacity-50 transition cursor-pointer"
                    >
                      {saving && <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />}
                      <span>{saving ? "Đang lưu..." : editingGenre ? "Cập Nhật" : "Thêm Mới"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE CONFIRMATION MODAL ── */}
        {deletingGenre && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f121b] p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <TrashIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Xác Nhận Xóa Thể Loại</h3>
                  <p className="text-xs text-white/50">Hành động này không thể hoàn tác.</p>
                </div>
              </div>

              <div className="text-xs text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                Bạn có chắc chắn muốn xóa thể loại{" "}
                <strong className="text-white font-bold">&ldquo;{deletingGenre.name}&rdquo;</strong>?
                {deletingGenre.movies_count && deletingGenre.movies_count > 0 ? (
                  <p className="mt-1 text-amber-400 font-medium">
                    ⚠️ Có {deletingGenre.movies_count} phim đang liên kết với thể loại này. Liên kết sẽ bị gỡ bỏ.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingGenre(null)}
                  disabled={deleting}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-500/25 hover:bg-red-600 disabled:opacity-50 transition cursor-pointer"
                >
                  {deleting && <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />}
                  <span>{deleting ? "Đang xóa..." : "Xóa Thể Loại"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
