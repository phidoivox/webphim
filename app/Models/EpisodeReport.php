<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EpisodeReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'episode_id',
        'server_id',
        'report_type',
        'description',
        'status',
        'resolved_by',
        'resolved_at',
        'admin_note',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(EpisodeServer::class, 'server_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
