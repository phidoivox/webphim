"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-10">
      <p className="text-sm text-muted">{error.message || "Lỗi tải dữ liệu."}</p>
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover cursor-pointer"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="rounded-lg bg-surface px-5 py-2.5 text-sm font-bold text-gray-300 transition-colors hover:bg-surface/80"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
