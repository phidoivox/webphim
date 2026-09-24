<?php

namespace App\Notifications;

use App\Models\Episode;
use App\Models\Movie;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewEpisodeNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Movie $movie,
        public Episode $episode
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
        $watchUrl = config('app.frontend_url', 'http://localhost:3000')."/xem/{$this->movie->slug}/{$this->episode->slug}";

        return (new MailMessage)
            ->subject("[WebPhim] Tập mới: {$this->movie->name} - {$this->episode->name}")
            ->greeting("Xin chào {$notifiable->name},")
            ->line("Bộ phim **{$this->movie->name}** mà bạn đang theo dõi vừa phát hành tập mới: **{$this->episode->name}**.")
            ->action('Xem Phim Ngay', $watchUrl)
            ->line('Chúc bạn có những giây phút xem phim vui vẻ!')
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
            'title' => "Tập mới: {$this->movie->name}",
            'message' => "Đã có {$this->episode->name} với chất lượng cao.",
            'link' => "/xem/{$this->movie->slug}/{$this->episode->slug}",
            'icon_type' => 'episode',
            'movie_id' => $this->movie->id,
            'movie_name' => $this->movie->name,
            'movie_slug' => $this->movie->slug,
            'poster_url' => $this->movie->poster_url ?: $this->movie->thumb_url,
            'episode_name' => $this->episode->name,
        ];
    }

    /**
     * Get the broadcast representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'title' => "Tập mới: {$this->movie->name}",
            'message' => "Đã có {$this->episode->name} với chất lượng cao.",
            'link' => "/xem/{$this->movie->slug}/{$this->episode->slug}",
            'icon_type' => 'episode',
            'movie_id' => $this->movie->id,
            'movie_name' => $this->movie->name,
            'movie_slug' => $this->movie->slug,
            'poster_url' => $this->movie->poster_url ?: $this->movie->thumb_url,
            'episode_name' => $this->episode->name,
            'created_at' => now()->toIso8601String(),
        ]);
    }
}
