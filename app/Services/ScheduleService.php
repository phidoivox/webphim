<?php

namespace App\Services;

use App\Models\Movie;
use Illuminate\Support\Facades\Cache;

class ScheduleService
{
    public const CACHE_KEY = 'movies:weekly_schedule';

    public const CACHE_TTL = 1800; // 30 phút

    /**
     * Lấy danh sách lịch chiếu phim trong tuần (nhóm theo ngày từ Chủ nhật = 0 đến Thứ 7 = 6).
     *
     * @return array<int, array<int, array<string, mixed>>>
     */
    public function getWeeklySchedule(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $movies = Movie::query()
                ->active()
                ->hasSchedule()
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
                    'schedule_day_of_week',
                    'rating_avg',
                    'view_count',
                    'year',
                ])
                ->orderBy('schedule_day_of_week')
                ->orderByDesc('rating_avg')
                ->orderByDesc('view_count')
                ->get();

            // Khởi tạo khung 7 ngày trong tuần
            $schedule = [
                0 => [], // Chủ nhật
                1 => [], // Thứ 2
                2 => [], // Thứ 3
                3 => [], // Thứ 4
                4 => [], // Thứ 5
                5 => [], // Thứ 6
                6 => [], // Thứ 7
            ];

            foreach ($movies as $movie) {
                $day = $movie->schedule_day_of_week;
                if ($day !== null && isset($schedule[$day])) {
                    $schedule[$day][] = [
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
                        'scheduleDayOfWeek' => $movie->schedule_day_of_week,
                        'ratingAvg' => (float) $movie->rating_avg,
                        'year' => $movie->year,
                        'genres' => $movie->genres->pluck('name')->all(),
                    ];
                }
            }

            return $schedule;
        });
    }

    /**
     * Xóa cache lịch chiếu phim.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
