<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Collection
 */
class CollectionSummaryResource extends JsonResource
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
            'movies' => MovieSummaryResource::collection($this->whenLoaded('movies')),
        ];
    }
}
