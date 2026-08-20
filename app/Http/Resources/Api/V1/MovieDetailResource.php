<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Movie
 */
class MovieDetailResource extends JsonResource
{
    /**
     * Danh sách phim tương tự được truyền từ Service/Controller.
     */
    protected mixed $similarMovies;

    public function __construct(mixed $resource, mixed $similarMovies = [])
    {
        parent::__construct($resource);
        $this->similarMovies = $similarMovies;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
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
            'quality' => $movie->quality instanceof \BackedEnum ? $movie->quality->value : $movie->quality,
            'type' => $movie->type instanceof \BackedEnum ? $movie->type->value : $movie->type,
            'status' => $movie->status instanceof \BackedEnum ? $movie->status->value : $movie->status,
            'episodeCurrent' => $movie->episode_current,
            'episodeTotal' => $movie->episode_total,
            'ratingAvg' => (float) ($movie->rating_avg ?? 0),
            'imdbRating' => $movie->imdb_rating > 0 ? (float) $movie->imdb_rating : null,
            'ratingCount' => (int) ($movie->rating_count ?? 0),
            'viewCount' => (int) ($movie->view_count ?? 0),
            'isCinema' => (bool) $movie->is_cinema,
            'isNew' => $movie->created_at ? $movie->created_at->gte(now()->subDays(30)) : false,
            'isHot' => ($movie->view_count ?? 0) >= 10000 || ($movie->rating_avg ?? 0) >= 8.5,
            'trailerUrl' => $movie->trailer_url,
            'lang' => $movie->lang,
            'durationMinutes' => $movie->duration_minutes,
            'genres' => $movie->relationLoaded('genres')
                ? $movie->genres->pluck('name')->values()->all()
                : [],
            'countries' => $movie->relationLoaded('countries')
                ? $movie->countries->pluck('name')->values()->all()
                : [],
            'tags' => $movie->relationLoaded('tags')
                ? $movie->tags->map(fn ($t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'slug' => $t->slug,
                ])->values()->all()
                : [],
            'episodes' => $movie->relationLoaded('episodes')
                ? $movie->episodes
                    ->map(fn ($ep) => [
                        'id' => $ep->id,
                        'name' => $ep->name,
                        'slug' => $ep->slug,
                        'servers' => $ep->relationLoaded('servers')
                            ? $ep->servers
                                ->map(fn ($s) => [
                                    'id' => $s->id,
                                    'serverName' => $s->server_name,
                                    'langType' => $s->lang_type instanceof \BackedEnum ? $s->lang_type->value : $s->lang_type,
                                    'linkM3u8' => $s->link_m3u8,
                                ])
                                ->values()
                                ->all()
                            : [],
                    ])
                    ->values()
                    ->all()
                : [],
            'credits' => [
                'directors' => $movie->relationLoaded('directors')
                    ? $movie->directors
                        ->sortBy(fn ($p) => $p->pivot->sort_order ?? 0)
                        ->values()
                        ->map(fn ($p) => $this->credit($p))
                        ->all()
                    : [],
                'actors' => $movie->relationLoaded('actors')
                    ? $movie->actors
                        ->sortBy(fn ($p) => $p->pivot->sort_order ?? 0)
                        ->values()
                        ->map(fn ($p) => [
                            ...$this->credit($p),
                            'characterName' => $p->pivot->character_name ?? null,
                        ])
                        ->all()
                    : [],
            ],
            'gallery' => $movie->relationLoaded('galleries')
                ? $movie->galleries
                    ->map(fn ($item) => [
                        'id' => $item->id,
                        'mediaType' => $item->media_type,
                        'type' => $item->type,
                        'url' => $item->url,
                        'thumbUrl' => $item->thumb_url,
                        'caption' => $item->caption,
                        'durationSeconds' => $item->duration_seconds,
                    ])
                    ->values()
                    ->all()
                : [],
            'similar' => MovieSummaryResource::collection($this->similarMovies)->resolve(),
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
}
