<?php

namespace App\Observers;

use App\Models\Episode;
use App\Models\EpisodeServer;
use App\Models\Movie;

class EpisodeObserver
{
    public function saved(Episode|EpisodeServer $model): void
    {
        $this->invalidate($model);
    }

    public function deleted(Episode|EpisodeServer $model): void
    {
        $this->invalidate($model);
    }

    protected function invalidate(Episode|EpisodeServer $model): void
    {
        $movie = $this->resolveMovie($model);
        if ($movie) {
            // ponytail: flush + revalidate webhook chạy mỗi lần save (bulk sync N tập = N lần).
            // Đủ đúng cho admin ops tần suất thấp; khi sync hàng trăm tập thì gom
            // thành 1 lần flush/webhook duy nhất ở cuối AdminEpisodeController::sync.
            MovieObserver::invalidateFor($movie);
        }
    }

    protected function resolveMovie(Episode|EpisodeServer $model): ?Movie
    {
        if ($model instanceof Episode) {
            $movieId = $model->getAttribute('movie_id') ?? $model->getOriginal('movie_id');
            if ($movieId === null) {
                return null;
            }

            return Movie::query()->find($movieId);
        }

        $episode = $model->episode()->first();

        return $episode?->movie()->first();
    }
}
