<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Episode extends Model
{
    use HasFactory;

    protected $fillable = [
        'movie_id',
        'name',
        'slug',
        'sort_order',
    ];

    /**
     * Tự động cập nhật timestamp cho Movie cha khi có thay đổi trên Episode
     * nhằm kích hoạt MovieObserver xóa cache và revalidate Next.js.
     *
     * @var array<int, string>
     */
    protected $touches = ['movie'];

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    public function servers(): HasMany
    {
        return $this->hasMany(EpisodeServer::class)->orderBy('sort_order');
    }
}
