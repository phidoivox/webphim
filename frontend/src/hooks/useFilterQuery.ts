"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Custom hook to update URL search parameters for filtering, sorting, and pagination
 * with React transitions and automatic page reset.
 */
export function useFilterQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value?: string | number | null) => {
      const params = new URLSearchParams(searchParams?.toString() || "");

      if (value !== undefined && value !== null && String(value).trim() !== "") {
        params.set(key, String(value).trim());
      } else {
        params.delete(key);
      }

      // Reset to page 1 whenever filters change (except when explicitly changing page)
      if (key !== "page") {
        params.delete("page");
      }

      const qs = params.toString();
      const targetUrl = `${pathname}${qs ? `?${qs}` : ""}`;

      startTransition(() => {
        router.push(targetUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const updateParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || "");

      let hasNonPageChange = false;
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          params.set(key, String(value).trim());
        } else {
          params.delete(key);
        }
        if (key !== "page") {
          hasNonPageChange = true;
        }
      });

      if (hasNonPageChange) {
        params.delete("page");
      }

      const qs = params.toString();
      const targetUrl = `${pathname}${qs ? `?${qs}` : ""}`;

      startTransition(() => {
        router.push(targetUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const clearAllParams = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return {
    searchParams,
    isPending,
    updateParam,
    updateParams,
    clearAllParams,
  };
}
