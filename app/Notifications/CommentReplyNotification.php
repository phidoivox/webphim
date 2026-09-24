<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommentReplyNotification extends Notification
{
    use Queueable;

    public function __construct(
        public User $replier,
        public Comment $parentComment,
        public Comment $replyComment,
        public Movie $movie
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $movieUrl = config('app.frontend_url', 'http://localhost:3000')."/phim/{$this->movie->slug}";

        return (new MailMessage)
            ->subject("[WebPhim] {$this->replier->name} đã trả lời bình luận của bạn")
            ->greeting("Xin chào {$notifiable->name},")
            ->line("**{$this->replier->name}** vừa phản hồi bình luận của bạn tại phim **{$this->movie->name}**:")
            ->line('"'.mb_substr($this->replyComment->content, 0, 150).'..."')
            ->action('Xem Bình Luận', $movieUrl)
            ->salutation('Trân trọng, Đội ngũ WebPhim');
    }

    /**
     * Get the array representation of the notification for database storage.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => "Phản hồi mới từ {$this->replier->name}",
            'message' => "{$this->replier->name} đã trả lời bình luận của bạn trong phim {$this->movie->name}.",
            'link' => "/phim/{$this->movie->slug}",
            'icon_type' => 'comment',
            'movie_id' => $this->movie->id,
            'movie_name' => $this->movie->name,
            'movie_slug' => $this->movie->slug,
            'replier_name' => $this->replier->name,
        ];
    }

    /**
     * Get the broadcast representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'title' => "Phản hồi mới từ {$this->replier->name}",
            'message' => "{$this->replier->name} đã trả lời bình luận của bạn trong phim {$this->movie->name}.",
            'link' => "/phim/{$this->movie->slug}",
            'icon_type' => 'comment',
            'movie_id' => $this->movie->id,
            'movie_name' => $this->movie->name,
            'movie_slug' => $this->movie->slug,
            'replier_name' => $this->replier->name,
            'created_at' => now()->toIso8601String(),
        ]);
    }
}
