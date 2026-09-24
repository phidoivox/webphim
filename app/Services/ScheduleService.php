<?php

namespace App\Services;

use App\Models\Movie;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class ScheduleService
{
    public const CACHE_KEY = 'movies:weekly_schedule';

    public const CACHE_TTL = 1800; // 30 phút

    /**
     * Lịch chiếu tuần (0 = CN .. 6 = T7), chỉ phim bộ/TV đang chiếu.
     * Phim chiếu nhiều ngày xuất hiện ở mỗi ngày tương ứng.
     *
     * @return array<int, array<int, array<string, mixed>>>
     */
    public function getWeeklySchedule(): array
    {
        return Cache::tags(['movies', 'schedule'])->flexible(self::CACHE_KEY, [self::CACHE_TTL, self::CACHE_TTL * 2], function () {
            $schedule = [
                0 => [], // Chủ nhật
                1 => [], // Thứ 2
                2 => [], // Thứ 3
                3 => [], // Thứ 4
                4 => [], // Thứ 5
                5 => [], // Thứ 6
                6 => [], // Thứ 7
            ];

            foreach ($this->baseQuery()->get() as $movie) {
                $days = $movie->schedule_days ?? [];
                $item = $this->toItem($movie);
                foreach ($days as $day) {
                    if (isset($schedule[$day])) {
                        $schedule[$day][] = $item;
                    }
                }
            }

            return $schedule;
        });
    }

    /**
     * Lịch 1 ngày (?day=0-6), query qua scopeOnDay (JSON_CONTAINS).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getScheduleByDay(int $day): array
    {
        return Cache::tags(['movies', 'schedule'])->flexible(
            self::CACHE_KEY.":day:{$day}",
            [self::CACHE_TTL, self::CACHE_TTL * 2],
            fn () => $this->baseQuery()->onDay($day)->get()->map(fn ($movie) => $this->toItem($movie))->all()
        );
    }

    /**
     * Query gốc: phim active, có lịch chiếu, status ongoing, loại series/tv-show.
     */
    private function baseQuery(): Builder
    {
        return Movie::query()
            ->active()
            ->hasSchedule()
            ->where('status', 'ongoing')
            ->where(function ($q) {
                $q->whereIn('type', ['series', 'tv-show', 'tv-shows', 'anime', 'hoat-hinh'])
                    ->orWhereHas('genres', fn ($gq) => $gq->whereIn('slug', ['tv-shows', 'anime', 'hoat-hinh']));
            })
            ->with(['genres:id,name,slug'])
            ->select([
                'id',
                'name',
                'origin_name',
                'slug',
                'thumb_url',
                'poster_url',
                'type',
                'status',
                'quality',
                'episode_current',
                'episode_total',
                'notify_schedule',
                'schedule_days',
                'rating_avg',
                'view_count',
                'year',
            ])
            ->orderByDesc('rating_avg')
            ->orderByDesc('view_count');
    }

    /**
     * Map 1 phim sang item lịch chiếu (camelCase cho frontend).
     *
     * @return array<string, mixed>
     */
    private function toItem(Movie $movie): array
    {
        return [
            'id' => $movie->id,
            'name' => $movie->name,
            'originName' => $movie->origin_name,
            'slug' => $movie->slug,
            'thumbUrl' => $movie->thumb_url ?: $movie->poster_url,
            'posterUrl' => $movie->poster_url ?: $movie->thumb_url,
            'type' => $movie->type instanceof \BackedEnum ? $movie->type->value : $movie->type,
            'status' => $movie->status instanceof \BackedEnum ? $movie->status->value : $movie->status,
            'quality' => $movie->quality instanceof \BackedEnum ? $movie->quality->value : $movie->quality,
            'episodeCurrent' => $movie->episode_current,
            'episodeTotal' => $movie->episode_total,
            'notifySchedule' => $movie->notify_schedule,
            'scheduleDays' => $movie->schedule_days ?? [],
            'ratingAvg' => (float) $movie->rating_avg,
            'year' => $movie->year,
            'genres' => $movie->genres->pluck('name')->all(),
        ];
    }
}
