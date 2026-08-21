<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_HIDDEN = 'hidden';

    public const STATUS_SPAM = 'spam';

    protected $fillable = [
        'user_id',
        'movie_id',
        'parent_id',
        'content',
        'likes_count',
        'replies_count',
        'is_pinned',
        'is_spoiler',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'is_spoiler' => 'boolean',
            'likes_count' => 'integer',
            'replies_count' => 'integer',
        ];
    }

    /**
     * Scope lấy các bình luận gốc (không phải câu trả lời)
     */
    public function scopeRoot(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope lấy các bình luận đang hiển thị (active)
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope lấy bình luận đã ghim
     */
    public function scopePinned(Builder $query): Builder
    {
        return $query->where('is_pinned', true);
    }

    /**
     * Scope lấy bình luận theo phim
     */
    public function scopeForMovie(Builder $query, int $movieId): Builder
    {
        return $query->where('movie_id', $movieId);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id')->orderBy('created_at', 'asc');
    }

    public function likedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'comment_likes')->withPivot('created_at');
    }

    /**
     * Kiểm tra user hiện tại đã like bình luận này chưa
     */
    public function isLikedBy(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $this->likedUsers()->where('users.id', $user->id)->exists();
    }
}
