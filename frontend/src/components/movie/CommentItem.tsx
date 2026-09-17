"use client";

import React, { useState } from "react";
import {
  AlertTriangleIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  HeartIcon,
  MessageCircleIcon,
  PinIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import { formatTimeAgo } from "@/lib/date";
import type {
  CommentItem as CommentItemType,
  PostCommentPayload,
  UpdateCommentPayload,
} from "@/types/comment";
import CommentForm from "./comments/CommentForm";

interface CommentItemProps {
  comment: CommentItemType;
  onLike: (commentId: number) => Promise<unknown>;
  onReply: (payload: PostCommentPayload) => Promise<unknown>;
  onEdit: (commentId: number, payload: UpdateCommentPayload) => Promise<unknown>;
  onDelete: (commentId: number, parentId?: number | null) => Promise<unknown>;
  isReply?: boolean;
}

export default function CommentItem({
  comment,
  onLike,
  onReply,
  onEdit,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const { user } = useAuth();

  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(!comment.isSpoiler);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isAuthor = user?.id === comment.author.id;
  const isAdmin = user?.role === "admin";
  const canModify = isAuthor || isAdmin;

  const handleLike = () => {
    void onLike(comment.id);
  };


  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(comment.id, comment.parentId);
    } catch {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || isSavingEdit) return;

    setIsSavingEdit(true);
    setEditError(null);

    try {
      await onEdit(comment.id, { content: trimmed });
      setIsEditing(false);
    } catch (err: unknown) {
      setEditError((err as Error).message || "Lỗi khi lưu chỉnh sửa.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const authorInitials = comment.author.name
    ? comment.author.name.slice(0, 2).toUpperCase()
    : "U";

  return (
    <div
      className={`group relative transition-all duration-200 ${
        comment.isPinned ? "rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-4.5" : ""
      }`}
    >
      {/* Pinned Badge */}
      {comment.isPinned && (
        <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <PinIcon className="h-3.5 w-3.5 fill-current" />
          <span>Đã ghim bởi Quản trị viên</span>
        </div>
      )}

      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Author Avatar */}
        <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center font-bold text-xs text-white shadow-md">
          {comment.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="bg-gradient-to-tr from-accent to-amber-500 flex h-full w-full items-center justify-center">
              {authorInitials}
            </span>
          )}
        </div>

        {/* Comment Body */}
        <div className="min-w-0 flex-1">
          {/* Author Header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">
              {comment.author.name}
            </span>

            {/* Role Badge */}
            {comment.author.role === "admin" && (
              <span className="rounded-md bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.2 text-[10px] font-black uppercase text-rose-300">
                Admin
              </span>
            )}
            {comment.author.role === "vip" && (
              <span className="rounded-md bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-black uppercase text-amber-300">
                VIP
              </span>
            )}

            {/* Time ago */}
            <span className="text-xs text-slate-500">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Comment Content or Edit Mode */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-white/20 bg-black/40 p-3 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
              />
              {editError && <p className="text-xs text-rose-400">{editError}</p>}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={isSavingEdit}
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || isSavingEdit}
                  className="inline-flex items-center gap-1 rounded-lg bg-accent hover:bg-accent-hover px-3.5 py-1 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  ) : (
                    <CheckIcon className="h-3.5 w-3.5" />
                  )}
                  <span>Lưu</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1.5">
              {comment.isSpoiler && !isSpoilerRevealed ? (
                /* Spoiler Protected Card */
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3.5 space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>Bình luận này có tiết lộ nội dung phim (Spoiler)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSpoilerRevealed(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    <span>Bấm để xem nội dung</span>
                  </button>
                </div>
              ) : (
                /* Revealed Content */
                <div className="relative">
                  <p className="text-sm leading-relaxed text-slate-300 break-words whitespace-pre-line">
                    {comment.content}
                  </p>
                  {comment.isSpoiler && (
                    <button
                      type="button"
                      onClick={() => setIsSpoilerRevealed(false)}
                      className="mt-1 text-[11px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <EyeOffIcon className="h-3 w-3" />
                      <span>Ẩn lại spoiler</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          {!isEditing && (
            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-all transform active:scale-90 cursor-pointer ${
                  comment.isLiked
                    ? "text-rose-500 font-bold"
                    : "text-slate-400 hover:text-rose-400"
                }`}
                title={comment.isLiked ? "Bỏ thích" : "Thích"}
              >
                <HeartIcon
                  className={`h-4 w-4 transition-transform ${
                    comment.isLiked ? "fill-rose-500 scale-110" : ""
                  }`}
                />
                <span className="tabular-nums">
                  {comment.likesCount > 0 ? comment.likesCount : "Thích"}
                </span>
              </button>


              {/* Reply Button (Only for root comments) */}
              {!isReply && (
                <button
                  type="button"
                  onClick={() => setIsReplying((v) => !v)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-accent transition cursor-pointer"
                >
                  <MessageCircleIcon className="h-3.5 w-3.5" />
                  <span>
                    {isReplying ? "Đóng phản hồi" : "Trả lời"}
                  </span>
                </button>
              )}

              {/* Edit Button (Author / Admin) */}
              {canModify && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(comment.content);
                  }}
                  className="hover:text-white transition cursor-pointer"
                >
                  Sửa
                </button>
              )}

              {/* Delete Button (Author / Admin) */}
              {canModify && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
                >
                  <TrashIcon className="h-3 w-3" />
                  <span>{isDeleting ? "Đang xóa..." : "Xóa"}</span>
                </button>
              )}
            </div>
          )}

          {/* Inline Reply Form */}
          {isReplying && (
            <div className="mt-3.5 pt-2">
              <CommentForm
                onSubmit={async (payload) => {
                  await onReply(payload);
                  setIsReplying(false);
                }}
                parentId={comment.id}
                placeholder={`Trả lời @${comment.author.name}...`}
                autoFocus
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3.5 border-l-2 border-white/10 pl-3.5 sm:pl-5">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={onLike}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
