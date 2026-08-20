<?php

namespace App\Services;

use App\Models\Bookmark;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BookmarkService
{
    /**
     * Chuyển đổi trạng thái lưu / bỏ lưu phim (Optimistic Atomic Toggle)
     *
     * @return array{isBookmarked: bool, action: string, type: string, totalCount: int}
     */
    public function toggleBookmark(User $user, int $movieId, string $type = Bookmark::TYPE_FAVORITE): array
    {
        return DB::transaction(function () use ($user, $movieId, $type) {
            $existing = Bookmark::where('user_id', $user->id)
                ->where('movie_id', $movieId)
                ->where('type', $type)
                ->first();

            if ($existing) {
                $existing->delete();
                $isBookmarked = false;
                $action = 'removed';
            } else {
                Bookmark::create([
                    'user_id' => $user->id,
                    'movie_id' => $movieId,
                    'type' => $type,
                ]);
                $isBookmarked = true;
                $action = 'added';
            }

            $totalCount = Bookmark::where('user_id', $user->id)->count();

            return [
                'isBookmarked' => $isBookmarked,
                'action' => $action,
                'type' => $type,
                'totalCount' => $totalCount,
            ];
        });
    }

    /**
     * Lấy danh sách tủ phim có phân trang, bộ lọc và sắp xếp
     */
    public function getPaginatedBookmarks(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Bookmark::query()
            ->where('user_id', $user->id)
            ->with(['movie.genres']);

        // 1. Lọc theo loại (favorite / watchlater)
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // 2. Tìm kiếm theo tên phim
        if (!empty($filters['q'])) {
            $search = trim($filters['q']);
            $query->whereHas('movie', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('origin_name', 'like', "%{$search}%");
            });
        }

        // 3. Sắp xếp
        $sort = $filters['sort'] ?? 'latest';
        match ($sort) {
            'oldest' => $query->orderBy('created_at', 'asc'),
            'rating' => $query->join('movies', 'bookmarks.movie_id', '=', 'movies.id')
                ->select('bookmarks.*')
                ->orderBy('movies.rating_avg', 'desc')
                ->orderBy('bookmarks.created_at', 'desc'),
            'year' => $query->join('movies', 'bookmarks.movie_id', '=', 'movies.id')
                ->select('bookmarks.*')
                ->orderBy('movies.year', 'desc')
                ->orderBy('bookmarks.created_at', 'desc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $perPage = min((int) ($filters['per_page'] ?? 24), 50);

        return $query->paginate($perPage);
    }

    /**
     * Kiểm tra trạng thái đã lưu phim hay chưa
     */
    public function checkStatus(User $user, int $movieId, ?string $type = null): array
    {
        $query = Bookmark::where('user_id', $user->id)
            ->where('movie_id', $movieId);

        if ($type) {
            $isBookmarked = $query->where('type', $type)->exists();
            return [
                'isBookmarked' => $isBookmarked,
                'type' => $type,
                'movieId' => $movieId,
            ];
        }

        $types = $query->pluck('type')->all();

        return [
            'isBookmarked' => count($types) > 0,
            'types' => $types,
            'movieId' => $movieId,
        ];
    }

    /**
     * Xóa một mục khỏi tủ phim
     */
    public function deleteBookmark(User $user, int $id): bool
    {
        return Bookmark::where('user_id', $user->id)
            ->where('id', $id)
            ->delete() > 0;
    }

    /**
     * Xóa toàn bộ tủ phim của người dùng
     */
    public function clearAll(User $user, ?string $type = null): int
    {
        $query = Bookmark::where('user_id', $user->id);

        if ($type) {
            $query->where('type', $type);
        }

        return $query->delete();
    }

    /**
     * Gộp danh sách tủ phim của khách vào tài khoản khi đăng nhập
     */
    public function mergeGuestBookmarks(User $user, array $items): int
    {
        if (empty($items)) {
            return 0;
        }

        return DB::transaction(function () use ($user, $items) {
            $addedCount = 0;

            foreach ($items as $item) {
                $movieId = (int) ($item['movie_id'] ?? 0);
                $type = $item['type'] ?? Bookmark::TYPE_FAVORITE;

                if ($movieId <= 0) {
                    continue;
                }

                $bookmark = Bookmark::firstOrCreate([
                    'user_id' => $user->id,
                    'movie_id' => $movieId,
                    'type' => $type,
                ]);

                if ($bookmark->wasRecentlyCreated) {
                    $addedCount++;
                }
            }

            return $addedCount;
        });
    }
}
