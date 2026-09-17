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

    protected static function booted(): void
    {
        // Khi tạo mới: nếu chưa có schedule_days mà có notify_schedule text thì parse tự động.
        // Khi cập nhật: chỉ tự động parse nếu notify_schedule thực sự thay đổi (isDirty).
        static::saving(function (Movie $movie) {
            if (! empty($movie->schedule_days) || empty($movie->notify_schedule)) {
                return;
            }

            if ($movie->exists && ! $movie->isDirty('notify_schedule')) {
                return;
            }

            $parsed = self::parseScheduleDays($movie->notify_schedule);
            if (! empty($parsed)) {
                $movie->schedule_days = $parsed;
            }
        });
    }

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
        'schedule_days',
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
            'schedule_days' => 'array',
            'imdb_rating' => 'float',
            'tmdb_rating' => 'float',
            'rating_avg' => 'float',
            'last_synced_at' => 'datetime',
        ];
    }

    /**
     * Tự động phân giải Model qua Route Binding hỗ trợ cả numeric ID lẫn slug.
     *
     * @param  Builder  $query
     * @param  mixed  $value
     * @param  string|null  $field
     * @return Builder
     */
    public function resolveRouteBindingQuery($query, $value, $field = null)
    {
        if ($field) {
            return $query->where($field, $value);
        }

        // Hỗ trợ cả slug và ID (cho API endpoints nhận movie_id hoặc movie_slug)
        // Nếu $value chỉ toàn số thì ưu tiên id trước, hoặc match slug nếu slug trùng số
        if (ctype_digit((string) $value)) {
            return $query->where(function ($q) use ($value) {
                $q->where('id', (int) $value)
                    ->orWhere('slug', (string) $value);
            });
        }

        return $query->where('slug', (string) $value);
    }

    /**
     * Scope query lấy các phim có lịch chiếu (schedule_days không rỗng).
     */
    public function scopeHasSchedule(Builder $query): Builder
    {
        return $query->whereNotNull('schedule_days')->whereJsonLength('schedule_days', '>', 0);
    }

    /**
     * Scope query lọc phim chiếu vào ngày cụ thể (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7).
     */
    public function scopeOnDay(Builder $query, int $day): Builder
    {
        return $query->whereJsonContains('schedule_days', $day);
    }

    /**
     * Chuyển đổi chuỗi text mô tả lịch chiếu sang mảng ngày trong tuần.
     * Hỗ trợ nhiều ngày: "Thứ 3, Thứ 6" → [2, 5].
     *
     * @return int[]
     */
    public static function parseScheduleDays(?string $text): array
    {
        if (! $text) {
            return [];
        }

        $lower = mb_strtolower($text, 'UTF-8');
        $days = [];

        if (str_contains($lower, 'chủ nhật') || str_contains($lower, 'chu nhat')) {
            $days[] = 0;
        }
        if (preg_match('/(^|[^a-zà-ỹ])cn([^a-zà-ỹ]|$)/u', $lower)) {
            $days[] = 0;
        }

        // Match "thứ N" / "thu N" patterns — có thể nhiều lần
        if (preg_match_all('/(?:thứ|thu)\s*(\d)/u', $lower, $matches)) {
            foreach ($matches[1] as $n) {
                $n = (int) $n;
                if ($n >= 2 && $n <= 7) {
                    $days[] = $n === 7 ? 6 : $n - 1;
                }
            }
        }

        // Named days
        if (str_contains($lower, 'thứ hai') || str_contains($lower, 'thu hai')) {
            $days[] = 1;
        }
        if (str_contains($lower, 'thứ ba') || str_contains($lower, 'thu ba')) {
            $days[] = 2;
        }
        if (str_contains($lower, 'thứ tư') || str_contains($lower, 'thứ bốn') || str_contains($lower, 'thu tu')) {
            $days[] = 3;
        }
        if (str_contains($lower, 'thứ năm') || str_contains($lower, 'thu nam')) {
            $days[] = 4;
        }
        if (str_contains($lower, 'thứ sáu') || str_contains($lower, 'thu sau')) {
            $days[] = 5;
        }
        if (str_contains($lower, 'thứ bảy') || str_contains($lower, 'thu bay')) {
            $days[] = 6;
        }

        return array_values(array_unique($days));
    }

    /**
     * Backward-compat: parse text sang 1 ngày duy nhất (trả phần tử đầu hoặc null).
     */
    public static function parseScheduleDay(?string $text): ?int
    {
        $days = self::parseScheduleDays($text);

        return $days[0] ?? null;
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
     * Scope query lọc phim theo loại (series, single, tv-show, anime...).
     */
    public function scopeOfType(Builder $query, MovieType|string $type): Builder
    {
        $typeValue = $type instanceof MovieType ? $type->value : (string) $type;

        if ($typeValue === 'tv-shows' || $typeValue === 'tv-show') {
            return $query->where(function ($q) {
                $q->where('type', 'tv-show')
                    ->orWhere('type', 'tv-shows')
                    ->orWhereHas('genres', fn ($gq) => $gq->where('slug', 'tv-shows'));
            });
        }

        if ($typeValue === 'hoat-hinh' || $typeValue === 'anime') {
            return $query->where(function ($q) {
                $q->where('type', 'hoat-hinh')
                    ->orWhere('type', 'anime')
                    ->orWhereHas('genres', fn ($gq) => $gq->whereIn('slug', ['hoat-hinh', 'anime']));
            });
        }

        return $query->where('type', $typeValue);
    }

    /**
     * Scope query lọc phim theo slug thể loại.
     */
    public function scopeOfGenre(Builder $query, string $genreSlug): Builder
    {
        return $query->whereHas('genres', fn (Builder $q) => $q->where('genres.slug', $genreSlug));
    }

    /**
     * Scope query lọc phim theo slug quốc gia.
     */
    public function scopeOfCountry(Builder $query, string $countrySlug): Builder
    {
        return $query->whereHas('countries', fn (Builder $q) => $q->where('countries.slug', $countrySlug));
    }

    /**
     * Scope query lọc phim theo ngôn ngữ / phụ đề.
     */
    public function scopeOfLang(Builder $query, string $lang): Builder
    {
        $escaped = str_replace(['%', '_'], ['\\%', '\\_'], trim($lang));

        return $query->where(function ($q) use ($escaped, $lang) {
            $q->where('lang', 'like', "%{$escaped}%")
                ->orWhereHas('episodes.servers', fn ($sq) => $sq->where('lang_type', $lang));
        });
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
