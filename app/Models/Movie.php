<?php

namespace App\Models;

use App\Enums\MovieQuality;
use App\Enums\MovieStatus;
use App\Enums\MovieType;
use Illuminate\Database\Eloquent\Builder;
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
        'schedule_day_of_week',
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
            'type' => MovieType::class,
            'status' => MovieStatus::class,
            'quality' => MovieQuality::class,
            'is_cinema' => 'boolean',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'schedule_day_of_week' => 'integer',
            'imdb_rating' => 'float',
            'tmdb_rating' => 'float',
            'rating_avg' => 'float',
            'last_synced_at' => 'datetime',
        ];
    }

    /**
     * Scope query lấy các phim có lịch chiếu theo ngày trong tuần.
     */
    public function scopeHasSchedule(Builder $query): Builder
    {
        return $query->whereNotNull('schedule_day_of_week');
    }

    /**
     * Scope query lọc phim theo ngày chiếu cụ thể (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7).
     */
    public function scopeOnDay(Builder $query, int $day): Builder
    {
        return $query->where('schedule_day_of_week', $day);
    }

    /**
     * Chuyển đổi chuỗi text mô tả lịch chiếu sang số ngày trong tuần.
     */
    public static function parseScheduleDay(?string $text): ?int
    {
        if (! $text) {
            return null;
        }

        $lower = mb_strtolower($text, 'UTF-8');

        if (str_contains($lower, 'chủ nhật') || str_contains($lower, 'chu nhat') || str_contains($lower, 'cn')) {
            return 0;
        }
        if (str_contains($lower, 'thứ 2') || str_contains($lower, 'thứ hai') || str_contains($lower, 'thu 2') || str_contains($lower, 'thu hai')) {
            return 1;
        }
        if (str_contains($lower, 'thứ 3') || str_contains($lower, 'thứ ba') || str_contains($lower, 'thu 3') || str_contains($lower, 'thu ba')) {
            return 2;
        }
        if (str_contains($lower, 'thứ 4') || str_contains($lower, 'thứ tư') || str_contains($lower, 'thứ bốn') || str_contains($lower, 'thu 4') || str_contains($lower, 'thu tu')) {
            return 3;
        }
        if (str_contains($lower, 'thứ 5') || str_contains($lower, 'thứ năm') || str_contains($lower, 'thu 5') || str_contains($lower, 'thu nam')) {
            return 4;
        }
        if (str_contains($lower, 'thứ 6') || str_contains($lower, 'thứ sáu') || str_contains($lower, 'thu 6') || str_contains($lower, 'thu sau')) {
            return 5;
        }
        if (str_contains($lower, 'thứ 7') || str_contains($lower, 'thứ bảy') || str_contains($lower, 'thu 7') || str_contains($lower, 'thu bay')) {
            return 6;
        }

        return null;
    }

    /**
     * Scope query lấy các phim đang hoạt động và chưa bị xóa mềm.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->withoutTrashed();
    }

    /**
     * Scope query lấy các phim nổi bật.
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope query lọc phim theo loại (series, single, tv-show).
     */
    public function scopeOfType(Builder $query, MovieType|string $type): Builder
    {
        $typeValue = $type instanceof MovieType ? $type->value : $type;

        return $query->where('type', $typeValue);
    }

    /**
     * Scope query lấy danh sách phim tương tự dựa theo thể loại (genres).
     */
    public function scopeSimilarTo(Builder $query, Movie $movie, int $limit = 10): Builder
    {
        $genreIds = $movie->genres->pluck('id')->filter();

        return $query->whereKeyNot($movie->id)
            ->active()
            ->when($genreIds->isNotEmpty(), function (Builder $q) use ($genreIds) {
                $q->whereHas('genres', fn (Builder $gq) => $gq->whereIn('genres.id', $genreIds));
            })
            ->with('genres')
            ->orderByDesc('rating_avg')
            ->limit($limit);
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
        return $this->hasMany(Episode::class)->orderBy('sort_order');
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

    public function galleries(): HasMany
    {
        return $this->hasMany(MovieGallery::class)->orderBy('sort_order');
    }
}
