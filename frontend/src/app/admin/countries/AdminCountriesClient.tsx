"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminTaxonomyCountryApi,
  deleteAdminTaxonomyCountryApi,
  getAdminTaxonomyCountriesApi,
  updateAdminTaxonomyCountryApi,
} from "@/lib/api";
import { slugifyVietnamese } from "@/lib/slug";
import {
  CheckCircleIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  FilmIcon,
  FlameIcon,
  GlobeIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { countrySchema, type CountryInput } from "@/schemas/taxonomy";
import { setFormApiErrors } from "@/lib/form-utils";

interface CountryData {
  id: number;
  name: string;
  slug: string;
  movies_count?: number;
}

export default function AdminCountriesClient() {
  const { token } = useAuth();
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Slide-over Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError: setFormError,
    formState: { errors: formErrors, isSubmitting: saving },
  } = useForm<CountryInput>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  const currentSlug = watch("slug");

  // Delete Confirm Modal
  const [deletingCountry, setDeletingCountry] = useState<CountryData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    if (type === "error") toast.error(text);
    else toast.success(text);
  };

  const loadCountries = async () => {
    try {
      setLoading(true);
      const data = await getAdminTaxonomyCountriesApi(token);
      setCountries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err?.message || "Không thể tải danh sách quốc gia.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCountries();
  }, [token]);

  const openAddDrawer = () => {
    setEditingCountry(null);
    reset({ name: "", slug: "", description: "" });
    setError(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (country: CountryData) => {
    setEditingCountry(country);
    reset({
      name: country.name,
      slug: country.slug,
      description: "",
    });
    setError(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setIsDrawerOpen(false);
    setEditingCountry(null);
  };

  const handleSave = async (data: CountryInput) => {
    try {
      setError(null);
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
      };

      if (editingCountry) {
        await updateAdminTaxonomyCountryApi(editingCountry.id, payload, token);
        showToast(`Đã cập nhật quốc gia "${payload.name}" thành công.`);
      } else {
        await createAdminTaxonomyCountryApi(payload, token);
        showToast(`Đã thêm quốc gia "${payload.name}" thành công.`);
      }

      setIsDrawerOpen(false);
      await loadCountries();
    } catch (err: any) {
      setFormApiErrors(err, setFormError, setError, "Có lỗi xảy ra khi lưu quốc gia.");
    }
  };

  const confirmDelete = async () => {
    if (!deletingCountry) return;
    try {
      setDeleting(true);
      await deleteAdminTaxonomyCountryApi(deletingCountry.id, token);
      setCountries((prev) => prev.filter((c) => c.id !== deletingCountry.id));
      showToast(`Đã xóa quốc gia "${deletingCountry.name}" thành công.`);
      setDeletingCountry(null);
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi xóa quốc gia.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép slug "${text}" vào clipboard.`);
  };

  // Filtered List
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [countries, search]);

  // KPI Computations
  const stats = useMemo(() => {
    const total = countries.length;
    let totalAssignments = 0;
    let emptyCount = 0;
    let topCountry: CountryData | null = null;
    let maxMovies = -1;

    for (const c of countries) {
      const count = c.movies_count ?? 0;
      totalAssignments += count;
      if (count === 0) emptyCount++;
      if (count > maxMovies) {
        maxMovies = count;
        topCountry = c;
      }
    }

    return {
      total,
      totalAssignments,
      emptyCount,
      topCountry: maxMovies > 0 ? topCountry : null,
      topCount: maxMovies > 0 ? maxMovies : 0,
    };
  }, [countries]);

  return (
    <>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* ── PAGE HERO & PRIMARY ACTIONS ── */}
        <AdminPageHeader
          title="Quản Lý Quốc Gia"
          description="Danh mục xuất xứ các quốc gia phát hành phim"
        >
          <button
            type="button"
            onClick={openAddDrawer}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 h-9 text-xs font-semibold text-white shadow-sm hover:bg-accent/90 transition cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Thêm Quốc Gia</span>
          </button>
        </AdminPageHeader>

        {/* ── KPI STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Countries */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tổng Quốc Gia</span>
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
                <GlobeIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">{stats.total}</span>
              <span className="text-[11px] text-slate-500">quốc gia</span>
            </div>
          </div>

          {/* Top Country */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Nhiều Phim Nhất</span>
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
                <FlameIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-sm font-semibold text-white truncate">
                {stats.topCountry ? stats.topCountry.name : "Chưa có"}
              </div>
              <span className="text-[11px] text-slate-400">
                {stats.topCount > 0 ? `${stats.topCount.toLocaleString()} phim` : "0 phim"}
              </span>
            </div>
          </div>

          {/* Total Movie Assignments */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tổng Phim Gán</span>
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

          {/* Empty Countries */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Chưa Có Phim</span>
              <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
                <SparklesIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">{stats.emptyCount}</span>
              <span className="text-[11px] text-slate-500">quốc gia trống</span>
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
              placeholder="Tìm theo tên quốc gia, slug..."
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
              {filteredCountries.length} / {countries.length} quốc gia
            </span>
            <button
              type="button"
              onClick={loadCountries}
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
                  <th className="py-3 px-3.5">Quốc Gia</th>
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
                        <span>Đang tải danh sách quốc gia...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCountries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <GlobeIcon className="h-6 w-6 text-slate-600" />
                        <span>Không tìm thấy quốc gia nào phù hợp.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCountries.map((country) => {
                    const count = country.movies_count ?? 0;
                    return (
                      <tr
                        key={country.id}
                        className="hover:bg-white/[0.02] transition group"
                      >
                        {/* Name */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 shrink-0">
                              <GlobeIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="font-semibold text-white text-xs group-hover:text-accent transition-colors">
                              {country.name}
                            </div>
                          </div>
                        </td>

                        {/* Slug + Copy + Preview Link */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <code className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                              {country.slug}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(country.slug)}
                              className="p-1 rounded text-slate-500 hover:text-white transition cursor-pointer"
                              title="Sao chép slug"
                            >
                              <CopyIcon className="h-3 w-3" />
                            </button>
                            <Link
                              href={`/quoc-gia/${country.slug}`}
                              target="_blank"
                              className="p-1 rounded text-slate-500 hover:text-white transition"
                              title="Xem trang quốc gia trên web"
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
                              onClick={() => openEditDrawer(country)}
                              className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                            >
                              <EditIcon className="h-3 w-3" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCountry(country)}
                              className="p-1 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Xóa quốc gia"
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

        {/* ── SLIDE-OVER DRAWER (ADD / EDIT COUNTRY) ── */}
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
                    <div className="h-8 w-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      {editingCountry ? <EditIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        {editingCountry ? `Sửa Quốc Gia: ${editingCountry.name}` : "Thêm Quốc Gia Mới"}
                      </h2>
                      <p className="text-[11px] text-white/50">
                        {editingCountry ? "Cập nhật tên và đường dẫn tĩnh quốc gia." : "Điền thông tin quốc gia phát hành phim mới."}
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
                      Tên quốc gia <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("name", {
                        onChange: (e) => {
                          setValue("slug", slugifyVietnamese(e.target.value), { shouldValidate: true });
                        },
                      })}
                      placeholder="VD: Hàn Quốc, Nhật Bản, Trung Quốc, Âu Mỹ..."
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
                        <span className="text-slate-300">/quoc-gia/{currentSlug}</span>
                      </p>
                    )}
                  </div>


                  {editingCountry && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[11px] space-y-1 text-white/50">
                      <div>
                        ID Quốc gia: <span className="text-white font-mono">{editingCountry.id}</span>
                      </div>
                      <div>
                        Số phim đang gắn:{" "}
                        <span className="text-purple-300 font-bold">{editingCountry.movies_count ?? 0}</span> phim
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
                      <span>{saving ? "Đang lưu..." : editingCountry ? "Cập Nhật" : "Thêm Mới"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE CONFIRMATION MODAL ── */}
        {deletingCountry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f121b] p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <TrashIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Xác Nhận Xóa Quốc Gia</h3>
                  <p className="text-xs text-white/50">Hành động này không thể hoàn tác.</p>
                </div>
              </div>

              <div className="text-xs text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                Bạn có chắc chắn muốn xóa quốc gia{" "}
                <strong className="text-white font-bold">&ldquo;{deletingCountry.name}&rdquo;</strong>?
                {deletingCountry.movies_count && deletingCountry.movies_count > 0 ? (
                  <p className="mt-1 text-amber-400 font-medium">
                    ⚠️ Có {deletingCountry.movies_count} phim đang liên kết với quốc gia này. Liên kết sẽ bị gỡ bỏ.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCountry(null)}
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
                  <span>{deleting ? "Đang xóa..." : "Xóa Quốc Gia"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
