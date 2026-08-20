<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Movie
 */
class MovieSummaryResource extends JsonResource
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
            'slug' => $movie->slug,
            'name' => $movie->name,
            'originName' => $movie->origin_name,
            'thumbUrl' => $movie->thumb_url,
            'posterUrl' => $movie->poster_url,
            'year' => $movie->year,
            'quality' => $movie->quality instanceof \BackedEnum ? $movie->quality->value : $movie->quality,
            'type' => $movie->type instanceof \BackedEnum ? $movie->type->value : $movie->type,
            'episodeCurrent' => $movie->episode_current,
            'episodeTotal' => $movie->episode_total,
            'isNew' => $movie->created_at ? $movie->created_at->gte(now()->subDays(30)) : false,
            'isHot' => ($movie->view_count ?? 0) >= 10000 || ($movie->rating_avg ?? 0) >= 8.5,
            'ratingAvg' => (float) ($movie->rating_avg ?? 0),
            'genres' => $movie->relationLoaded('genres')
                ? $movie->genres->pluck('name')->values()->all()
                : [],
        ];
    }
}
