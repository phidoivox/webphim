<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SystemBroadcastNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public ?string $link = null,
        public bool $sendMail = false
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $this->sendMail ? ['database', 'broadcast', 'mail'] : ['database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("[WebPhim] {$this->title}")
            ->greeting("Xin chào {$notifiable->name},")
            ->line($this->message);

        if ($this->link) {
            $url = str_starts_with($this->link, 'http')
                ? $this->link
                : config('app.frontend_url', 'http://localhost:3000').$this->link;
            $mail->action('Xem Ngay', $url);
        }

        return $mail->salutation('Trân trọng, Ban Quản Trị WebPhim');
    }

    /**
     * Get the array representation of the notification for database storage.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'link' => $this->link,
            'icon_type' => 'system',
        ];
    }

    /**
     * Get the broadcast representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'link' => $this->link,
            'icon_type' => 'system',
            'created_at' => now()->toIso8601String(),
        ]);
    }
}
