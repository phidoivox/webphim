<?php

namespace App\Observers;

use App\Models\Movie;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MovieObserver
{
    /**
     * Handle the Movie "saved" event (created & updated).
     */
    public function saved(Movie $movie): void
    {
        // Bỏ qua nếu chỉ cập nhật lượt xem (view_count), đánh giá phụ hoặc timestamp
        if (! $movie->wasRecentlyCreated) {
            $changedAttributes = array_keys($movie->getChanges());
            $ignorableAttributes = [
                'view_count',
                'updated_at',
                'rating_avg',
                'rating_count',
                'tmdb_rating',
                'imdb_rating',
                'tmdb_vote_count',
            ];
            $meaningfulChanges = array_diff($changedAttributes, $ignorableAttributes);

            if (empty($meaningfulChanges)) {
                return;
            }
        }

        self::invalidateFor($movie);
    }

    /**
     * Handle the Movie "deleted" event.
     */
    public function deleted(Movie $movie): void
    {
        self::invalidateFor($movie);
    }

    /**
     * Handle the Movie "restored" event.
     */
    public function restored(Movie $movie): void
    {
        self::invalidateFor($movie);
    }

    /**
     * Handle the Movie "force deleted" event.
     */
    public function forceDeleted(Movie $movie): void
    {
        self::invalidateFor($movie);
    }

    /**
     * Invalidate relevant cache keys (matching Cache::flexible keys) and trigger Next.js revalidation.
     */
    public static function invalidateFor(Movie $movie): void
    {
        // Invalidate via Cache Tags if the store supports tags
        if (Cache::supportsTags()) {
            Cache::tags(['movies', 'movies_filter', 'movies_search', 'home', 'schedule', 'taxonomies', 'genres', 'countries'])->flush();
            if (! empty($movie->slug)) {
                Cache::tags(["movie:{$movie->slug}"])->flush();
            }
        }

        if (! empty($movie->slug)) {
            Cache::forget("movie:{$movie->slug}");
        }

        // Direct key invalidation fallback
        Cache::forget('home:payload');
        Cache::forget('movies:weekly_schedule');
        for ($day = 0; $day <= 6; $day++) {
            Cache::forget("movies:weekly_schedule:day:{$day}");
        }
        Cache::forget('genres:list');
        Cache::forget('countries:list');

        // Asynchronously notify Next.js on-demand cache revalidation via defer()
        $slug = $movie->slug;
        defer(function () use ($slug) {
            if (app()->environment('testing')) {
                return;
            }

            try {
                $frontendUrl = rtrim((string) config('services.frontend.url', 'http://localhost:3000'), '/');
                $secret = (string) config('services.frontend.revalidation_secret');

                if ($secret === '') {
                    Log::warning('Skipped Next.js cache revalidation: REVALIDATION_SECRET missing');

                    return;
                }

                $tags = ['home', 'movies', 'schedule'];
                if (! empty($slug)) {
                    $tags[] = "movie-{$slug}";
                }

                Http::timeout(3)->withToken($secret)->post("{$frontendUrl}/api/revalidate", [
                    'tags' => $tags,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Failed to trigger Next.js cache revalidation: {$e->getMessage()}");
            }
        })->always();
    }
}
