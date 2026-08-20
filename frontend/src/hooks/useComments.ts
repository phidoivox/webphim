"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  deleteCommentApi,
  getMovieCommentsApi,
  postCommentApi,
  toggleCommentLikeApi,
  updateCommentApi,
} from "@/lib/api";
import type {
  CommentItem,
  PostCommentPayload,
  UpdateCommentPayload,
} from "@/types/comment";
import { toast } from "sonner";

export function useComments(movieIdOrSlug: string | number) {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  const queryKey = useMemo(
    () => ["comments", String(movieIdOrSlug), sortBy, token ?? "guest"],
    [movieIdOrSlug, sortBy, token]
  );

  // 1. Fetch comments with Infinite Query (Automatic RAM Caching & Pagination)
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error: queryError,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getMovieCommentsApi(
        movieIdOrSlug,
        {
          sort: sortBy,
          page: pageParam,
          per_page: 15,
        },
        token
      );
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasMore) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 30 * 1000, // 30s cache
  });

  // Flatten comments list from all loaded pages
  const comments = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const totalComments = data?.pages[0]?.meta.total ?? 0;

  // 2. Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async (payload: PostCommentPayload) => {
      if (!isAuthenticated || !token) {
        throw new Error("Vui lòng đăng nhập để bình luận.");
      }
      const res = await postCommentApi(movieIdOrSlug, payload, token);
      return res.data;
    },
    onSuccess: (newComment, payload) => {
      toast.success(payload.parent_id ? "Đã gửi câu trả lời!" : "Đã gửi bình luận!");
      void queryClient.invalidateQueries({ queryKey: ["comments", String(movieIdOrSlug)] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể gửi bình luận.");
    },
  });

  // 3. Edit Comment Mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      payload,
    }: {
      commentId: number;
      payload: UpdateCommentPayload;
    }) => {
      if (!isAuthenticated || !token) {
        throw new Error("Vui lòng đăng nhập.");
      }
      const res = await updateCommentApi(commentId, payload, token);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật bình luận!");
      void queryClient.invalidateQueries({ queryKey: ["comments", String(movieIdOrSlug)] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể cập nhật bình luận.");
    },
  });

  // 4. Remove Comment Mutation
  const removeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      if (!isAuthenticated || !token) {
        throw new Error("Vui lòng đăng nhập.");
      }
      await deleteCommentApi(commentId, token);
      return commentId;
    },
    onSuccess: () => {
      toast.success("Đã xóa bình luận!");
      void queryClient.invalidateQueries({ queryKey: ["comments", String(movieIdOrSlug)] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể xóa bình luận.");
    },
  });

  // 5. Toggle Like Mutation with Optimistic Updates
  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: number) => {
      if (!isAuthenticated || !token) {
        throw new Error("Vui lòng đăng nhập để thích bình luận.");
      }
      const res = await toggleCommentLikeApi(commentId, token);
      return { commentId, ...res.data };
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((c: CommentItem) => {
              if (c.id === commentId) {
                const nextLiked = !c.isLiked;
                return {
                  ...c,
                  isLiked: nextLiked,
                  likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
                };
              }
              if (c.replies) {
                return {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === commentId
                      ? {
                          ...r,
                          isLiked: !r.isLiked,
                          likesCount: !r.isLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
                        }
                      : r
                  ),
                };
              }
              return c;
            }),
          })),
        };
      });

      return { previousData };
    },
    onError: (_err, _commentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const loadMore = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage) return;
    await fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const addComment = useCallback(
    async (payload: PostCommentPayload): Promise<CommentItem> => {
      return await addCommentMutation.mutateAsync(payload);
    },
    [addCommentMutation]
  );

  const editComment = useCallback(
    async (commentId: number, payload: UpdateCommentPayload): Promise<CommentItem> => {
      return await editCommentMutation.mutateAsync({ commentId, payload });
    },
    [editCommentMutation]
  );

  const removeComment = useCallback(
    async (commentId: number, _parentId?: number | null) => {
      await removeCommentMutation.mutateAsync(commentId);
    },
    [removeCommentMutation]
  );

  const toggleLike = useCallback(
    async (commentId: number) => {
      await toggleLikeMutation.mutateAsync(commentId);
    },
    [toggleLikeMutation]
  );

  return {
    comments,
    totalComments,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    isSubmitting: addCommentMutation.isPending,
    sortBy,
    setSortBy,
    hasMore: Boolean(hasNextPage),
    error: queryError ? (queryError as Error).message : null,
    fetchComments: () => refetch(),
    loadMore,
    addComment,
    editComment,
    removeComment,
    toggleLike,
  };
}
