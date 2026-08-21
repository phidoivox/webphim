<?php

namespace App\Services;

use App\Models\Movie;
use App\Models\Person;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MovieService
{
    /**
     * Lọc danh sách phim phân trang theo nhiều tiêu chí.
     *
     * @param  array<string, mixed>  $filters
     */
    public function filterMovies(array $filters, int $perPage = 24): LengthAwarePaginator
    {
        $query = Movie::query()
            ->active()
            ->with(['genres:id,name,slug']);

        if (! empty($filters['q'])) {
            $keyword = trim((string) $filters['q']);
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $keyword);
            $driver = DB::connection()->getDriverName();
            $isFulltext = in_array($driver, ['mysql', 'mariadb']);

            if ($isFulltext && mb_strlen($keyword) >= 3) {
                $query->where(function ($q) use ($keyword, $escaped) {
                    $q->whereFullText(['name', 'origin_name'], $keyword)
                        ->orWhere('name', 'like', "%{$escaped}%")
                        ->orWhere('origin_name', 'like', "%{$escaped}%");
                });
            } else {
                $query->where(function ($q) use ($escaped) {
                    $q->where('name', 'like', "%{$escaped}%")
                        ->orWhere('origin_name', 'like', "%{$escaped}%");
                });
            }
        }

        if (! empty($filters['type'])) {
            $type = (string) $filters['type'];
            if ($type === 'tv-shows' || $type === 'tv-show') {
                $query->where(function ($q) {
                    $q->where('type', 'tv-show')
                        ->orWhere('type', 'tv-shows')
                        ->orWhereHas('genres', fn ($gq) => $gq->where('slug', 'tv-shows'));
                });
            } elseif ($type === 'hoat-hinh' || $type === 'anime') {
                $query->where(function ($q) {
                    $q->where('type', 'hoat-hinh')
                        ->orWhere('type', 'anime')
                        ->orWhereHas('genres', fn ($gq) => $gq->whereIn('slug', ['hoat-hinh', 'anime']));
                });
            } else {
                $query->ofType($type);
            }
        }

        if (! empty($filters['genre'])) {
            $query->whereHas('genres', function ($q) use ($filters) {
                $q->where('slug', $filters['genre']);
            });
        }

        if (! empty($filters['country'])) {
            $query->whereHas('countries', function ($q) use ($filters) {
                $q->where('slug', $filters['country']);
            });
        }

        if (! empty($filters['lang'])) {
            $lang = $filters['lang'];
            $query->where(function ($q) use ($lang) {
                $q->where('lang', 'like', "%{$lang}%")
                    ->orWhereHas('episodes.servers', function ($sq) use ($lang) {
                        $sq->where('lang_type', $lang);
                    });
            });
        }

        if (! empty($filters['year'])) {
            $query->where('year', (int) $filters['year']);
        }

        $sort = $filters['sort'] ?? 'latest';
        match ($sort) {
            'views' => $query->orderByDesc('view_count'),
            'rating' => $query->orderByDesc('rating_avg'),
            'year' => $query->orderByDesc('year'),
            'updated' => $query->orderByDesc('updated_at'),
            default => $query->orderByDesc('created_at'),
        };

        return $query->paginate($perPage);
    }

    /**
     * Tìm kiếm phim và diễn viên theo từ khóa.
     *
     * @return array{movies: Collection<int, Movie>, actors: Collection<int, Person>}
     */
    public function searchAll(string $keyword, int $limit = 5): array
    {
        $keyword = trim($keyword);
        if (empty($keyword)) {
            return [
                'movies' => collect(),
                'actors' => collect(),
            ];
        }

        $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $keyword);
        $driver = DB::connection()->getDriverName();
        $isFulltext = in_array($driver, ['mysql', 'mariadb']);

        $moviesQuery = Movie::query()->active();

        if ($isFulltext && mb_strlen($keyword) >= 3) {
            $moviesQuery->where(function ($q) use ($keyword, $escaped) {
                $q->whereFullText(['name', 'origin_name'], $keyword)
                    ->orWhere('name', 'like', "%{$escaped}%")
                    ->orWhere('origin_name', 'like', "%{$escaped}%");
            });
        } else {
            $moviesQuery->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                    ->orWhere('origin_name', 'like', "%{$escaped}%");
            });
        }

        $movies = $moviesQuery
            ->with(['genres:id,name,slug'])
            ->orderByDesc('view_count')
            ->limit($limit)
            ->get();

        $actors = Person::query()
            ->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                    ->orWhere('other_names', 'like', "%{$escaped}%");
            })
            ->with(['movies' => function ($mq) {
                $mq->select('movies.id', 'movies.name', 'movies.slug')
                    ->where('movies.is_active', true)
                    ->orderByDesc('view_count')
                    ->limit(5);
            }])
            ->limit($limit)
            ->get();

        return [
            'movies' => $movies,
            'actors' => $actors,
        ];
    }

    /**
     * Tìm kiếm phim theo từ khóa (dành cho API tương thích).
     *
     * @return Collection<int, Movie>
     */
    public function searchMovies(string $keyword, int $limit = 10): Collection
    {
        $result = $this->searchAll($keyword, $limit);

        return $result['movies'];
    }

    /**
     * Lấy thông tin chi tiết một bộ phim theo slug (SWR via Cache::flexible với fallback an toàn).
     *
     * @throws ModelNotFoundException
     */
    public function getMovieDetail(string $slug): Movie
    {
        try {
            $cached = Cache::flexible("movie:{$slug}", [300, 600], fn () => $this->fetchMovieDetailQuery($slug));

            if ($cached instanceof Movie) {
                return $cached;
            }
        } catch (\Throwable) {
            // Bỏ qua lỗi deserialize từ cache (ví dụ __PHP_Incomplete_Class) và load trực tiếp từ DB
        }

        Cache::forget("movie:{$slug}");

        return $this->fetchMovieDetailQuery($slug);
    }

    /**
     * Query chi tiết phim cùng các quan hệ liên quan từ cơ sở dữ liệu.
     */
    public function fetchMovieDetailQuery(string $slug): Movie
    {
        return Movie::query()
            ->where('slug', $slug)
            ->active()
            ->with([
                'genres:id,name,slug',
                'countries:id,name,slug',
                'tags:id,name,slug',
                'episodes.servers',
                'directors',
                'actors',
                'galleries',
            ])
            ->firstOrFail();
    }

    /**
     * Lấy danh sách phim tương tự.
     *
     * @return Collection<int, Movie>
     */
    public function getSimilarMovies(Movie $movie, int $limit = 10): Collection
    {
        return Movie::query()
            ->similarTo($movie, $limit)
            ->get();
    }

    /**
     * Tăng lượt xem phim.
     */
    public function incrementViewCount(Movie $movie): void
    {
        $movie->increment('view_count');
    }
}
