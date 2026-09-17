"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AlertTriangleIcon, FlagIcon, LoaderIcon } from "@/components/ui/icons";
import { sendEpisodeReportApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { ReportType } from "@/types/report";
import { toast } from "sonner";

interface ReportEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieName: string;
  episodeName: string;
  episodeId: number;
  serverName?: string;
  serverId?: number | null;
}

const REPORT_OPTIONS: { type: ReportType; label: string; icon: string; desc: string }[] = [
  {
    type: "broken_link",
    label: "Không xem được",
    icon: "🚫",
    desc: "Màn hình đen, link hỏng hoặc không thể tải video",
  },
  {
    type: "no_sound",
    label: "Lỗi âm thanh",
    icon: "🔇",
    desc: "Mất tiếng, âm thanh bị rè hoặc không khớp hình",
  },
  {
    type: "wrong_episode",
    label: "Sai tập / Trùng tập",
    icon: "🔄",
    desc: "Nội dung video không đúng với số tập đã chọn",
  },
  {
    type: "lag",
    label: "Giật lag / Tải chậm",
    icon: "⏳",
    desc: "Video dừng liên tục hoặc xoay vòng tải lâu",
  },
  {
    type: "sub_error",
    label: "Lỗi phụ đề / Thuyết minh",
    icon: "💬",
    desc: "Phụ đề lệch thời gian, sai ngữ pháp hoặc mất sub",
  },
  {
    type: "other",
    label: "Vấn đề khác",
    icon: "⚠️",
    desc: "Chất lượng hình ảnh mờ, quảng cáo che màn hình...",
  },
];

export default function ReportEpisodeModal({
  isOpen,
  onClose,
  movieName,
  episodeName,
  episodeId,
  serverName,
  serverId,
}: ReportEpisodeModalProps) {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>("broken_link");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Đóng modal khi ấn Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    },
    [isOpen, isSubmitting, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await sendEpisodeReportApi(
        {
          episode_id: episodeId,
          server_id: serverId ?? null,
          report_type: selectedType,
          description: description.trim() || undefined,
        },
        token
      );

      toast.success(res.message || "Báo cáo lỗi đã được gửi thành công!");
      setDescription("");
      setSelectedType("broken_link");
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại!";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#12131b] p-6 shadow-2xl transition-all sm:p-7"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <FlagIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                Báo cáo sự cố video
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {movieName} • <span className="text-white font-medium">{episodeName}</span>
                {serverName ? ` (${serverName})` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Lựa chọn loại lỗi */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5">
              Bạn đang gặp vấn đề gì?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REPORT_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/15 text-white shadow-sm ring-1 ring-amber-500/40"
                        : "border-white/5 bg-white/[0.03] text-gray-300 hover:bg-white/[0.07] hover:border-white/15"
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{opt.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-snug">{opt.label}</div>
                      <div className="text-[11px] text-muted line-clamp-1 mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chi tiết bổ sung */}
          <div>
            <label htmlFor="report-desc" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Mô tả chi tiết (không bắt buộc)
            </label>
            <textarea
              id="report-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder="VD: Đoạn từ phút 15:20 bị đứng hình, hoặc phim bị chèn quảng cáo..."
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
            />
            <div className="mt-1 flex justify-end text-[11px] text-muted">
              {description.length}/1000 ký tự
            </div>
          </div>

          {/* Alert note */}
          <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-[11px] text-muted">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Quản trị viên sẽ kiểm tra và khắc phục lỗi sớm nhất có thể. Bạn cũng có thể thử đổi sang máy chủ khác trong danh sách tập bên dưới.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-black transition cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? (
                <>
                  <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <FlagIcon className="h-3.5 w-3.5 fill-current" />
                  <span>Gửi báo cáo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
