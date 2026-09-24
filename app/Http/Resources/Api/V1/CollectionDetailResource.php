<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Collection
 */
class CollectionDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Collection $collection */
        $collection = $this->resource;

        return [
            'id' => $collection->id,
            'name' => $collection->name,
            'slug' => $collection->slug,
            'description' => $collection->description,
            'thumbUrl' => $collection->thumb_url,
            'isPublic' => (bool) $collection->is_public,
            'moviesCount' => $collection->movies_count ?? $collection->movies()->count(),
            'createdAt' => $collection->created_at?->toIso8601String(),
            'updatedAt' => $collection->updated_at?->toIso8601String(),
            'creator' => $this->whenLoaded('creator', function () use ($collection) {
                if (! $collection->creator) {
                    return null;
                }

                return [
                    'id' => $collection->creator->id,
                    'name' => $collection->creator->name,
                    'avatarUrl' => $collection->creator->avatar_url,
                ];
            }),
            'movies' => MovieSummaryResource::collection($this->whenLoaded('movies')),
        ];
    }
}
