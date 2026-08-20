"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  bulkAdminMoviesApi,
  deleteAdminMovieApi,
  getAdminMoviesApi,
} from "@/lib/api";
import type {
  AdminBulkActionType,
  AdminMovieListItem,
  AdminMovieMetaCounts,
} from "@/types/admin";
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  FilmIcon,
  FlameIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  SquareIcon,
  TrashIcon,
  TvIcon,
  XIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SavedViewTab = "all" | "ongoing" | "series" | "single" | "featured" | "hidden";
type RowDensity = "comfortable" | "compact";

export default function AdminMoviesPage() {
  const { token } = useAuth();

  // Data states
  const [movies, setMovies] = useState<AdminMovieListItem[]>([]);
  const [counts, setCounts] = useState<AdminMovieMetaCounts>({
    total: 0,
    active: 0,
    series: 0,
    single: 0,
    featured: 0,
    cinema: 0,
    hidden: 0,
  });
  const [meta, setMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });
  const [loading, setLoading] = useState(true);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<SavedViewTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [qualityFilter, setQualityFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Row selection & Bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Density & View preferences
  const [density, setDensity] = useState<RowDensity>("comfortable");

  // Deletion
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 300ms Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else toast.success(message);
  };

  // Determine query parameters based on current saved view tab + manual filters
  const buildQueryParams = () => {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      per_page: perPage,
      sort: sortField,
      order: sortOrder,
    };

    if (debouncedSearch) {
      params.q = debouncedSearch;
    }

    // Apply manual filters
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (qualityFilter) params.quality = qualityFilter;

    // Apply Saved View tab overrides
    if (activeTab === "ongoing") {
      params.status = "ongoing";
    } else if (activeTab === "series") {
      params.type = "series";
    } else if (activeTab === "single") {
      params.type = "single";
    } else if (activeTab === "featured") {
      params.is_featured = true;
    } else if (activeTab === "hidden") {
      params.is_active = false;
    }

    return params;
  };

  const loadMovies = async () => {
    try {
      setLoading(true);
      const params = buildQueryParams();
      const res = await getAdminMoviesApi(params, token);
      setMovies(res.data);
      setMeta({
        currentPage: res.meta.currentPage,
        lastPage: res.meta.lastPage,
        total: res.meta.total,
        perPage: res.meta.perPage,
      });
      if (res.meta.counts) {
        setCounts(res.meta.counts);
      }
    } catch (err: any) {
      showToast(err?.message || "Không thể tải danh sách phim.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
    // Clear selection when query changes
    setSelectedIds([]);
  }, [
    activeTab,
    debouncedSearch,
    typeFilter,
    statusFilter,
    qualityFilter,
    sortField,
    sortOrder,
    page,
    perPage,
    token,
  ]);

  // Tab switcher
  const handleTabChange = (tab: SavedViewTab) => {
    setActiveTab(tab);
    setPage(1);
    // Reset specific conflicting filters when switching tabs
    if (tab === "series" || tab === "single") {
      setTypeFilter("");
    }
    if (tab === "ongoing") {
      setStatusFilter("");
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setQualityFilter("");
    setSortField("created_at");
    setSortOrder("desc");
    setActiveTab("all");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
    typeFilter ||
    statusFilter ||
    qualityFilter ||
    activeTab !== "all" ||
    sortField !== "created_at" ||
    sortOrder !== "desc"
  );

  // Checkbox Selection
  const allCurrentPageSelected = useMemo(() => {
    if (movies.length === 0) return false;
    return movies.every((m) => selectedIds.includes(m.id));
  }, [movies, selectedIds]);

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentPageSelected) {
      const pageIds = new Set(movies.map((m) => m.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newSelected = new Set([...selectedIds, ...movies.map((m) => m.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete single movie
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phim "${name}" cùng toàn bộ tập phim liên quan không?`)) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteAdminMovieApi(id, token);
      setMovies((prev) => prev.filter((m) => m.id !== id));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast("Đã xóa phim thành công.", "success");
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi xóa phim.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk actions handler
  const handleBulkAction = async (action: AdminBulkActionType) => {
    if (selectedIds.length === 0) return;

    if (action === "delete") {
      const ok = confirm(
        `CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} bộ phim đã chọn không? Thao tác này không thể hoàn tác.`
      );
      if (!ok) return;
    }

    try {
      setBulkLoading(true);
      const res = await bulkAdminMoviesApi(
        { action, ids: selectedIds },
        token
      );
      showToast(res.message || `Đã xử lý ${selectedIds.length} phim thành công.`, "success");
      setSelectedIds([]);
      await loadMovies();
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi thực hiện thao tác hàng loạt.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Episode progress helper
  const renderEpisodeProgress = (current: string | null, total: string | null) => {
    const curStr = current || "0";
    const totStr = total || "?";

    const curNum = parseInt(curStr.replace(/[^0-9]/g, ""), 10) || 0;
    const totNum = parseInt(totStr.replace(/[^0-9]/g, ""), 10) || 0;

    let percentage = 0;
    if (totNum > 0 && curNum > 0) {
      percentage = Math.min(100, Math.round((curNum / totNum) * 100));
    } else if (curStr.toLowerCase().includes("full")) {
      percentage = 100;
    }

    return (
      <div className="space-y-1 min-w-[90px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-white/90">
            {curStr} <span className="text-white/40">/</span> {totStr}
          </span>
          {percentage > 0 && (
            <span className="text-[10px] text-accent font-medium tabular-nums">
              {percentage}%
            </span>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              percentage === 100
                ? "bg-emerald-500"
                : percentage >= 50
                ? "bg-accent"
                : "bg-amber-400"
            }`}
            style={{ width: `${Math.max(percentage, 5)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto pb-28">
      {/* ── PAGE HERO & PRIMARY ACTIONS ── */}
      <AdminPageHeader
        title="Quản Lý Phim & Studio"
        description={`Quản trị ${meta.total.toLocaleString()} tác phẩm điện ảnh trong kho lưu trữ.`}
      >
        <button
          type="button"
          onClick={loadMovies}
          title="Làm mới danh sách"
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          <RefreshCwIcon className={`h-4 w-4 ${loading ? "animate-spin text-accent" : ""}`} />
        </button>
        <Link
          href="/admin/movies/create"
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 h-9 text-xs font-semibold text-white shadow-sm hover:bg-accent/90 transition cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Thêm Phim Mới</span>
        </Link>
      </AdminPageHeader>

        {/* ── 1. KPI STATS CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Movies */}
          <div
            onClick={() => handleTabChange("all")}
            className={`group cursor-pointer rounded-xl border p-3.5 sm:p-4 transition-colors ${
              activeTab === "all"
                ? "border-white/20 bg-white/[0.05]"
                : "border-white/[0.08] bg-[#0d1017] hover:border-white/15 hover:bg-[#121620]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tổng Phim</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400">
                <FilmIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {counts.total.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">phim</span>
            </div>
          </div>

          {/* Card 2: Active / Ongoing Movies */}
          <div
            onClick={() => handleTabChange("ongoing")}
            className={`group cursor-pointer rounded-xl border p-3.5 sm:p-4 transition-colors ${
              activeTab === "ongoing"
                ? "border-white/20 bg-white/[0.05]"
                : "border-white/[0.08] bg-[#0d1017] hover:border-white/15 hover:bg-[#121620]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Đang Chiếu</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400">
                <ActivityIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {counts.active.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">đang chiếu</span>
            </div>
          </div>

          {/* Card 3: Series Movies */}
          <div
            onClick={() => handleTabChange("series")}
            className={`group cursor-pointer rounded-xl border p-3.5 sm:p-4 transition-colors ${
              activeTab === "series"
                ? "border-white/20 bg-white/[0.05]"
                : "border-white/[0.08] bg-[#0d1017] hover:border-white/15 hover:bg-[#121620]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Phim Bộ</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400">
                <TvIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {counts.series.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">bộ</span>
            </div>
          </div>

          {/* Card 4: Single Movies */}
          <div
            onClick={() => handleTabChange("single")}
            className={`group cursor-pointer rounded-xl border p-3.5 sm:p-4 transition-colors ${
              activeTab === "single"
                ? "border-white/20 bg-white/[0.05]"
                : "border-white/[0.08] bg-[#0d1017] hover:border-white/15 hover:bg-[#121620]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Phim Lẻ</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400">
                <SparklesIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {counts.single.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">lẻ</span>
            </div>
          </div>
        </div>

        {/* ── 2. SAVED-VIEW TABS ── */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === "all"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span>Tất cả</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums font-mono text-slate-300">
                {counts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("ongoing")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === "ongoing"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span>Đang chiếu</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("series")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === "series"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span>Phim bộ</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums font-mono text-slate-300">
                {counts.series}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("single")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === "single"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span>Phim lẻ</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums font-mono text-slate-300">
                {counts.single}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("featured")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === "featured"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <FlameIcon className="h-3.5 w-3.5 text-amber-400" />
              <span>Phim Hot</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums font-mono text-slate-300">
                {counts.featured}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("hidden")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                activeTab === "hidden"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <EyeOffIcon className="h-3.5 w-3.5 text-rose-400" />
              <span>Bị ẩn</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums font-mono text-slate-300">
                {counts.hidden}
              </span>
            </button>
          </div>

          {/* Density Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setDensity("comfortable")}
              title="Chế độ rộng rãi"
              className={`flex items-center justify-center h-6 w-6 rounded transition cursor-pointer ${
                density === "comfortable"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GridIcon className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setDensity("compact")}
              title="Chế độ gọn nhẹ"
              className={`flex items-center justify-center h-6 w-6 rounded transition cursor-pointer ${
                density === "compact"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ── 3. FILTER TOOLBAR ── */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between rounded-xl border border-white/[0.08] bg-[#0d1017] p-3 sm:p-3.5">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Search Input with Debounce */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên phim, slug..."
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none transition"
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

            {/* Type Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Định dạng: Tất cả</option>
              <option value="single">Phim Lẻ</option>
              <option value="series">Phim Bộ</option>
              <option value="tv-show">TV Show</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="ongoing">Đang chiếu</option>
              <option value="completed">Hoàn thành</option>
              <option value="trailer">Sắp chiếu</option>
            </select>

            {/* Quality Dropdown */}
            <select
              value={qualityFilter}
              onChange={(e) => {
                setQualityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Chất lượng: Tất cả</option>
              <option value="4K">4K Ultra HD</option>
              <option value="FHD">Full HD (1080p)</option>
              <option value="HD">HD (720p)</option>
              <option value="CAM">CAM</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Options */}
            <select
              value={`${sortField}_${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split("_");
                setSortField(f);
                setSortOrder(o as "asc" | "desc");
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="created_at_desc">Mới nhất (Ngày tạo)</option>
              <option value="created_at_asc">Cũ nhất (Ngày tạo)</option>
              <option value="view_count_desc">Lượt xem nhiều nhất</option>
              <option value="rating_avg_desc">Đánh giá cao nhất</option>
              <option value="year_desc">Năm phát hành mới nhất</option>
              <option value="name_asc">Tên phim (A &rarr; Z)</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <XIcon className="h-3 w-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 4. CRM MOVIES DATA TABLE ── */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase text-[10px] tracking-wider select-none">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllCurrentPage}
                      className="flex items-center justify-center cursor-pointer text-white/60 hover:text-white"
                    >
                      {allCurrentPageSelected ? (
                        <CheckSquareIcon className="h-4 w-4 text-accent" />
                      ) : (
                        <SquareIcon className="h-4 w-4" />
                      )}
                    </button>
                  </th>

                  <th className="py-3 px-4 font-bold">Phim & Tác Phẩm</th>
                  <th className="py-3 px-4 font-bold">Định dạng / Năm</th>
                  <th className="py-3 px-4 font-bold">Tiến độ tập</th>
                  <th className="py-3 px-4 font-bold text-right">Lượt xem & Điểm</th>
                  <th className="py-3 px-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-white/40">
                      <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent mb-3" />
                      <p className="font-medium text-xs">Đang tải dữ liệu phim...</p>
                    </td>
                  </tr>
                ) : movies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-white/40">
                      <FilmIcon className="h-8 w-8 mx-auto mb-2 text-white/20" />
                      <p className="font-medium">Không tìm thấy bộ phim nào phù hợp với bộ lọc.</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 text-xs text-accent hover:underline font-semibold cursor-pointer"
                        >
                          Xóa bộ lọc để xem tất cả
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  movies.map((movie) => {
                    const isSelected = selectedIds.includes(movie.id);

                    return (
                      <tr
                        key={movie.id}
                        className={`transition-colors duration-150 group ${
                          isSelected
                            ? "bg-accent/[0.08]"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(movie.id)}
                            className="flex items-center justify-center cursor-pointer text-white/60 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquareIcon className="h-4 w-4 text-accent" />
                            ) : (
                              <SquareIcon className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        {/* Poster Thumbnail + Title */}
                        <td className={density === "compact" ? "py-2 px-4" : "py-3.5 px-4"}>
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`relative shrink-0 overflow-hidden rounded-lg bg-black/40 border border-white/10 shadow-sm ${
                                density === "compact" ? "h-11 w-8" : "h-14 w-10"
                              }`}
                            >
                              {movie.posterUrl || movie.thumbUrl ? (
                                <img
                                  src={movie.posterUrl || movie.thumbUrl || ""}
                                  alt={movie.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[9px] text-white/30">
                                  No img
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 max-w-sm">
                              <Link
                                href={`/admin/movies/${movie.id}`}
                                className="font-bold text-white hover:text-accent transition line-clamp-1 text-xs block"
                              >
                                {movie.name}
                              </Link>
                              <div className="flex items-center gap-2 text-[11px] text-white/40 mt-0.5 line-clamp-1">
                                <span>{movie.originName || movie.slug}</span>
                                {movie.year && (
                                  <span className="rounded bg-white/5 px-1.5 py-0.2 text-[10px] text-white/60 font-mono">
                                    {movie.year}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type & Quality Badges */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                movie.type === "series"
                                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                  : movie.type === "tv-show"
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              }`}
                            >
                              {movie.type === "single"
                                ? "Phim Lẻ"
                                : movie.type === "series"
                                ? "Phim Bộ"
                                : "TV Show"}
                            </span>

                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[9px] font-extrabold tracking-wider ${
                                movie.quality === "4K"
                                  ? "bg-amber-400 text-black"
                                  : movie.quality === "FHD"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-white/10 text-white/70"
                              }`}
                            >
                              {movie.quality || "HD"}
                            </span>
                          </div>
                        </td>

                        {/* Episode Progress */}
                        <td className="py-3 px-4">
                          {renderEpisodeProgress(movie.episodeCurrent, movie.episodeTotal)}
                        </td>

                        {/* Views & Rating */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-bold text-white text-xs tabular-nums">
                            {movie.viewCount.toLocaleString()}
                          </div>
                          <div className="flex items-center justify-end gap-1 text-[11px] text-amber-400 font-medium font-mono mt-0.5 tabular-nums">
                            <span>⭐</span>
                            <span>{Number(movie.ratingAvg || 0).toFixed(1)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/movies/${movie.id}`}
                              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
                            >
                              Sửa
                            </Link>

                            <Link
                              href={`/admin/movies/${movie.id}?tab=episodes`}
                              title="Quản lý tập phim"
                              className="rounded-lg border border-accent/30 bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/25 transition cursor-pointer"
                            >
                              Tập
                            </Link>

                            <button
                              type="button"
                              disabled={deletingId === movie.id}
                              onClick={() => handleDelete(movie.id, movie.name)}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition cursor-pointer disabled:opacity-50"
                              title="Xóa phim"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
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

          {/* ── PAGINATION CONTROLS ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/10 p-4 gap-4 bg-white/[0.01]">
            <div className="flex items-center gap-3 text-xs text-white/50">
              <div>
                Hiển thị{" "}
                <span className="font-bold text-white">
                  {meta.total === 0 ? 0 : (meta.currentPage - 1) * meta.perPage + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-white">
                  {Math.min(meta.currentPage * meta.perPage, meta.total)}
                </span>{" "}
                trong tổng số <span className="font-bold text-white">{meta.total}</span> phim
              </div>

              {/* Per page selector */}
              <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
                <span>Dòng/trang:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-white/10 bg-[#12151f] px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {meta.lastPage > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={meta.currentPage <= 1}
                  onClick={() => setPage(1)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                  title="Trang đầu"
                >
                  &laquo;
                </button>
                <button
                  type="button"
                  disabled={meta.currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                  <span>Trước</span>
                </button>

                <span className="px-3 text-xs font-bold text-white">
                  {meta.currentPage} / {meta.lastPage}
                </span>

                <button
                  type="button"
                  disabled={meta.currentPage >= meta.lastPage}
                  onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                >
                  <span>Sau</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={meta.currentPage >= meta.lastPage}
                  onClick={() => setPage(meta.lastPage)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                  title="Trang cuối"
                >
                  &raquo;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. BULK ACTIONS FLOATING BAR ── */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/15 bg-[#141824]/95 backdrop-blur-xl px-3.5 py-2.5 shadow-2xl animate-fade-in text-xs max-w-[calc(100%-1.5rem)] sm:max-w-xl">
            <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 shrink-0">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-accent text-[10px] font-bold text-white tabular-nums">
                {selectedIds.length}
              </span>
              <span className="font-semibold text-white">đã chọn</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Bật hiển thị */}
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("activate")}
                className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <EyeIcon className="h-3 w-3" />
                <span>Hiện</span>
              </button>

              {/* Ẩn phim */}
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("deactivate")}
                className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
              >
                <EyeOffIcon className="h-3 w-3" />
                <span>Ẩn</span>
              </button>

              {/* Bật Hot */}
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("feature")}
                className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <FlameIcon className="h-3 w-3" />
                <span>Hot</span>
              </button>

              {/* Xóa hàng loạt */}
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("delete")}
                className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <TrashIcon className="h-3 w-3" />
                <span>Xóa</span>
              </button>

              {/* Bỏ chọn */}
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => setSelectedIds([])}
                className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </main>
  );
}
