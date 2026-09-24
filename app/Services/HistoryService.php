<?php

namespace App\Services;

use App\Models\User;
use App\Models\WatchHistory;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class HistoryService
{
    /**
     * Đồng bộ / Cập nhật tiến trình xem phim
     */
    public function syncProgress(User $user, array $data): WatchHistory
    {
        $progress = (int) ($data['progress_seconds'] ?? 0);
        $duration = isset($data['duration_seconds']) ? (int) $data['duration_seconds'] : null;
        $isCompleted = ($duration && $duration > 0) ? (($progress / $duration) >= 0.9) : false;

        $history = WatchHistory::updateOrCreate(
            [
                'user_id' => $user->id,
                'movie_id' => $data['movie_id'],
                'episode_id' => $data['episode_id'] ?? null,
            ],
            [
                'server_id' => $data['server_id'] ?? null,
                'progress_seconds' => $progress,
                'duration_seconds' => $duration,
                'is_completed' => $isCompleted,
                'watched_at' => now(),
            ]
        );

        return $history->loadMissing(['movie', 'episode', 'server']);
    }

    /**
     * Lấy danh sách lịch sử xem phim của người dùng có phân trang và bộ lọc
     */
    public function getUserHistory(User $user, int $perPage = 20, ?string $filter = null): LengthAwarePaginator
    {
        $query = WatchHistory::query()
            ->where('user_id', $user->id)
            ->with(['movie', 'episode', 'server'])
            ->orderByDesc('watched_at');

        if ($filter === 'completed') {
            $query->where('is_completed', true);
        } elseif ($filter === 'in_progress') {
            $query->where('is_completed', false);
        }

        return $query->paginate($perPage);
    }

    /**
     * Lấy tiến trình xem gần nhất của một bộ phim cụ thể
     */
    public function getMovieProgress(User $user, int $movieId): ?WatchHistory
    {
        return WatchHistory::query()
            ->where('user_id', $user->id)
            ->where('movie_id', $movieId)
            ->with(['movie', 'episode', 'server'])
            ->orderByDesc('watched_at')
            ->first();
    }

    /**
     * Xóa 1 mục lịch sử xem phim
     */
    public function deleteItem(User $user, int $historyId): bool
    {
        $item = WatchHistory::query()
            ->where('user_id', $user->id)
            ->where('id', $historyId)
            ->first();

        if (! $item) {
            return false;
        }

        return (bool) $item->delete();
    }

    /**
     * Xóa toàn bộ lịch sử xem phim của người dùng
     */
    public function clearAll(User $user): int
    {
        return WatchHistory::query()
            ->where('user_id', $user->id)
            ->delete();
    }

    /**
     * Gộp lịch sử xem từ thiết bị khách (Guest) vào tài khoản Cloud
     */
    public function mergeGuestHistory(User $user, array $items): int
    {
        $count = 0;

        DB::transaction(function () use ($user, $items, &$count) {
            foreach ($items as $item) {
                if (empty($item['movie_id'])) {
                    continue;
                }

                $progress = (int) ($item['progress_seconds'] ?? 0);
                $duration = isset($item['duration_seconds']) ? (int) $item['duration_seconds'] : null;
                $isCompleted = ($duration && $duration > 0) ? (($progress / $duration) >= 0.9) : false;
                try {
                    $watchedAt = ! empty($item['watched_at']) ? Carbon::parse($item['watched_at']) : now();
                } catch (\Throwable) {
                    $watchedAt = now();
                }

                $existing = WatchHistory::where('user_id', $user->id)
                    ->where('movie_id', $item['movie_id'])
                    ->where('episode_id', $item['episode_id'] ?? null)
                    ->first();

                if ($existing) {
                    $isGuestNewer = $watchedAt->greaterThan($existing->watched_at ?? $existing->updated_at);
                    $isGuestFurther = $progress > $existing->progress_seconds;

                    if (! $isGuestNewer && ! $isGuestFurther) {
                        continue;
                    }

                    $existing->update([
                        'server_id' => $item['server_id'] ?? $existing->server_id,
                        'progress_seconds' => max($progress, $existing->progress_seconds),
                        'duration_seconds' => $duration ?: $existing->duration_seconds,
                        'is_completed' => $isCompleted || (bool) $existing->is_completed,
                        'watched_at' => $isGuestNewer ? $watchedAt : $existing->watched_at,
                    ]);
                } else {
                    WatchHistory::create([
                        'user_id' => $user->id,
                        'movie_id' => $item['movie_id'],
                        'episode_id' => $item['episode_id'] ?? null,
                        'server_id' => $item['server_id'] ?? null,
                        'progress_seconds' => $progress,
                        'duration_seconds' => $duration,
                        'is_completed' => $isCompleted,
                        'watched_at' => $watchedAt,
                    ]);
                }

                $count++;
            }
        });

        return $count;
    }
}
