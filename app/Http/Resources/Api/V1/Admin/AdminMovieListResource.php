<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Movie
 */
class AdminMovieListResource extends JsonResource
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
            'type' => $movie->type,
            'status' => $movie->status,
            'quality' => $movie->quality,
            'year' => $movie->year,
            'episodeCurrent' => $movie->episode_current,
            'episodeTotal' => $movie->episode_total,
            'viewCount' => (int) ($movie->view_count ?? 0),
            'ratingAvg' => (float) ($movie->rating_avg ?? 0),
            'isActive' => (bool) $movie->is_active,
            'isFeatured' => (bool) $movie->is_featured,
            'isCinema' => (bool) $movie->is_cinema,
            'genres' => $movie->relationLoaded('genres')
                ? $movie->genres->map(fn ($g) => ['id' => $g->id, 'name' => $g->name])->values()->all()
                : [],
            'countries' => $movie->relationLoaded('countries')
                ? $movie->countries->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->values()->all()
                : [],
            'createdAt' => $movie->created_at?->toIso8601String() ?? '',
            'updatedAt' => $movie->updated_at?->toIso8601String() ?? '',
        ];
    }
}
