export interface CommentAuthor {
  id: number;
  name: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface CommentItem {
  id: number;
  movieId: number;
  parentId?: number | null;
  content: string;
  likesCount: number;
  repliesCount: number;
  isPinned: boolean;
  isSpoiler: boolean;
  status: "active" | "hidden" | "spam";
  isLiked: boolean;
  author: CommentAuthor;
  movie?: {
    id: number;
    name: string;
    slug: string;
    posterUrl?: string;
  };
  replies?: CommentItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface CommentPaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  hasMore: boolean;
}

export interface CommentListResponse {
  status: string;
  data: CommentItem[];
  meta: CommentPaginationMeta;
}

export interface PostCommentPayload {
  content: string;
  is_spoiler?: boolean;
  parent_id?: number | null;
}

export interface UpdateCommentPayload {
  content?: string;
  is_spoiler?: boolean;
}

export interface ToggleCommentLikeResponse {
  status: string;
  message: string;
  data: {
    isLiked: boolean;
    likesCount: number;
  };
}
