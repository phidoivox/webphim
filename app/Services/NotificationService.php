<?php

namespace App\Services;

use App\Models\Episode;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Notifications\DatabaseNotification;

class NotificationService
{
    /**
     * Lấy danh sách thông báo phân trang của người dùng.
     */
    public function getUserNotifications(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $user->notifications()
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Lấy số lượng thông báo chưa đọc của người dùng.
     */
    public function getUnreadCount(User $user): int
    {
        return $user->unreadNotifications()->count();
    }

    /**
     * Đánh dấu một thông báo là đã đọc.
     */
    public function markAsRead(User $user, string $notificationId): bool
    {
        $notification = $user->notifications()->where('id', $notificationId)->first();

        if (! $notification) {
            return false;
        }

        $notification->markAsRead();

        return true;
    }

    /**
     * Đánh dấu toàn bộ thông báo của người dùng là đã đọc.
     */
    public function markAllAsRead(User $user): int
    {
        return $user->unreadNotifications()->update(['read_at' => now()]);
    }

    /**
     * Xóa một thông báo.
     */
    public function deleteNotification(User $user, string $notificationId): bool
    {
        $notification = $user->notifications()->where('id', $notificationId)->first();

        if (! $notification) {
            return false;
        }

        return (bool) $notification->delete();
    }

    /**
     * Số thông báo chưa đọc cho nhiều user (1 query batch, tránh N+1 COUNT).
     *
     * @param  array<int>  $userIds
     * @return array<int, int>
     */
    public function unreadCountsFor(array $userIds): array
    {
        if (empty($userIds)) {
            return [];
        }

        return DatabaseNotification::query()
            ->where('notifiable_type', (new User)->getMorphClass())
            ->whereIn('notifiable_id', $userIds)
            ->whereNull('read_at')
            ->groupBy('notifiable_id')
            ->selectRaw('notifiable_id, COUNT(*) as aggregate')
            ->pluck('aggregate', 'notifiable_id')
            ->map(fn ($v) => (int) $v)
            ->all();
    }

    /**
     * Gửi thông báo broadcast hệ thống đến tất cả người dùng hoạt động.
     * Dispatch job queue, trả về ngay để tránh timeout request.
     */
    public function broadcastSystemNotification(string $title, string $message, ?string $link = null, bool $sendMail = false): int
    {
        \App\Jobs\BroadcastSystemNotification::dispatch($title, $message, $link, $sendMail);

        return (int) User::where('is_active', true)->count();
    }

    /**
     * Gửi thông báo tập mới: dispatch job queue, trả về 0 ngay (count thật nằm trong job).
     */
    public function notifyNewEpisode(Episode $episode): int
    {
        \App\Jobs\NotifyNewEpisode::dispatch($episode->id);

        return 0;
    }

    /**
     * Format một Notification thành mảng chuẩn trả về qua API.
     */
    public static function formatNotification(DatabaseNotification $notification): array
    {
        $data = $notification->data;

        return [
            'id' => $notification->id,
            'title' => $data['title'] ?? 'Thông báo',
            'message' => $data['message'] ?? '',
            'link' => $data['link'] ?? null,
            'iconType' => $data['icon_type'] ?? 'system',
            'isRead' => $notification->read_at !== null,
            'readAt' => $notification->read_at?->toIso8601String(),
            'createdAt' => $notification->created_at?->toIso8601String(),
            'extra' => [
                'movieId' => $data['movie_id'] ?? null,
                'movieName' => $data['movie_name'] ?? null,
                'movieSlug' => $data['movie_slug'] ?? null,
                'posterUrl' => $data['poster_url'] ?? null,
                'episodeName' => $data['episode_name'] ?? null,
                'replierName' => $data['replier_name'] ?? null,
                'likerName' => $data['liker_name'] ?? null,
            ],
        ];
    }
}
