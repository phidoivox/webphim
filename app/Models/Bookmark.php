<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bookmark extends Model
{
    use HasFactory;

    public const TYPE_FAVORITE = 'favorite';
    public const TYPE_WATCHLATER = 'watchlater';

    protected $fillable = [
        'user_id',
        'movie_id',
        'type',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'movie_id' => 'integer',
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
}
