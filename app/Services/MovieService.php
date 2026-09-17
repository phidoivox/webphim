<?php

namespace App\Services;

use App\Http\Resources\Api\V1\MovieDetailResource;
use App\Http\Resources\Api\V1\MovieSummaryResource;
use App\Http\Resources\Api\V1\PersonSearchResource;
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
    public function filterMovies(array $filters, int $perPage = 24, ?int $page = null): LengthAwarePaginator
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
            $query->ofType((string) $filters['type']);
        }

        if (! empty($filters['genre'])) {
            $query->ofGenre((string) $filters['genre']);
        }

        if (! empty($filters['country'])) {
            $query->ofCountry((string) $filters['country']);
        }

        if (! empty($filters['lang'])) {
            $query->ofLang((string) $filters['lang']);
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

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Lấy danh sách phim phân trang kèm bộ lọc đã transform chuẩn REST DTO và cache SWR Redis.
     *
     * @param  array<string, mixed>  $filters
     * @return array{data: array<int, mixed>, meta: array<string, mixed>}
     */
    public function getFilteredMoviesPayload(array $filters, int $perPage = 24, int $page = 1): array
    {
        ksort($filters);
        $cacheKey = 'movies:filter:'.md5(json_encode($filters).":per_page:{$perPage}:page:{$page}");

        return Cache::tags(['movies', 'movies_filter'])->flexible($cacheKey, [180, 600], function () use ($filters, $perPage, $page) {
            $paginator = $this->filterMovies($filters, $perPage, $page);

            return [
                'data' => MovieSummaryResource::collection($paginator->items())->resolve(),
                'meta' => [
                    'currentPage' => $paginator->currentPage(),
                    'lastPage' => $paginator->lastPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'hasMore' => $paginator->hasMorePages(),
                ],
            ];
        });
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

        $moviesQuery->where(function ($q) use ($keyword, $escaped, $isFulltext) {
            if ($isFulltext && mb_strlen($keyword) >= 3) {
                $q->whereFullText(['name', 'origin_name'], $keyword)
                    ->orWhere('name', 'like', "%{$escaped}%")
                    ->orWhere('origin_name', 'like', "%{$escaped}%");
            } else {
                $q->where('name', 'like', "%{$escaped}%")
                    ->orWhere('origin_name', 'like', "%{$escaped}%");
            }
        });

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
                    ->orderByDesc('view_count');
            }])
            ->limit($limit)
            ->get();

        return [
            'movies' => $movies,
            'actors' => $actors,
        ];
    }

    /**
     * Lấy kết quả tìm kiếm đã transform và cache SWR Redis.
     *
     * @return array{movies: array<int, mixed>, actors: array<int, mixed>}
     */
    public function getSearchAllPayload(string $keyword, int $limit = 5): array
    {
        $keyword = trim($keyword);
        if (empty($keyword)) {
            return [
                'movies' => [],
                'actors' => [],
            ];
        }

        $cacheKey = 'movies:search:'.md5(mb_strtolower($keyword).":limit:{$limit}");

        return Cache::tags(['movies', 'movies_search'])->flexible($cacheKey, [180, 600], function () use ($keyword, $limit) {
            $result = $this->searchAll($keyword, $limit);

            return [
                'movies' => MovieSummaryResource::collection($result['movies'])->resolve(),
                'actors' => PersonSearchResource::collection($result['actors'])->resolve(),
            ];
        });
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
     * Lấy dữ liệu chi tiết một bộ phim theo slug đã transform chuẩn DTO (SWR via Cache::flexible kết hợp Redis Tags).
     *
     * @return array<string, mixed>
     *
     * @throws ModelNotFoundException
     */
    public function getMovieDetailPayload(string $slug): array
    {
        return Cache::tags(['movies', "movie:{$slug}"])->flexible("movie:{$slug}", [300, 600], function () use ($slug) {
            $movie = $this->fetchMovieDetailQuery($slug);
            $similar = $this->getSimilarMovies($movie);

            return (new MovieDetailResource($movie, $similar))->resolve();
        });
    }

    /**
     * Lấy model Movie chi tiết (dùng khi cần truy cập Eloquent instance trực tiếp).
     *
     * @throws ModelNotFoundException
     */
    public function getMovieDetail(string $slug): Movie
    {
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
     * Tăng lượt xem phim theo model instance.
     */
    public function incrementViewCount(Movie $movie): void
    {
        $movie->increment('view_count');
    }

    /**
     * Tăng lượt xem phim theo slug (chạy ngầm sau response).
     */
    public function incrementViewCountBySlug(string $slug): void
    {
        Movie::query()->where('slug', $slug)->increment('view_count');
    }
}
