<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MovieDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Movie $movie */
        $movie = $this->resource;

        return [
            'id' => $movie->id,
            'slug' => $movie->slug,
            'name' => $movie->name,
            'originName' => $movie->origin_name,
            'thumbUrl' => $movie->thumb_url,
            'posterUrl' => $movie->poster_url,
            'content' => $movie->content,
            'year' => $movie->year,
            'quality' => $movie->quality,
            'type' => $movie->type,
            'status' => $movie->status,
            'episodeCurrent' => $movie->episode_current,
            'episodeTotal' => $movie->episode_total,
            'ratingAvg' => $movie->rating_avg,
            'ratingCount' => $movie->rating_count,
            'viewCount' => $movie->view_count,
            'isCinema' => $movie->is_cinema,
            'isNew' => $movie->created_at->gte(now()->subDays(30)),
            'isHot' => $movie->view_count >= 10000 || $movie->rating_avg >= 8.5,
            'trailerUrl' => $movie->trailer_url,
            'durationMinutes' => $movie->duration_minutes,
            'genres' => $movie->genres->pluck('name')->values(),
            'countries' => $movie->countries->pluck('name')->values(),
            'episodes' => $movie->episodes
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($ep) => [
                    'id' => $ep->id,
                    'name' => $ep->name,
                    'slug' => $ep->slug,
                    'servers' => $ep->servers
                        ->sortBy('sort_order')
                        ->values()
                        ->map(fn ($s) => [
                            'id' => $s->id,
                            'serverName' => $s->server_name,
                            'langType' => $s->lang_type,
                            'linkM3u8' => $s->link_m3u8,
                        ]),
                ]),
            'credits' => [
                'directors' => $movie->directors
                    ->sortBy(fn ($p) => $p->pivot->sort_order)
                    ->values()
                    ->map(fn ($p) => $this->credit($p)),
                'actors' => $movie->actors
                    ->sortBy(fn ($p) => $p->pivot->sort_order)
                    ->values()
                    ->map(fn ($p) => [
                        ...$this->credit($p),
                        'characterName' => $p->pivot->character_name,
                    ]),
            ],
            'similar' => $this->similarMovies($movie),
        ];
    }

    private function credit(mixed $person): array
    {
        return [
            'id' => $person->id,
            'name' => $person->name,
            'avatarUrl' => $person->avatar_url,
        ];
    }

    /** Phim cùng thể loại — shape giống MovieSummary frontend (Phase 1). */
    private function similarMovies(Movie $movie): array
    {
        return Movie::query()
            ->whereKeyNot($movie->id)
            ->where('is_active', true)
            ->withoutTrashed()
            ->whereHas('genres', fn ($q) => $q->whereIn('genres.id', $movie->genres->pluck('id')))
            ->with('genres')
            ->orderByDesc('rating_avg')
            ->limit(10)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'slug' => $m->slug,
                'name' => $m->name,
                'originName' => $m->origin_name,
                'thumbUrl' => $m->thumb_url,
                'posterUrl' => $m->poster_url,
                'year' => $m->year,
                'quality' => $m->quality,
                'type' => $m->type,
                'episodeCurrent' => $m->episode_current,
                'episodeTotal' => $m->episode_total,
                'isNew' => $m->created_at->gte(now()->subDays(30)),
                'isHot' => $m->view_count >= 10000 || $m->rating_avg >= 8.5,
                'ratingAvg' => $m->rating_avg,
                'genres' => $m->genres->pluck('name')->values(),
            ])
            ->values()
            ->all();
    }
}
