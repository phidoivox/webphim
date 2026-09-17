<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Genre;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Genre
 */
class GenreResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Genre $genre */
        $genre = $this->resource;

        return [
            'id' => $genre->id,
            'name' => $genre->name,
            'slug' => $genre->slug,
            'moviesCount' => (int) ($genre->movies_count ?? 0),
        ];
    }
}
