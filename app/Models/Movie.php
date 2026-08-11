<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Movie extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'name',
        'origin_name',
        'slug',
        'content',
        'type',
        'status',
        'quality',
        'lang',
        'age_rating',
        'is_cinema',
        'thumb_url',
        'poster_url',
        'trailer_url',
        'duration',
        'duration_minutes',
        'episode_current',
        'episode_total',
        'episode_current_num',
        'episode_total_num',
        'notify_schedule',
        'year',
        'imdb_rating',
        'tmdb_rating',
        'rating_avg',
        'rating_count',
        'view_count',
        'comment_count',
        'is_featured',
        'is_active',
        'tmdb_id',
        'imdb_id',
        'source_url',
        'last_synced_at',
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    protected function casts(): array
    {
        return [
            'is_cinema' => 'boolean',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'imdb_rating' => 'float',
            'tmdb_rating' => 'float',
            'rating_avg' => 'float',
            'last_synced_at' => 'datetime',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Movie::class, 'parent_id');
    }

    public function seasons(): HasMany
    {
        return $this->hasMany(Movie::class, 'parent_id');
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'movie_genre');
    }

    public function countries(): BelongsToMany
    {
        return $this->belongsToMany(Country::class, 'movie_country');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'movie_tag');
    }

    public function people(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'movie_person')
                    ->withPivot(['role', 'character_name', 'sort_order']);
    }

    public function actors(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'movie_person')
                    ->wherePivot('role', 'actor')
                    ->withPivot(['character_name', 'sort_order']);
    }

    public function directors(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'movie_person')
                    ->wherePivot('role', 'director')
                    ->withPivot(['character_name', 'sort_order']);
    }

    public function episodes(): HasMany
    {
        return $this->hasMany(Episode::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    public function watchHistories(): HasMany
    {
        return $this->hasMany(WatchHistory::class);
    }

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class, 'collection_movie');
    }
}
