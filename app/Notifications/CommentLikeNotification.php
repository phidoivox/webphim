<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class CommentLikeNotification extends Notification
{
    use Queueable;

    public function __construct(
        public User $liker,
        public Comment $comment,
        public Movie $movie
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification for database storage.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $likerAttrs = $this->liker->getAttributes();
        $likerName = $likerAttrs['name'] ?? ($this->liker->name ?? 'Người dùng');
        $likerAvatar = $likerAttrs['avatar_url'] ?? null;

        return [
            'title' => 'Lượt thích mới',
            'message' => "{$likerName} đã thích bình luận của bạn trong phim {$this->movie->name}.",
            'link' => "/phim/{$this->movie->slug}",
            'icon_type' => 'like',
            'comment_id' => $this->comment->id,
            'movie_id' => $this->movie->id,
            'movie_name' => $this->movie->name,
            'movie_slug' => $this->movie->slug,
            'liker_name' => $likerName,
            'liker_avatar' => $likerAvatar,
        ];
    }

    /**
     * Get the broadcast representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $likerAttrs = $this->liker->getAttributes();
        $likerName = $likerAttrs['name'] ?? ($this->liker->name ?? 'Người dùng');
        $likerAvatar = $likerAttrs['avatar_url'] ?? null;

        return new BroadcastMessage([
            'id' => $this->id,
            'title' => 'Lượt thích mới',
            'message' => "{$likerName} đã thích bình luận của bạn trong phim {$this->movie->name}.",
            'link' => "/phim/{$this->movie->slug}",
            'icon_type' => 'like',
            'comment_id' => $this->comment->id,
            'movie_id' => $this->movie->id,
            'movie_name' => $this->movie->name,
            'movie_slug' => $this->movie->slug,
            'liker_name' => $likerName,
            'liker_avatar' => $likerAvatar,
            'created_at' => now()->toIso8601String(),
        ]);
    }
}
