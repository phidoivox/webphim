"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  deleteAdminReportApi,
  getAdminDashboardStatsApi,
  getAdminReportsApi,
  updateAdminReportApi,
} from "@/lib/api";
import type { AdminReportItem } from "@/types/admin";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  ExternalLinkIcon,
  FilmIcon,
  FilterIcon,
  LayersIcon,
  MessageCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
  SparklesIcon,
  SubtitlesIcon,
  TrashIcon,
  UserIcon,
  Volume2Icon,
  XCircleIcon,
  XIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminReportsClient() {
  const { token } = useAuth();
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Global KPI numbers
  const [kpiPending, setKpiPending] = useState<number>(0);
  const [kpiResolved, setKpiResolved] = useState<number>(0);
  const [kpiTotal, setKpiTotal] = useState<number>(0);

  // Drawer / Modal View & Admin Note
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [drawerStatus, setDrawerStatus] = useState<"pending" | "resolved" | "rejected">("pending");
  const [drawerSaving, setDrawerSaving] = useState(false);

  // Delete modal
  const [deletingReport, setDeletingReport] = useState<AdminReportItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    if (type === "error") toast.error(text);
    else toast.success(text);
  };

  const loadKpis = async () => {
    try {
      const stats = await getAdminDashboardStatsApi(token);
      if (stats?.kpis?.pendingReports !== undefined) {
        setKpiPending(stats.kpis.pendingReports);
      }
    } catch {
      // Non-blocking
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await getAdminReportsApi(
        {
          status: status || undefined,
          page: String(page),
        },
        token
      );
      setReports(res.data || []);
      setMeta(res.meta || { currentPage: 1, lastPage: 1, total: 0, perPage: 20 });

      if (status === "pending") {
        setKpiPending(res.meta.total);
      }
    } catch (err: any) {
      showToast(err?.message || "Không thể tải danh sách báo cáo.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchKpis = async () => {
      try {
        const stats = await getAdminDashboardStatsApi(token);
        if (isMounted && stats?.kpis?.pendingReports !== undefined) {
          setKpiPending(stats.kpis.pendingReports);
        }
      } catch {
        // Non-blocking
      }
    };
    fetchKpis();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await getAdminReportsApi(
          {
            status: status || undefined,
            page: String(page),
          },
          token
        );
        if (isMounted) {
          setReports(res.data || []);
          setMeta(res.meta || { currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
          if (status === "pending") {
            setKpiPending(res.meta.total);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          showToast(err?.message || "Không thể tải danh sách báo cáo.", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchReports();
    return () => {
      isMounted = false;
    };
  }, [status, page, token]);

  const handleQuickUpdateStatus = async (reportId: number, newStatus: "resolved" | "rejected" | "pending") => {
    try {
      await updateAdminReportApi(reportId, { status: newStatus }, token);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: newStatus, resolvedAt: newStatus === "resolved" ? new Date().toISOString() : r.resolvedAt }
            : r
        )
      );
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport((prev) => (prev ? { ...prev, status: newStatus } : null));
        setDrawerStatus(newStatus);
      }

      if (newStatus === "resolved") {
        showToast("Đã đánh dấu báo cáo: ĐÃ SỬA XONG.");
      } else if (newStatus === "rejected") {
        showToast("Đã chuyển báo cáo sang: BỎ QUA.");
      } else {
        showToast("Đã chuyển về trạng thái: CHỜ XỬ LÝ.");
      }
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi cập nhật trạng thái.", "error");
    }
  };

  const openReportDrawer = (report: AdminReportItem) => {
    setSelectedReport(report);
    setAdminNote(report.adminNote || "");
    setDrawerStatus(report.status);
    setDrawerOpen(true);
  };

  const closeReportDrawer = () => {
    if (drawerSaving) return;
    setDrawerOpen(false);
    setSelectedReport(null);
  };

  const handleSaveDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setDrawerSaving(true);
      await updateAdminReportApi(
        selectedReport.id,
        {
          status: drawerStatus,
          admin_note: adminNote.trim() || undefined,
        },
        token
      );

      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? {
                ...r,
                status: drawerStatus,
                adminNote: adminNote.trim() || null,
                resolvedAt: drawerStatus === "resolved" ? new Date().toISOString() : r.resolvedAt,
              }
            : r
        )
      );

      showToast("Đã cập nhật ghi chú & trạng thái báo cáo thành công!");
      closeReportDrawer();
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi lưu ghi chú.", "error");
    } finally {
      setDrawerSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingReport) return;
    try {
      setDeleting(true);
      await deleteAdminReportApi(deletingReport.id, token);
      setReports((prev) => prev.filter((r) => r.id !== deletingReport.id));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      if (selectedReport?.id === deletingReport.id) {
        closeReportDrawer();
      }
      showToast("Đã xóa báo cáo sự cố thành công.");
      setDeletingReport(null);
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi xóa báo cáo.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Helper: Format Vietnamese Date
  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  // Filtered reports locally by Search & Type
  const filteredReports = useMemo(() => {
    let list = reports;

    if (typeFilter) {
      list = list.filter((r) => r.reportType.toLowerCase() === typeFilter.toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.movie?.name.toLowerCase().includes(q) ||
          r.episode?.name.toLowerCase().includes(q) ||
          r.user?.name.toLowerCase().includes(q) ||
          r.user?.email.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [reports, typeFilter, search]);

  // Report Type Badge & Icon Helper
  const renderReportTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "broken_link":
      case "link hỏng":
      case "chết link":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
            <XCircleIcon className="h-3 w-3" />
            Link hỏng / Chết link
          </span>
        );
      case "wrong_subtitle":
      case "sai phụ đề":
      case "lỗi sub":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
            <SubtitlesIcon className="h-3 w-3" />
            Sai phụ đề / Lệch sub
          </span>
        );
      case "playback_error":
      case "lỗi phát":
      case "đứng hình":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
            <AlertCircleIcon className="h-3 w-3" />
            Lỗi phát video
          </span>
        );
      case "audio_issue":
      case "lỗi âm thanh":
      case "mất tiếng":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
            <Volume2Icon className="h-3 w-3" />
            Lỗi âm thanh
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 border border-slate-500/30 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
            <MessageCircleIcon className="h-3 w-3" />
            {type || "Khác"}
          </span>
        );
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (st: string) => {
    switch (st) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircleIcon className="h-3 w-3" />
            Đã sửa
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            <XCircleIcon className="h-3 w-3" />
            Bỏ qua
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            <ClockIcon className="h-3 w-3" />
            Chờ xử lý
          </span>
        );
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* ── PAGE HERO & PRIMARY ACTIONS ── */}
      <AdminPageHeader
        title="Báo Cáo & Sự Cố Video"
        description="Tiếp nhận phản hồi link hỏng, lỗi âm thanh, sai phụ đề và xử lý sự cố stream"
      >
        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50 cursor-pointer"
          title="Tải lại danh sách báo cáo"
        >
          <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
          <span>Làm mới</span>
        </button>
      </AdminPageHeader>

      {/* ── KPI STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Reports */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Chờ Xử Lý</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <ClockIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {kpiPending.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">cần sửa</span>
          </div>
        </div>

        {/* Broken Links / Player Issues */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sự Cố Link/Phát</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <AlertCircleIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {reports.filter((r) => r.reportType?.includes("link") || r.reportType?.includes("play")).length}
            </span>
            <span className="text-[11px] text-slate-500">sự cố</span>
          </div>
        </div>

        {/* Subtitle / Audio Issues */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Lỗi Phụ Đề/Âm Thanh</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <SubtitlesIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {reports.filter((r) => r.reportType?.includes("sub") || r.reportType?.includes("audio")).length}
            </span>
            <span className="text-[11px] text-slate-500">phản hồi</span>
          </div>
        </div>

        {/* Total in Current Query */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tổng Phản Hồi</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <SparklesIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {meta.total.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">báo cáo</span>
          </div>
        </div>
      </div>

      {/* ── FILTER STATUS TABS & TOOLBAR ── */}
      <div className="flex flex-col gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-b border-white/[0.08] pb-2 overflow-x-auto no-scrollbar">
          {[
            { label: "Chờ xử lý", value: "pending", icon: ClockIcon },
            { label: "Đã sửa xong", value: "resolved", icon: CheckCircleIcon },
            { label: "Bỏ qua", value: "rejected", icon: XCircleIcon },
            { label: "Tất cả", value: "", icon: MessageCircleIcon },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = status === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <TabIcon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Issue Type Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-white/[0.08] bg-[#0d1017] p-3 sm:p-3.5">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên phim, tập hoặc người báo..."
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

          <div className="flex items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả loại lỗi</option>
              <option value="broken_link">Link hỏng</option>
              <option value="wrong_subtitle">Sai phụ đề</option>
              <option value="playback_error">Lỗi phát video</option>
              <option value="audio_issue">Lỗi âm thanh</option>
              <option value="other">Khác</option>
            </select>

            <button
              type="button"
              onClick={loadReports}
              disabled={loading}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition disabled:opacity-40 cursor-pointer"
              title="Tải lại danh sách"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── REPORTS CRM DATA TABLE ── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3.5">Phim & Tập Bị Lỗi</th>
                <th className="py-3 px-3.5">Loại Sự Cố</th>
                <th className="py-3 px-3.5">Mô Tả Từ Khán Giả</th>
                <th className="py-3 px-3.5">Người Báo & Thời Gian</th>
                <th className="py-3 px-3.5 text-center">Trạng Thái</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCwIcon className="h-6 w-6 animate-spin text-accent" />
                      <span>Đang tải danh sách báo cáo sự cố...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircleIcon className="h-8 w-8 text-emerald-400/40" />
                      <span className="font-semibold text-white/60">
                        Không có báo cáo sự cố nào phù hợp.
                      </span>
                      <p className="text-[11px] text-white/40">
                        Tuyệt vời! Hệ thống video đang hoạt động ổn định.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-white/[0.02] transition group"
                  >
                    {/* Movie, Episode, Server */}
                    <td className="py-3.5 px-4">
                      {report.movie ? (
                        <div>
                          <Link
                            href={`/admin/movies/${report.movie.id}`}
                            className="font-bold text-white hover:text-accent transition flex items-center gap-1.5 text-sm"
                          >
                            <span>{report.movie.name}</span>
                            <ExternalLinkIcon className="h-3 w-3 text-white/40 opacity-0 group-hover:opacity-100 transition" />
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {report.episode && (
                              <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                                Tập {report.episode.name}
                              </span>
                            )}
                            {report.server && (
                              <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-white/60 flex items-center gap-1">
                                <ServerIcon className="h-2.5 w-2.5" />
                                {report.server.serverName}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-white/40 italic">Phim đã bị xóa</span>
                      )}
                    </td>

                    {/* Issue Type */}
                    <td className="py-3.5 px-4">
                      {renderReportTypeBadge(report.reportType)}
                    </td>

                    {/* Description & Note */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {report.description ? (
                        <p className="text-white/80 italic text-xs line-clamp-2">
                          &ldquo;{report.description}&rdquo;
                        </p>
                      ) : (
                        <span className="text-white/30 text-[11px]">Không có ghi chú thêm</span>
                      )}
                      {report.adminNote && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <span className="font-bold">Ghi chú Admin:</span>
                          <span className="truncate">{report.adminNote}</span>
                        </div>
                      )}
                    </td>

                    {/* Reporter & Date */}
                    <td className="py-3.5 px-4 text-white/60">
                      <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                        <UserIcon className="h-3.5 w-3.5 text-white/40" />
                        <span>{report.user?.name ?? "Khách xem ẩn danh"}</span>
                      </div>
                      <div className="text-[10px] text-white/40 font-mono mt-0.5 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3 text-white/30" />
                        <span>{formatDateTime(report.createdAt)}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {renderStatusBadge(report.status)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-Click Resolved */}
                        {report.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateStatus(report.id, "resolved")}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
                            title="1-Click: Đánh dấu đã sửa xong"
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            <span>Đã sửa</span>
                          </button>
                        )}

                        {/* 1-Click Rejected */}
                        {report.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateStatus(report.id, "rejected")}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/60 hover:bg-white/10 hover:text-white transition cursor-pointer"
                            title="Bỏ qua báo cáo này"
                          >
                            Bỏ qua
                          </button>
                        )}

                        {/* Jump to Edit Movie */}
                        {report.movie && (
                          <Link
                            href={`/admin/movies/${report.movie.id}`}
                            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
                            title="Sửa link tập phim trong trang quản lý phim"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        {/* Drawer Detail Note */}
                        <button
                          type="button"
                          onClick={() => openReportDrawer(report)}
                          className="p-1.5 rounded-lg border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 transition cursor-pointer"
                          title="Xem chi tiết & Thêm ghi chú"
                        >
                          <MessageCircleIcon className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingReport(report)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition cursor-pointer"
                          title="Xóa báo cáo"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.lastPage > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 p-4 bg-white/[0.01]">
            <div className="text-xs text-white/50">
              Hiển thị trang <span className="font-bold text-white">{meta.currentPage}</span> /{" "}
              <span className="font-bold text-white">{meta.lastPage}</span> (Tổng{" "}
              <strong className="text-white">{meta.total.toLocaleString()}</strong> báo cáo)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={meta.currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30 cursor-pointer transition"
              >
                &larr; Trang trước
              </button>
              <button
                type="button"
                disabled={meta.currentPage >= meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30 cursor-pointer transition"
              >
                Trang sau &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── REPORT DETAIL & ADMIN NOTE SLIDE-OVER DRAWER ── */}
      {drawerOpen && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={closeReportDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#0f121b] border-l border-white/10 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                    <SparklesIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Chi Tiết Báo Cáo #{selectedReport.id}
                    </h2>
                    <p className="text-[11px] text-white/50">
                      {selectedReport.movie?.name ?? "Phim không xác định"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeReportDrawer}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <form onSubmit={handleSaveDrawer} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Summary Box */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Bộ phim</span>
                    <span className="font-bold text-white text-sm">
                      {selectedReport.movie?.name ?? "—"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-bold">Tập phim</span>
                      <span className="text-accent font-semibold">
                        {selectedReport.episode ? `Tập ${selectedReport.episode.name}` : "Toàn bộ phim"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-bold">Máy chủ phát</span>
                      <span className="text-white/80 font-mono">
                        {selectedReport.server?.serverName ?? "Mặc định"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Loại sự cố</span>
                    <div className="mt-1">{renderReportTypeBadge(selectedReport.reportType)}</div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Nội dung phản hồi</span>
                    <p className="mt-1 p-3 rounded-xl bg-white/5 border border-white/5 italic text-white/80 leading-relaxed">
                      &ldquo;{selectedReport.description || "Không có mô tả chi tiết."}&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-bold">Người gửi</span>
                      <span className="text-white/80">{selectedReport.user?.name ?? "Khách ẩn danh"}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-bold">Thời gian gửi</span>
                      <span className="text-white/60 font-mono">{formatDateTime(selectedReport.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Field: Change Status */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white">Trạng thái xử lý sự cố</label>
                  <select
                    value={drawerStatus}
                    onChange={(e) => setDrawerStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-[#12151f] px-3.5 py-2.5 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                  >
                    <option value="pending">Chờ xử lý (Pending)</option>
                    <option value="resolved">Đã sửa xong (Resolved)</option>
                    <option value="rejected">Bỏ qua / Từ chối (Rejected)</option>
                  </select>
                </div>

                {/* Field: Admin Note */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white flex items-center justify-between">
                    <span>Ghi chú nội bộ Admin</span>
                    <span className="text-[10px] text-white/40 font-normal">Chỉ ban quản trị nhìn thấy</span>
                  </label>
                  <textarea
                    rows={4}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="VD: Đã re-upload link m3u8 mới từ server dự phòng..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-accent focus:outline-none resize-none transition"
                  />
                </div>

                {/* Quick Link to Movie Edit */}
                {selectedReport.movie && (
                  <div className="pt-2">
                    <Link
                      href={`/admin/movies/${selectedReport.movie.id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-accent/30 bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      <span>Mở trang sửa phim & tập phim này</span>
                    </Link>
                  </div>
                )}

                {/* Drawer Footer Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeReportDrawer}
                    disabled={drawerSaving}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={drawerSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-accent/25 hover:bg-accent/90 disabled:opacity-50 transition cursor-pointer"
                  >
                    {drawerSaving && <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />}
                    <span>{drawerSaving ? "Đang lưu..." : "Lưu Thay Đổi"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE REPORT CONFIRMATION MODAL ── */}
      {deletingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f121b] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <TrashIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác Nhận Xóa Báo Cáo</h3>
                <p className="text-xs text-white/50">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <div className="text-xs text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
              Bạn có chắc chắn muốn xóa bản ghi báo cáo sự cố #{deletingReport.id} cho phim{" "}
              <strong className="text-white font-bold">&ldquo;{deletingReport.movie?.name ?? "N/A"}&rdquo;</strong>?
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReport(null)}
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
                <span>{deleting ? "Đang xóa..." : "Xóa Báo Cáo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
