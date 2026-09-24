<?php

namespace App\Jobs;

use App\Events\NotificationSentEvent;
use App\Models\Episode;
use App\Models\User;
use App\Notifications\NewEpisodeNotification;
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

class NotifyNewEpisode implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $episodeId,
    ) {}

    public function handle(NotificationService $service): void
    {
        $episode = Episode::with('movie')->find($this->episodeId);
        if (! $episode || ! $episode->movie) {
            return;
        }

        $movie = $episode->movie;
        $notification = new NewEpisodeNotification($movie, $episode);

        $base = [
            'title' => "Tập mới: {$movie->name}",
            'message' => "Đã có {$episode->name} của bộ phim \"{$movie->name}\". Xem ngay!",
            'link' => "/xem/{$movie->slug}/{$episode->slug}",
            'iconType' => 'episode',
            'isRead' => false,
            'readAt' => null,
            'createdAt' => now()->toIso8601String(),
            'extra' => [
                'movieId' => $movie->id,
                'movieName' => $movie->name,
                'movieSlug' => $movie->slug,
                'posterUrl' => $movie->poster_url ?: $movie->thumb_url,
                'episodeName' => $episode->name,
                'replierName' => null,
                'likerName' => null,
            ],
        ];

        User::query()
            ->whereHas('bookmarks', fn ($q) => $q->where('movie_id', $movie->id))
            ->where('is_active', true)
            ->chunkById(100, function (Collection $users) use ($notification, $service, $base) {
                Notification::send($users, $notification);

                $counts = $service->unreadCountsFor($users->modelKeys());

                foreach ($users as $user) {
                    try {
                        $formatted = $base;
                        $formatted['id'] = (string) Str::uuid();
                        broadcast(new NotificationSentEvent($user->id, $formatted, $counts[$user->id] ?? 0));
                    } catch (\Throwable $e) {
                        Log::error('Broadcast episode error for user '.$user->id.': '.$e->getMessage());
                    }
                }
            });
    }
}
