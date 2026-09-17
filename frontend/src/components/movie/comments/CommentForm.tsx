"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { commentSchema, type CommentInput } from "@/schemas/comment";
import { AlertTriangleIcon, LoginIcon, SendIcon, UserIcon } from "@/components/ui/icons";
import { setFormApiErrors } from "@/lib/form-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  onSubmit: (payload: { content: string; is_spoiler: boolean; parent_id?: number | null }) => Promise<unknown>;
  parentId?: number | null;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}

function CommentSubmitSection({
  control,
  isSubmitting,
  onCancel,
  parentId,
}: {
  control: Control<CommentInput>;
  isSubmitting: boolean;
  onCancel?: () => void;
  parentId?: number | null;
}) {
  const content = useWatch({ control, name: "content", defaultValue: "" }) || "";

  return (
    <div className="flex items-center gap-2 ml-auto">
      <span className="text-[11px] text-slate-500 mr-2 tabular-nums">
        {content.length}/2000
      </span>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
        >
          Hủy
        </button>
      )}

      <button
        type="submit"
        disabled={!content.trim() || isSubmitting}
        className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-accent/20 cursor-pointer"
      >
        {isSubmitting ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <SendIcon className="h-3.5 w-3.5" />
        )}
        <span>{parentId ? "Trả lời" : "Gửi bình luận"}</span>
      </button>
    </div>
  );
}

export default function CommentForm({
  onSubmit,
  parentId = null,
  placeholder = "Chia sẻ cảm nghĩ của bạn về bộ phim này...",
  autoFocus = false,
  onCancel,
}: CommentFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
      is_spoiler: false,
      parent_id: parentId,
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#141622]/80 backdrop-blur-md p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5 text-slate-300 text-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">Bạn muốn tham gia thảo luận?</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Đăng nhập tài khoản để gửi bình luận và tương tác cùng cộng đồng.
            </p>
          </div>
        </div>
        <Link
          href="/dang-nhap"
          className="inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 py-2.5 text-xs font-bold text-white transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-accent/25 shrink-0"
        >
          <LoginIcon className="h-4 w-4" />
          <span>Đăng nhập ngay</span>
        </Link>
      </div>
    );
  }

  const handleFormSubmit = async (data: CommentInput) => {
    setGeneralError(null);

    try {
      await onSubmit({
        content: data.content.trim(),
        is_spoiler: data.is_spoiler,
        parent_id: parentId,
      });
      reset({
        content: "",
        is_spoiler: false,
        parent_id: parentId,
      });
      toast.success(parentId ? "Đã gửi câu trả lời!" : "Đã gửi bình luận!");
      if (onCancel) onCancel();
    } catch (err: unknown) {
      const msg = setFormApiErrors(
        err,
        setError,
        setGeneralError,
        "Đã xảy ra lỗi khi gửi bình luận."
      );
      toast.error(msg);
    }
  };

  const errorMessage = errors.content?.message || generalError;

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn(
        "rounded-2xl border border-white/10 bg-[#141622] p-4 transition-all duration-200 focus-within:border-accent/50 focus-within:shadow-[0_0_20px_rgba(255,92,26,0.15)]",
        parentId && "bg-[#10121c] border-white/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span>{user?.name?.slice(0, 2).toUpperCase() || "U"}</span>
          )}
        </div>

        {/* Text Area */}
        <div className="min-w-0 flex-1">
          <textarea
            {...register("content")}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={parentId ? 2 : 3}
            maxLength={2000}
            className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none leading-relaxed"
          />

          {errorMessage && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{errorMessage}</p>
          )}

          {/* Form Controls Footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
            {/* Spoiler Checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("is_spoiler")}
                className="h-4 w-4 rounded border-white/20 bg-black/40 text-accent focus:ring-0 focus:ring-offset-0 transition cursor-pointer accent-accent"
              />
              <span className="flex items-center gap-1">
                <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-400" />
                <span>Chứa nội dung tiết lộ (Spoiler)</span>
              </span>
            </label>

            {/* Action Buttons */}
            <CommentSubmitSection
              control={control}
              isSubmitting={isSubmitting}
              onCancel={onCancel}
              parentId={parentId}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

