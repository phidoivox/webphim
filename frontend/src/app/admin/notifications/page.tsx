"use client";

import React, { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BellIcon,
  CheckCircleIcon,
  MailIcon,
  RefreshCwIcon,
  SendIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import { broadcastAdminNotificationApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminNotificationsPage() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sendMail, setSendMail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleBroadcast = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const res = await broadcastAdminNotificationApi(
        {
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || null,
          send_mail: sendMail,
        },
        token
      );

      if (res && res.success) {
        toast.success(res.message || `Đã gửi thông báo thành công tới ${res.data.sentCount} người dùng!`);
        setTitle("");
        setMessage("");
        setLink("");
        setSendMail(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi thông báo.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setMessage("");
    setLink("");
    setSendMail(false);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* ── PAGE HEADER ── */}
      <AdminPageHeader
        title="Gửi Thông Báo Hệ Thống"
        description="Phát thông báo broadcast in-app và gửi email đồng thời đến toàn bộ người dùng"
      >
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting || (!title && !message && !link && !sendMail)}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40 cursor-pointer"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" />
          <span>Làm mới</span>
        </button>
      </AdminPageHeader>

      {/* ── KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Đối tượng nhận</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <UsersIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">Tất cả người dùng</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Kênh In-App</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <BellIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">Chuông thông báo</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Kênh Email</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <MailIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">Hàng đợi Queue</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: FORM + LIVE PREVIEW ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleOpenConfirm}
            className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-6"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="notif-title" className="block text-xs font-semibold text-slate-300">
                  Tiêu đề thông báo <span className="text-accent">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {title.length}/255
                </span>
              </div>
              <input
                id="notif-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Cập nhật tính năng xem phim 4K miễn phí"
                maxLength={255}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="notif-message" className="block text-xs font-semibold text-slate-300">
                  Nội dung chi tiết <span className="text-accent">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {message.length}/5000
                </span>
              </div>
              <textarea
                id="notif-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập nội dung thông báo gửi đến người dùng..."
                maxLength={5000}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none resize-y"
              />
            </div>

            <div>
              <label htmlFor="notif-link" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Đường dẫn liên kết (Tùy chọn)
              </label>
              <input
                id="notif-link"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Ví dụ: /phim/one-piece hoặc /lich-chieu"
                maxLength={500}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
              />
            </div>

            {/* Email Checkbox */}
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
              <input
                id="send-mail"
                type="checkbox"
                checked={sendMail}
                onChange={(e) => setSendMail(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-accent focus:ring-accent cursor-pointer"
              />
              <label htmlFor="send-mail" className="text-xs cursor-pointer">
                <span className="font-semibold text-white">Gửi email kèm theo</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Xếp hàng gửi email thông báo đồng thời đến tất cả người dùng trong hệ thống.
                </p>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <SendIcon className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Đang gửi broadcast..." : "Phát Thông Báo Ngay"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <SparklesIcon className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Xem Trước Trên Giao Diện Người Dùng
              </h2>
            </div>

            <div className="space-y-3">
              {/* Dropdown item preview */}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-accent">
                    <SparklesIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-white">
                        {title.trim() || "Tiêu đề thông báo mẫu"}
                      </p>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {message.trim() || "Nội dung thông báo sẽ xuất hiện tại đây khi người dùng mở chuông thông báo..."}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Vừa xong</span>
                      {link.trim() && (
                        <span className="font-medium text-accent">Xem chi tiết &rarr;</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email preview if enabled */}
              {sendMail && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-blue-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-blue-300">
                    <MailIcon className="h-3.5 w-3.5" />
                    <span>Mẫu Email Sẽ Gửi</span>
                  </div>
                  <p className="text-[11px] text-slate-300 pt-1">
                    <strong className="text-white">Tiêu đề:</strong> [WebPhim] {title.trim() || "..."}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-white">Nội dung:</strong> {message.trim() || "..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#12151f] p-5 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác Nhận Phát Thông Báo</h3>
                <p className="text-[11px] text-slate-400">Hành động này sẽ gửi broadcast đến toàn hệ thống</p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300 space-y-1.5">
              <p><strong className="text-white">Tiêu đề:</strong> {title}</p>
              <p><strong className="text-white">Kênh gửi:</strong> Chuông In-App {sendMail ? "+ Gửi Email" : ""}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleBroadcast}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 cursor-pointer"
              >
                Xác nhận gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
