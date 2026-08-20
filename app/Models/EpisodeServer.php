<?php

namespace App\Models;

use App\Enums\ServerLangType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EpisodeServer extends Model
{
    use HasFactory;

    protected $fillable = [
        'episode_id',
        'server_name',
        'lang_type',
        'link_embed',
        'link_m3u8',
        'subtitles',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'lang_type' => ServerLangType::class,
            'subtitles' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }
}
