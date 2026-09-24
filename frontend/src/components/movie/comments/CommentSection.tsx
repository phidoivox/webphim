"use client";

import React from "react";
import { MessageCircleIcon, SparklesIcon } from "@/components/ui/icons";
import { useComments } from "@/hooks/useComments";
import CommentItem from "@/components/movie/CommentItem";
import CommentForm from "@/components/movie/comments/CommentForm";

interface CommentSectionProps {
  movieId: number;
}

export default function CommentSection({ movieId }: CommentSectionProps) {
  const {
    comments,
    totalComments,
    isLoading,
    isLoadingMore,
    sortBy,
    setSortBy,
    hasMore,
    loadMore,
    addComment,
    editComment,
    removeComment,
    toggleLike,
  } = useComments(movieId);

  return (
    <section id="comments-section" className="pt-8 border-t border-white/10 space-y-6">
      {/* ── Section Header: Title & Sort Options ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <MessageCircleIcon className="h-5 w-5 text-accent" />
          <span>Bình luận</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-slate-300 tabular-nums">
            {totalComments}
          </span>
        </h2>

        {/* Sort Switcher */}
        <div className="flex items-center rounded-xl bg-[#141622] p-1 border border-white/5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSortBy("latest")}
            className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              sortBy === "latest"
                ? "bg-accent text-white font-bold shadow-md shadow-accent/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mới nhất
          </button>
          <button
            type="button"
            onClick={() => setSortBy("popular")}
            className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              sortBy === "popular"
                ? "bg-accent text-white font-bold shadow-md shadow-accent/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Phổ biến
          </button>
        </div>
      </div>

      {/* ── Root Comment Input Form ── */}
      <CommentForm onSubmit={addComment} />

      {/* ── Comments List ── */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          /* Enhanced Skeleton Loader */
          <div className="space-y-5 select-none">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3.5 animate-shimmer rounded-2xl bg-surface/40 p-3.5 border border-white/5">
                <div className="h-10 w-10 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-28 rounded-md bg-white/15 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-full max-w-lg rounded bg-white/10" />
                    <div className="h-3.5 w-3/4 rounded bg-white/10" />
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="h-4 w-12 rounded bg-white/5" />
                    <div className="h-4 w-14 rounded bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          /* Comments List Items */
          <div className="space-y-5">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={toggleLike}
                onReply={addComment}
                onEdit={editComment}
                onDelete={removeComment}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-white/5 bg-[#141622]/50 p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
              <SparklesIcon className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Chưa có bình luận nào</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Hãy là người đầu tiên chia sẻ cảm nghĩ, góc nhìn hoặc đánh giá của bạn về bộ phim này!
              </p>
            </div>
          </div>
        )}

        {/* ── Load More Button ── */}
        {!isLoading && hasMore && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-2.5 text-xs font-bold text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang tải thêm...</span>
                </>
              ) : (
                <span>Xem thêm bình luận</span>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
