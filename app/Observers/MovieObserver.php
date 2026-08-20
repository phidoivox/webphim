<?php

namespace App\Observers;

use App\Models\Movie;
use Illuminate\Support\Facades\Cache;

class MovieObserver
{
    /**
     * Handle the Movie "saved" event (created & updated).
     */
    public function saved(Movie $movie): void
    {
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
     * Invalidate relevant cache keys (matching Cache::flexible keys).
     */
    protected function invalidateCache(Movie $movie): void
    {
        // Invalidate home page cache
        Cache::forget('home:payload');

        // Invalidate movie detail cache
        if (!empty($movie->slug)) {
            Cache::forget("movie:{$movie->slug}");
        }
    }
}
