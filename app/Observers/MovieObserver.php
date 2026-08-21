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

        $this->invalidateCache($movie);
    }

    /**
     * Handle the Movie "deleted" event.
     */
    public function deleted(Movie $movie): void
    {
        $this->invalidateCache($movie);
    }

    /**
     * Handle the Movie "restored" event.
     */
    public function restored(Movie $movie): void
    {
        $this->invalidateCache($movie);
    }

    /**
     * Handle the Movie "force deleted" event.
     */
    public function forceDeleted(Movie $movie): void
    {
        $this->invalidateCache($movie);
    }

    /**
     * Invalidate relevant cache keys (matching Cache::flexible keys) and trigger Next.js revalidation.
     */
    protected function invalidateCache(Movie $movie): void
    {
        // Invalidate home page cache
        Cache::forget('home:payload');

        // Invalidate movie detail cache
        if (! empty($movie->slug)) {
            Cache::forget("movie:{$movie->slug}");
        }

        // Asynchronously notify Next.js on-demand cache revalidation via defer()
        $slug = $movie->slug;
        defer(function () use ($slug) {
            if (app()->environment('testing')) {
                return;
            }

            try {
                $frontendUrl = rtrim(config('services.frontend.url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
                $secret = env('REVALIDATION_SECRET', 'webphim_secret_revalidate_2026');

                $tags = ['home', 'movies'];
                if (! empty($slug)) {
                    $tags[] = "movie-{$slug}";
                }

                Http::timeout(3)->post("{$frontendUrl}/api/revalidate", [
                    'secret' => $secret,
                    'tags' => $tags,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Failed to trigger Next.js cache revalidation: {$e->getMessage()}");
            }
        })->always();
    }
}
