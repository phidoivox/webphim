import type { MovieSummary } from "@/types/movie";

/** Bộ sưu tập tóm tắt — khớp `CollectionSummaryResource` backend. */
export interface CollectionSummary {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbUrl: string | null;
  isPublic: boolean;
  moviesCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  movies?: MovieSummary[];
}

/** Tác giả bộ sưu tập công khai. */
export interface CollectionCreator {
  id: number;
  name: string;
  avatarUrl: string | null;
}

/** Chi tiết bộ sưu tập — khớp `CollectionDetailResource` backend. */
export interface CollectionDetail extends CollectionSummary {
  creator?: CollectionCreator | null;
  movies: MovieSummary[];
}

/** Hồ sơ công khai user — khớp `PublicProfileController`. */
export interface PublicProfileData {
  user: {
    id: number;
    name: string;
    avatarUrl: string | null;
    subscriptionType: string;
    createdAt: string | null;
    collectionsCount: number;
  };
  collections: CollectionSummary[];
}

/** Thông tin profile cá nhân — khớp `UserProfileController@show`. */
export interface UserProfileData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    subscriptionType: string;
    subscriptionExpiresAt: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string | null;
  };
  stats: {
    collectionsCount: number;
    bookmarksCount: number;
  };
}

export interface CollectionPayload {
  name: string;
  description?: string;
  is_public?: boolean;
}
