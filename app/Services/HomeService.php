<?php

namespace App\Services;

use App\Http\Resources\Api\V1\MovieSummaryResource;
use App\Models\Movie;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class HomeService
{
    public const CACHE_KEY = 'home:payload';

    public const CACHE_FRESH_TTL = 300;  // 5 phút — dữ liệu tươi

    public const CACHE_STALE_TTL = 600;  // 10 phút — phục vụ stale trong khi refresh nền

    /**
     * Lấy toàn bộ dữ liệu cấu trúc trang chủ (SWR via Cache::flexible).
     *
     * @return array<string, mixed>
     */
    public function getHomeData(): array
    {
        return Cache::flexible(self::CACHE_KEY, [self::CACHE_FRESH_TTL, self::CACHE_STALE_TTL], function (): array {
            $heroMovies = Movie::query()
                ->active()
                ->with([
                    'genres:id,name,slug',
                    'episodes' => fn ($query) => $query->select('id', 'movie_id', 'slug', 'name', 'sort_order')->orderBy('sort_order'),
                ])
                ->orderByDesc('view_count')
                ->limit(3)
                ->get()
                ->map(function (Movie $m) {
                    $firstEpisode = $m->relationLoaded('episodes') ? $m->episodes->first() : null;
                    $firstEpisodeSlug = $firstEpisode?->slug ?? ($m->type === 'single' ? 'full' : 'tap-1');

                    return [
                        'id' => $m->id,
                        'slug' => $m->slug,
                        'name' => $m->name,
                        'originName' => $m->origin_name,
                        'posterUrl' => $m->poster_url,
                        'thumbUrl' => $m->thumb_url,
                        'backdropUrl' => $m->thumb_url,
                        'year' => $m->year,
                        'quality' => $m->quality instanceof \BackedEnum ? $m->quality->value : $m->quality,
                        'ratingAvg' => $m->tmdb_rating > 0 ? (float) $m->tmdb_rating : (float) $m->rating_avg,
                        'imdbRating' => $m->imdb_rating > 0 ? (float) $m->imdb_rating : null,
                        'genres' => $m->relationLoaded('genres')
                            ? $m->genres->pluck('name')->values()->all()
                            : [],
                        'description' => $m->content ?? '',
                        'trailerUrl' => $m->trailer_url,
                        'episodeLabel' => $m->type === 'single' ? 'Full' : ($m->episode_current ?? 'Tập 1-12'),
                        'firstEpisodeSlug' => $firstEpisodeSlug,
                    ];
                })
                ->values()
                ->all();

            $baseQuery = fn (): Builder => Movie::query()
                ->active()
                ->with(['genres:id,name,slug']);

            $newMovies = $baseQuery()
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();

            $hotMovies = $baseQuery()
                ->orderByDesc('view_count')
                ->limit(10)
                ->get();

            $seriesMovies = $baseQuery()
                ->ofType('series')
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();

            // Bọc OR trong nested closure để không làm leak soft-deleted/inactive movies
            $cinemaMovies = $baseQuery()
                ->where(function (Builder $query) {
                    $query->where('is_cinema', true)
                        ->orWhere('type', 'single');
                })
                ->orderByDesc('rating_avg')
                ->limit(10)
                ->get();

            return [
                'heroMovies' => $heroMovies,
                'sections' => [
                    [
                        'id' => 'new',
                        'title' => 'Phim mới cập nhật',
                        'movies' => MovieSummaryResource::collection($newMovies)->resolve(),
                    ],
                    [
                        'id' => 'hot',
                        'title' => 'Đang hot',
                        'movies' => MovieSummaryResource::collection($hotMovies)->resolve(),
                    ],
                    [
                        'id' => 'series',
                        'title' => 'Phim bộ mới',
                        'movies' => MovieSummaryResource::collection($seriesMovies)->resolve(),
                    ],
                    [
                        'id' => 'cinema',
                        'title' => 'Phim chiếu rạp',
                        'movies' => MovieSummaryResource::collection($cinemaMovies)->resolve(),
                    ],
                ],
            ];
        });
    }

    /**
     * Xóa cache trang chủ chủ động.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
