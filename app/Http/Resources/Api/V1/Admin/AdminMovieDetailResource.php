<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Movie
 */
class AdminMovieDetailResource extends JsonResource
{
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
            'name' => $movie->name,
            'originName' => $movie->origin_name,
            'slug' => $movie->slug,
            'thumbUrl' => $movie->thumb_url,
            'posterUrl' => $movie->poster_url,
            'content' => $movie->content,
            'trailerUrl' => $movie->trailer_url,
            'type' => $movie->type,
            'status' => $movie->status,
            'quality' => $movie->quality,
            'lang' => $movie->lang,
            'duration' => $movie->duration,
            'durationMinutes' => $movie->duration_minutes,
            'ageRating' => $movie->age_rating,
            'notifySchedule' => $movie->notify_schedule,
            'scheduleDays' => $movie->schedule_days ?? [],
            'episodeCurrent' => $movie->episode_current,
            'episodeTotal' => $movie->episode_total,
            'year' => $movie->year,
            'tmdbRating' => $movie->tmdb_rating,
            'imdbRating' => $movie->imdb_rating,
            'tmdbId' => $movie->tmdb_id,
            'imdbId' => $movie->imdb_id,
            'sourceUrl' => $movie->source_url,
            'metaTitle' => $movie->meta_title,
            'metaDescription' => $movie->meta_description,
            'metaKeywords' => $movie->meta_keywords,
            'viewCount' => (int) ($movie->view_count ?? 0),
            'ratingAvg' => (float) ($movie->rating_avg ?? 0),
            'isActive' => (bool) $movie->is_active,
            'isFeatured' => (bool) $movie->is_featured,
            'isCinema' => (bool) $movie->is_cinema,
            'genres' => $movie->relationLoaded('genres')
                ? $movie->genres->map(fn ($g) => ['id' => $g->id, 'name' => $g->name, 'slug' => $g->slug])->values()->all()
                : [],
            'countries' => $movie->relationLoaded('countries')
                ? $movie->countries->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug])->values()->all()
                : [],
            'tags' => $movie->relationLoaded('tags')
                ? $movie->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug])->values()->all()
                : [],
            'directors' => $movie->relationLoaded('directors')
                ? $movie->directors->map(fn ($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                    'slug' => $d->slug,
                    'avatarUrl' => $d->avatar_url,
                    'biography' => $d->biography,
                ])->values()->all()
                : [],
            'actors' => $movie->relationLoaded('actors')
                ? $movie->actors->map(fn ($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'slug' => $a->slug,
                    'avatarUrl' => $a->avatar_url,
                    'biography' => $a->biography,
                    'characterName' => $a->pivot->character_name ?? null,
                    'sortOrder' => (int) ($a->pivot->sort_order ?? 0),
                ])->values()->all()
                : [],
            'episodes' => $movie->relationLoaded('episodes')
                ? AdminEpisodeResource::collection($movie->episodes)->resolve()
                : [],
            'galleries' => $movie->relationLoaded('galleries')
                ? $movie->galleries->map(fn ($g) => [
                    'id' => $g->id,
                    'mediaType' => $g->media_type,
                    'type' => $g->type,
                    'url' => $g->url,
                    'thumbUrl' => $g->thumb_url,
                    'caption' => $g->caption,
                    'sortOrder' => $g->sort_order,
                ])->values()->all()
                : [],
            'createdAt' => $movie->created_at?->toIso8601String() ?? '',
            'updatedAt' => $movie->updated_at?->toIso8601String() ?? '',
        ];
    }
}
