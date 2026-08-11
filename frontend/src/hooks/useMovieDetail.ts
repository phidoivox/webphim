"use client";

import { useCallback, useEffect, useState } from "react";
import { getMovieDetail } from "@/lib/api";
import type { MovieDetail } from "@/types/movie";

/** Fetch chi tiết phim — setState chỉ trong callback async (luật react-hooks/set-state-in-effect). */
export function useMovieDetail(slug: string) {
  const [data, setData] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    getMovieDetail(slug)
      .then((detail) => {
        if (!mounted) return;
        setData(detail);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error("Đã có lỗi xảy ra"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [slug, requestKey]);

  // Gọi từ nút "Thử lại" (event handler) — được phép setState đồng bộ
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequestKey((k) => k + 1);
  }, []);

  return { data, loading, error, retry };
}
