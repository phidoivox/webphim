<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Episode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Episode
 */
class AdminEpisodeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Episode $episode */
        $episode = $this->resource;

        return [
            'id' => $episode->id,
            'movieId' => $episode->movie_id,
            'name' => $episode->name,
            'slug' => $episode->slug,
            'sortOrder' => (int) ($episode->sort_order ?? 0),
            'servers' => $episode->relationLoaded('servers')
                ? $episode->servers->map(fn ($s) => [
                    'id' => $s->id,
                    'serverName' => $s->server_name,
                    'langType' => $s->lang_type instanceof \BackedEnum ? $s->lang_type->value : $s->lang_type,
                    'linkM3u8' => $s->link_m3u8,
                    'linkEmbed' => $s->link_embed,
                    'sortOrder' => (int) ($s->sort_order ?? 0),
                    'isActive' => (bool) ($s->is_active ?? true),
                ])->values()->all()
                : [],
        ];
    }
}
