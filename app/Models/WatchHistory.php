<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WatchHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'movie_id',
        'episode_id',
        'server_id',
        'progress_seconds',
        'duration_seconds',
        'is_completed',
        'watched_at',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'watched_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(EpisodeServer::class, 'server_id');
    }
}
