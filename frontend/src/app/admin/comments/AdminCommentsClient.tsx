"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  bulkAdminCommentsApi,
  deleteAdminCommentApi,
  getAdminCommentsApi,
  toggleAdminCommentPinApi,
  updateAdminCommentStatusApi,
} from "@/lib/api";
import { formatTimeAgo } from "@/lib/date";
import type { CommentItem } from "@/types/comment";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  ClockIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  HeartIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  PinIcon,
  RefreshCwIcon,
  SearchIcon,
  SquareIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
  XIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminCommentsClient() {
  const { token } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [spoilerFilter, setSpoilerFilter] = useState<string>("");
  const [pinnedFilter, setPinnedFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Selected for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);

  // Delete modal
  const [deletingComment, setDeletingComment] = useState<CommentItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    if (type === "error") toast.error(text);
    else toast.success(text);
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await getAdminCommentsApi(
        {
          status: statusFilter || undefined,
          is_spoiler: spoilerFilter !== "" ? spoilerFilter : undefined,
          is_pinned: pinnedFilter !== "" ? pinnedFilter : undefined,
          q: search.trim() || undefined,
          page: String(page),
          per_page: 20,
        },
        token
      );
      setComments(res.data || []);
      setMeta(res.meta || { currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
      setSelectedIds([]);
    } catch (err: any) {
      showToast(err?.message || "Không thể tải danh sách bình luận.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [statusFilter, spoilerFilter, pinnedFilter, page, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadComments();
  };

  // 1-Click Update Status
  const handleQuickStatus = async (commentId: number, nextStatus: "active" | "hidden" | "spam") => {
    try {
      await updateAdminCommentStatusApi(commentId, nextStatus, token);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status: nextStatus } : c))
      );
      showToast(
        nextStatus === "active"
          ? "Đã duyệt hiển thị bình luận."
          : nextStatus === "hidden"
          ? "Đã ẩn bình luận."
          : "Đã đánh dấu là SPAM."
      );
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi cập nhật trạng thái.", "error");
    }
  };

  // 1-Click Toggle Pin
  const handleTogglePin = async (commentId: number) => {
    try {
      const res = await toggleAdminCommentPinApi(commentId, token);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, isPinned: res.data.isPinned } : c))
      );
      showToast(
        res.data.isPinned ? "Đã ghim bình luận lên đầu phim." : "Đã bỏ ghim bình luận."
      );
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi ghim bình luận.", "error");
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deletingComment) return;
    try {
      setDeleting(true);
      await deleteAdminCommentApi(deletingComment.id, true, token);
      setComments((prev) => prev.filter((c) => c.id !== deletingComment.id));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      showToast("Đã xóa bình luận thành công.");
      setDeletingComment(null);
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi xóa bình luận.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: "activate" | "hide" | "spam" | "delete") => {
    if (selectedIds.length === 0) return;

    if (action === "delete" && !window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} bình luận đã chọn?`)) {
      return;
    }

    try {
      setBulkLoading(true);
      const res = await bulkAdminCommentsApi({ action, ids: selectedIds }, token || "");
      showToast(`Đã xử lý ${res.affected} bình luận thành công.`);
      loadComments();
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi thực hiện thao tác hàng loạt.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === comments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(comments.map((c) => c.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Status Badge Helper
  const renderStatusBadge = (st: string) => {
    switch (st) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircleIcon className="h-3 w-3" />
            Đang hiển thị
          </span>
        );
      case "hidden":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            <EyeOffIcon className="h-3 w-3" />
            Bị ẩn
          </span>
        );
      case "spam":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
            <XCircleIcon className="h-3 w-3" />
            Spam
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            {st}
          </span>
        );
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* ── PAGE HEADER ── */}
      <AdminPageHeader
        title="Quản Lý & Kiểm Duyệt Bình Luận"
        description="Kiểm duyệt thảo luận, xử lý bình luận chứa spoiler, spam hoặc nội dung không phù hợp"
      >
        <button
          type="button"
          onClick={loadComments}
          disabled={loading}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
          <span>Làm mới</span>
        </button>
      </AdminPageHeader>

      {/* ── STATUS TABS ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1 border-b border-white/[0.08] pb-2 overflow-x-auto no-scrollbar">
          {[
            { label: "Tất cả", value: "", icon: MessageSquareIcon },
            { label: "Đang hiển thị", value: "active", icon: CheckCircleIcon },
            { label: "Bị ẩn", value: "hidden", icon: EyeOffIcon },
            { label: "Spam", value: "spam", icon: XCircleIcon },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
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

        {/* ── SEARCH & FILTER TOOLBAR ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-white/[0.08] bg-[#0d1017] p-3 sm:p-3.5">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo nội dung, tên phim hoặc người gửi..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </form>

          {/* Secondary Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Spoiler Filter */}
            <select
              value={spoilerFilter}
              onChange={(e) => {
                setSpoilerFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả nội dung</option>
              <option value="1">Chỉ Spoiler</option>
              <option value="0">Không có Spoiler</option>
            </select>

            {/* Pinned Filter */}
            <select
              value={pinnedFilter}
              onChange={(e) => {
                setPinnedFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả ghim</option>
              <option value="1">Đã ghim</option>
              <option value="0">Chưa ghim</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <span className="text-xs font-bold text-white">
            Đã chọn <span className="text-accent">{selectedIds.length}</span> bình luận
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction("activate")}
              disabled={bulkLoading}
              className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer"
            >
              Duyệt hiển thị
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction("hide")}
              disabled={bulkLoading}
              className="rounded-lg bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-white/20 transition cursor-pointer"
            >
              Ẩn bình luận
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction("spam")}
              disabled={bulkLoading}
              className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition cursor-pointer"
            >
              Đánh dấu Spam
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction("delete")}
              disabled={bulkLoading}
              className="rounded-lg bg-red-600/30 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-600/40 transition cursor-pointer"
            >
              Xóa
            </button>
          </div>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {selectedIds.length > 0 && selectedIds.length === comments.length ? (
                      <CheckSquareIcon className="h-4 w-4 text-accent" />
                    ) : (
                      <SquareIcon className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3.5">Phim</th>
                <th className="py-3 px-3.5">Người Gửi</th>
                <th className="py-3 px-3.5">Nội Dung Bình Luận</th>
                <th className="py-3 px-3.5 text-center">Tương Tác</th>
                <th className="py-3 px-3.5 text-center">Trạng Thái</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCwIcon className="h-6 w-6 animate-spin text-accent" />
                      <span>Đang tải danh sách bình luận...</span>
                    </div>
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <MessageSquareIcon className="h-8 w-8 text-white/20" />
                      <span className="font-semibold text-white/60">Không tìm thấy bình luận nào.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                comments.map((comment) => {
                  const isSelected = selectedIds.includes(comment.id);
                  return (
                    <tr
                      key={comment.id}
                      className={`hover:bg-white/[0.02] transition group ${
                        isSelected ? "bg-accent/[0.05]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(comment.id)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquareIcon className="h-4 w-4 text-accent" />
                          ) : (
                            <SquareIcon className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Movie Info */}
                      <td className="py-3.5 px-3.5 max-w-[180px]">
                        {comment.movie ? (
                          <div className="flex items-center gap-2.5">
                            {comment.movie.posterUrl && (
                              <div className="relative h-11 w-8 rounded overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                                <Image
                                  src={comment.movie.posterUrl}
                                  alt={comment.movie.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link
                                href={`/phim/${comment.movie.slug}`}
                                target="_blank"
                                className="font-bold text-white hover:text-accent transition line-clamp-1 flex items-center gap-1"
                              >
                                <span>{comment.movie.name}</span>
                                <ExternalLinkIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Phim đã bị xóa</span>
                        )}
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-3.5 max-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-[10px] text-white shrink-0 border border-white/10">
                            {comment.author.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={comment.author.avatarUrl}
                                alt={comment.author.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{comment.author.name?.slice(0, 2).toUpperCase() || "U"}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{comment.author.name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="py-3.5 px-3.5 max-w-sm">
                        <div className="space-y-1">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {comment.isPinned && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                                <PinIcon className="h-3 w-3" />
                                Đã ghim
                              </span>
                            )}
                            {comment.isSpoiler && (
                              <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.2 text-[10px] font-bold text-rose-300">
                                <AlertTriangleIcon className="h-3 w-3" />
                                Spoiler
                              </span>
                            )}
                            {comment.parentId && (
                              <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                                Phản hồi #{comment.parentId}
                              </span>
                            )}
                          </div>

                          {/* Text */}
                          <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed break-words">
                            {comment.content}
                          </p>
                        </div>
                      </td>

                      {/* Interaction Counts */}
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-3 text-slate-400 text-xs">
                          <span className="flex items-center gap-1" title="Lượt thích">
                            <HeartIcon className="h-3.5 w-3.5 text-rose-500" />
                            <span>{comment.likesCount}</span>
                          </span>
                          <span className="flex items-center gap-1" title="Câu trả lời">
                            <MessageCircleIcon className="h-3.5 w-3.5 text-accent" />
                            <span>{comment.repliesCount}</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5 text-center">
                        {renderStatusBadge(comment.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Pin */}
                          <button
                            type="button"
                            onClick={() => handleTogglePin(comment.id)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              comment.isPinned
                                ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                            }`}
                            title={comment.isPinned ? "Bỏ ghim" : "Ghim lên đầu phim"}
                          >
                            <PinIcon className="h-3.5 w-3.5" />
                          </button>

                          {/* Quick Active */}
                          {comment.status !== "active" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(comment.id, "active")}
                              className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
                              title="Duyệt hiển thị"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Quick Hide */}
                          {comment.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(comment.id, "hidden")}
                              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                              title="Ẩn bình luận"
                            >
                              <EyeOffIcon className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Quick Spam */}
                          {comment.status !== "spam" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(comment.id, "spam")}
                              className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Đánh dấu Spam"
                            >
                              <XCircleIcon className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletingComment(comment)}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                            title="Xóa bình luận"
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

        {/* ── PAGINATION ── */}
        {meta.lastPage > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 p-4 bg-white/[0.01]">
            <div className="text-xs text-slate-400">
              Trang <span className="font-bold text-white">{meta.currentPage}</span> /{" "}
              <span className="font-bold text-white">{meta.lastPage}</span> (Tổng{" "}
              <strong className="text-white">{meta.total.toLocaleString()}</strong> bình luận)
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

      {/* ── DELETE MODAL ── */}
      {deletingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121520] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Xác nhận xóa bình luận</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa bình luận của{" "}
              <strong className="text-white">{deletingComment.author.name}</strong> không?
            </p>
            <div className="rounded-xl border border-white/5 bg-black/40 p-3 text-xs text-slate-400 italic">
              &ldquo;{deletingComment.content}&rdquo;
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingComment(null)}
                disabled={deleting}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
