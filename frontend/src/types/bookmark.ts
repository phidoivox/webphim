import type { MovieSummary } from "./movie";

export type BookmarkType = "favorite" | "watchlater";

export interface BookmarkItem {
  id: number;
  userId: number;
  movieId: number;
  type: BookmarkType;
  createdAt: string;
  updatedAt: string;
  movie?: MovieSummary;
}

export interface GuestBookmarkItem {
  movieId: number;
  type: BookmarkType;
  savedAt: string;
  movie: {
    id: number;
    name: string;
    originName?: string | null;
    slug: string;
    posterUrl?: string | null;
    thumbUrl?: string | null;
    year?: number | null;
    quality?: string | null;
    ratingAvg?: number | null;
    genres?: string[];
  };
}

export interface BookmarkCheckResult {
  isBookmarked: boolean;
  types?: BookmarkType[];
  type?: BookmarkType;
  movieId: number;
}

export interface BookmarkToggleResult {
  isBookmarked: boolean;
  action: "added" | "removed";
  type: BookmarkType;
  totalCount: number;
}
