<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HomeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $heroMovies = collect($this->resource['heroMovies'] ?? [])
            ->map(function ($m) {
                if ($m instanceof Movie) {
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
                        'quality' => $m->quality,
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
                }

                if (is_array($m)) {
                    return $m;
                }

                return (array) $m;
            })
            ->values()
            ->all();

        $sections = collect($this->resource['sections'] ?? [])
            ->map(function (array $section) {
                $movies = $section['movies'];
                $resolvedMovies = is_array($movies) && isset($movies[0]) && is_array($movies[0])
                    ? $movies
                    : MovieSummaryResource::collection($movies)->resolve();

                return [
                    'id' => $section['id'],
                    'title' => $section['title'],
                    'movies' => $resolvedMovies,
                ];
            })
            ->values()
            ->all();

        return [
            'heroMovies' => $heroMovies,
            'sections' => $sections,
        ];
    }
}
