<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Person;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Person
 */
class PersonSearchResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Person $person */
        $person = $this->resource;

        $knownFor = '';
        if ($person->relationLoaded('movies') && $person->movies->isNotEmpty()) {
            $knownFor = $person->movies->take(2)->pluck('name')->filter()->implode(', ');
        }

        return [
            'id' => $person->id,
            'slug' => $person->slug,
            'name' => $person->name,
            'avatarUrl' => $person->avatar_url,
            'role' => 'Diễn viên',
            'knownFor' => $knownFor,
        ];
    }
}
