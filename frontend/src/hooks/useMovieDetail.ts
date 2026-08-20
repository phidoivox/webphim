"use client";

import { useQuery } from "@tanstack/react-query";
import { getMovieDetail } from "@/lib/api";
import type { MovieDetail } from "@/types/movie";

/**
 * Fetch chi tiết phim với TanStack React Query:
 * - Tự động cache RAM chống fetch lặp
 * - Hỗ trợ refetch mượt mà khi retry
 */
export function useMovieDetail(slug: string) {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<MovieDetail, Error>({
    queryKey: ["movie", slug],
    queryFn: () => getMovieDetail(slug),
    enabled: Boolean(slug),
    staleTime: 60 * 1000, // 1 phút
  });

  return {
    data: data ?? null,
    loading,
    error: error ?? null,
    retry: () => void refetch(),
  };
}
