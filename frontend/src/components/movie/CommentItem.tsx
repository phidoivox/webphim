"use client";

import { useState } from "react";
import { ThumbsUpIcon } from "@/components/ui/icons";

export interface MockComment {
  id: number;
  author: string;
  avatarUrl: string;
  time: string;
  content: string;
  likes: number;
}

export default function CommentItem({ comment }: { comment: MockComment }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="flex gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={comment.avatarUrl} alt={comment.author} className="h-9 w-9 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink">{comment.author}</span>
          <span className="text-xs text-faint">{comment.time}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{comment.content}</p>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className={`mt-1.5 flex items-center gap-1 text-xs transition-colors ${liked ? "text-accent" : "text-faint hover:text-accent"}`}
        >
          <ThumbsUpIcon className="h-3.5 w-3.5" />
          {comment.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </div>
  );
}
