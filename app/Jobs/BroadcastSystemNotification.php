<?php

namespace App\Jobs;

use App\Events\NotificationSentEvent;
use App\Models\User;
use App\Notifications\SystemBroadcastNotification;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class BroadcastSystemNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $title,
        public string $message,
        public ?string $link = null,
        public bool $sendMail = false,
    ) {}

    public function handle(NotificationService $service): void
    {
        $notification = new SystemBroadcastNotification($this->title, $this->message, $this->link, $this->sendMail);

        $base = [
            'title' => $this->title,
            'message' => $this->message,
            'link' => $this->link,
            'iconType' => 'system',
            'isRead' => false,
            'readAt' => null,
            'createdAt' => now()->toIso8601String(),
            'extra' => [],
        ];

        User::where('is_active', true)->chunkById(100, function (Collection $users) use ($notification, $service, $base) {
            Notification::send($users, $notification);

            // Batch 1 COUNT duy nhất cho cả chunk thay vì N COUNT per-user
            $ids = $users->modelKeys();
            $counts = $service->unreadCountsFor($ids);

            foreach ($users as $user) {
                try {
                    $formatted = $base;
                    $formatted['id'] = (string) Str::uuid();
                    broadcast(new NotificationSentEvent($user->id, $formatted, $counts[$user->id] ?? 0));
                } catch (\Throwable $e) {
                    Log::error('Broadcast system notification error for user '.$user->id.': '.$e->getMessage());
                }
            }
        });
    }
}
