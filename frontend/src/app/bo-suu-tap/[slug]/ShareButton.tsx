"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopyIcon, ShareIcon } from "@/components/ui/icons";

export default function ShareButton({ slug, name }: { slug: string; name: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = () => `${window.location.origin}/bo-suu-tap/${slug}`;

  const handleShare = async () => {
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // Người dùng hủy share — bỏ qua
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Đã copy link chia sẻ!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không copy được link.");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white transition hover:bg-accent/90 cursor-pointer"
    >
      {copied ? <CopyIcon className="h-3.5 w-3.5" /> : <ShareIcon className="h-3.5 w-3.5" />}
      {copied ? "Đã copy!" : "Chia sẻ"}
    </button>
  );
}
