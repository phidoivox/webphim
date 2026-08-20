<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Bookmark;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Bookmark
 */
class BookmarkResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Bookmark $bookmark */
        $bookmark = $this->resource;

        return [
            'id' => $bookmark->id,
            'userId' => $bookmark->user_id,
            'movieId' => $bookmark->movie_id,
            'type' => $bookmark->type,
            'createdAt' => $bookmark->created_at?->toIso8601String(),
            'updatedAt' => $bookmark->updated_at?->toIso8601String(),
            'movie' => $this->whenLoaded('movie', function () use ($bookmark) {
                return new MovieSummaryResource($bookmark->movie);
            }),
        ];
    }
}
