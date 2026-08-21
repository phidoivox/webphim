<?php

namespace App\Services;

use App\Events\NotificationSentEvent;
use App\Models\Episode;
use App\Models\User;
use App\Notifications\NewEpisodeNotification;
use App\Notifications\SystemBroadcastNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

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
     * Gửi thông báo broadcast hệ thống đến tất cả người dùng hoạt động.
     */
    public function broadcastSystemNotification(string $title, string $message, ?string $link = null, bool $sendMail = false): int
    {
        $notification = new SystemBroadcastNotification($title, $message, $link, $sendMail);

        $sentCount = 0;
        User::where('is_active', true)->chunkById(100, function (Collection $users) use ($notification, $title, $message, $link, &$sentCount) {
            Notification::send($users, $notification);
            $sentCount += $users->count();

            foreach ($users as $user) {
                try {
                    $unread = $user->unreadNotifications()->count();
                    $latest = $user->notifications()->latest()->first();
                    $formatted = $latest ? self::formatNotification($latest) : [
                        'id' => (string) Str::uuid(),
                        'title' => $title,
                        'message' => $message,
                        'link' => $link,
                        'iconType' => 'system',
                        'isRead' => false,
                        'readAt' => null,
                        'createdAt' => now()->toIso8601String(),
                        'extra' => [],
                    ];
                    broadcast(new NotificationSentEvent($user->id, $formatted, $unread));
                } catch (\Throwable $e) {
                    Log::error('Broadcast system notification error for user '.$user->id.': '.$e->getMessage());
                }
            }
        });

        return $sentCount;
    }

    /**
     * Gửi thông báo tập mới cho tất cả người dùng đã bookmark phim.
     */
    public function notifyNewEpisode(Episode $episode): int
    {
        $movie = $episode->movie;
        if (! $movie) {
            return 0;
        }

        // Lấy danh sách user_id đã bookmark bộ phim này
        $userIds = $movie->bookmarks()->pluck('user_id');

        if ($userIds->isEmpty()) {
            return 0;
        }

        $notification = new NewEpisodeNotification($movie, $episode);
        $sentCount = 0;

        User::whereIn('id', $userIds)
            ->where('is_active', true)
            ->chunkById(100, function (Collection $users) use ($notification, &$sentCount) {
                Notification::send($users, $notification);
                $sentCount += $users->count();

                foreach ($users as $user) {
                    try {
                        $unread = $user->unreadNotifications()->count();
                        $latest = $user->notifications()->latest()->first();
                        if ($latest) {
                            broadcast(new NotificationSentEvent($user->id, self::formatNotification($latest), $unread));
                        }
                    } catch (\Throwable $e) {
                        Log::error('Broadcast episode error for user '.$user->id.': '.$e->getMessage());
                    }
                }
            });

        return $sentCount;
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
