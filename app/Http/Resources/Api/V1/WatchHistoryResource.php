<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WatchHistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $duration = $this->duration_seconds ?? 0;
        $progress = $this->progress_seconds ?? 0;
        $percent = ($duration > 0) ? min(100, round(($progress / $duration) * 100, 1)) : 0;

        return [
            'id' => $this->id,
            'movieId' => $this->movie_id,
            'episodeId' => $this->episode_id,
            'serverId' => $this->server_id,
            'progressSeconds' => $progress,
            'durationSeconds' => $duration > 0 ? $duration : null,
            'progressPercent' => $percent,
            'isCompleted' => (bool) $this->is_completed,
            'watchedAt' => $this->watched_at?->toIso8601String() ?? $this->updated_at?->toIso8601String(),
            'movie' => $this->whenLoaded('movie', function () {
                return [
                    'id' => $this->movie->id,
                    'name' => $this->movie->name,
                    'originName' => $this->movie->origin_name,
                    'slug' => $this->movie->slug,
                    'thumbUrl' => $this->movie->thumb_url,
                    'posterUrl' => $this->movie->poster_url,
                    'quality' => $this->movie->quality,
                    'year' => $this->movie->year,
                    'type' => $this->movie->type,
                    'episodeCurrent' => $this->movie->episode_current,
                    'episodeTotal' => $this->movie->episode_total,
                ];
            }),
            'episode' => $this->whenLoaded('episode', function () {
                if (! $this->episode) {
                    return null;
                }

                return [
                    'id' => $this->episode->id,
                    'name' => $this->episode->name,
                    'slug' => $this->episode->slug,
                    'serverName' => $this->server?->server_name ?? $this->server?->name,
                ];
            }),
        ];
    }
}
