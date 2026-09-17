<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ServerLangType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdminBulkActionRequest;
use App\Http\Requests\Api\V1\Admin\StoreMovieRequest;
use App\Http\Requests\Api\V1\Admin\UpdateMovieRequest;
use App\Http\Resources\Api\V1\Admin\AdminMovieDetailResource;
use App\Http\Resources\Api\V1\Admin\AdminMovieListResource;
use App\Models\AuditLog;
use App\Models\Episode;
use App\Models\Movie;
use App\Models\Person;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminMovieController extends Controller
{
    /**
     * Danh sách phim quản trị (hỗ trợ tìm kiếm, lọc, phân trang).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Movie::query()->with(['genres:id,name', 'countries:id,name']);

        if ($request->filled('q')) {
            $keyword = trim((string) $request->input('q'));
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $keyword);
            $query->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                    ->orWhere('origin_name', 'like', "%{$escaped}%")
                    ->orWhere('slug', 'like', "%{$escaped}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('quality')) {
            $query->where('quality', $request->input('quality'));
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('is_featured') && $request->input('is_featured') !== '') {
            $query->where('is_featured', filter_var($request->input('is_featured'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('is_cinema') && $request->input('is_cinema') !== '') {
            $query->where('is_cinema', filter_var($request->input('is_cinema'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('genre_id')) {
            $query->whereHas('genres', fn ($gq) => $gq->where('genres.id', $request->input('genre_id')));
        }

        $sort = (string) $request->input('sort', 'created_at');
        $order = strtolower((string) $request->input('order', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (in_array($sort, ['id', 'name', 'year', 'view_count', 'rating_avg', 'created_at', 'updated_at'], true)) {
            $query->orderBy($sort, $order);
        } else {
            $query->orderByDesc('created_at');
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $paginator = $query->paginate($perPage);

        $counts = Movie::query()
            ->selectRaw('count(*) as total, sum(case when is_active = 1 then 1 else 0 end) as active, sum(case when type = "series" then 1 else 0 end) as series, sum(case when type = "single" then 1 else 0 end) as single, sum(case when is_featured = 1 then 1 else 0 end) as featured, sum(case when is_cinema = 1 then 1 else 0 end) as cinema, sum(case when is_active = 0 then 1 else 0 end) as hidden')
            ->first();

        return response()->paginated($paginator, AdminMovieListResource::class, [
            'counts' => [
                'total' => (int) ($counts->total ?? 0),
                'active' => (int) ($counts->active ?? 0),
                'series' => (int) ($counts->series ?? 0),
                'single' => (int) ($counts->single ?? 0),
                'featured' => (int) ($counts->featured ?? 0),
                'cinema' => (int) ($counts->cinema ?? 0),
                'hidden' => (int) ($counts->hidden ?? 0),
            ],
        ]);
    }

    /**
     * Tạo mới một bộ phim.
     */
    public function store(StoreMovieRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['name']);
            $existingSlugs = Movie::query()
                ->where('slug', $baseSlug)
                ->orWhere('slug', 'like', "{$baseSlug}-%")
                ->pluck('slug')
                ->all();

            if (in_array($baseSlug, $existingSlugs, true)) {
                $counter = 1;
                while (in_array("{$baseSlug}-{$counter}", $existingSlugs, true)) {
                    $counter++;
                }
                $baseSlug = "{$baseSlug}-{$counter}";
            }
            $validated['slug'] = $baseSlug;
        }

        $movie = DB::transaction(function () use ($validated) {
            $genreIds = $validated['genre_ids'] ?? [];
            $countryIds = $validated['country_ids'] ?? [];
            $tagIds = $validated['tag_ids'] ?? [];
            $tags = $validated['tags'] ?? null;
            $actors = $validated['actors'] ?? [];
            $directors = $validated['directors'] ?? [];
            $galleries = $validated['galleries'] ?? [];
            $episodes = $validated['episodes'] ?? [];

            unset($validated['genre_ids'], $validated['country_ids'], $validated['tag_ids'], $validated['tags'], $validated['actors'], $validated['directors'], $validated['galleries'], $validated['episodes']);

            $movie = Movie::query()->create($validated);

            if (! empty($genreIds)) {
                $movie->genres()->sync($genreIds);
            }
            if (! empty($countryIds)) {
                $movie->countries()->sync($countryIds);
            }
            $this->syncTags($movie, $tags ?? $tagIds);

            $this->syncPeople($movie, $actors, $directors);

            if (! empty($galleries)) {
                $galleryRows = [];
                foreach ($galleries as $idx => $g) {
                    if (! empty($g['url'])) {
                        $galleryRows[] = [
                            'media_type' => $g['media_type'] ?? 'image',
                            'type' => $g['type'] ?? 'still',
                            'url' => $g['url'],
                            'thumb_url' => $g['thumb_url'] ?? null,
                            'caption' => $g['caption'] ?? null,
                            'sort_order' => $g['sort_order'] ?? ($idx + 1),
                        ];
                    }
                }
                if (! empty($galleryRows)) {
                    $movie->galleries()->createMany($galleryRows);
                }
            }

            if (! empty($episodes)) {
                $this->syncEpisodes($movie, $episodes);
            }

            return $movie;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Tạo phim mới thành công.',
            'data' => [
                'id' => $movie->id,
                'slug' => $movie->slug,
                'name' => $movie->name,
            ],
        ], 201);
    }

    /**
     * Chi tiết phim kèm đầy đủ quan hệ để phục vụ form sửa.
     */
    public function show(int $id): JsonResponse
    {
        $movie = Movie::query()
            ->with([
                'genres',
                'countries',
                'tags',
                'actors',
                'directors',
                'episodes.servers',
                'galleries',
            ])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => new AdminMovieDetailResource($movie),
        ]);
    }

    /**
     * Cập nhật thông tin phim.
     */
    public function update(UpdateMovieRequest $request, int $id): JsonResponse
    {
        $movie = Movie::query()->findOrFail($id);
        $validated = $request->validated();

        DB::transaction(function () use ($movie, $validated) {
            $genreIds = $validated['genre_ids'] ?? null;
            $countryIds = $validated['country_ids'] ?? null;
            $tagIds = $validated['tag_ids'] ?? null;
            $tags = $validated['tags'] ?? null;
            $actors = $validated['actors'] ?? null;
            $directors = $validated['directors'] ?? null;
            $galleries = $validated['galleries'] ?? null;
            $episodes = $validated['episodes'] ?? null;

            unset($validated['genre_ids'], $validated['country_ids'], $validated['tag_ids'], $validated['tags'], $validated['actors'], $validated['directors'], $validated['galleries'], $validated['episodes']);

            $movie->update($validated);

            if ($genreIds !== null) {
                $movie->genres()->sync($genreIds);
            }
            if ($countryIds !== null) {
                $movie->countries()->sync($countryIds);
            }
            if ($tags !== null || $tagIds !== null) {
                $this->syncTags($movie, $tags ?? $tagIds);
            }

            if ($actors !== null || $directors !== null) {
                $this->syncPeople($movie, $actors, $directors);
            }

            if ($galleries !== null) {
                $movie->galleries()->delete();
                $galleryRows = [];
                foreach ($galleries as $idx => $g) {
                    if (! empty($g['url'])) {
                        $galleryRows[] = [
                            'media_type' => $g['media_type'] ?? 'image',
                            'type' => $g['type'] ?? 'still',
                            'url' => $g['url'],
                            'thumb_url' => $g['thumb_url'] ?? null,
                            'caption' => $g['caption'] ?? null,
                            'sort_order' => $g['sort_order'] ?? ($idx + 1),
                        ];
                    }
                }
                if (! empty($galleryRows)) {
                    $movie->galleries()->createMany($galleryRows);
                }
            }

            if ($episodes !== null && ! empty($episodes)) {
                $this->syncEpisodes($movie, $episodes);
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật phim thành công.',
            'data' => [
                'id' => $movie->id,
                'slug' => $movie->slug,
                'name' => $movie->name,
            ],
        ]);
    }

    /**
     * Xóa một bộ phim.
     */
    public function destroy(int $id): JsonResponse
    {
        $movie = Movie::query()->findOrFail($id);
        $movie->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa phim thành công.',
        ]);
    }

    /**
     * Bật/tắt nhanh trạng thái (is_active, is_featured, is_cinema).
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'field' => ['required', 'string', 'in:is_active,is_featured,is_cinema'],
        ]);

        $movie = Movie::query()->findOrFail($id);
        $field = $request->string('field')->toString();
        $movie->{$field} = ! $movie->{$field};
        $movie->save();

        return response()->json([
            'status' => 'success',
            'message' => "Đã chuyển trạng thái {$field} thành công.",
            'data' => [
                'id' => $movie->id,
                $field => (bool) $movie->{$field},
            ],
        ]);
    }

    /**
     * Thao tác hàng loạt trên danh sách phim (bật/tắt trạng thái hoặc xóa).
     */
    public function bulkAction(AdminBulkActionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $rawAction = $validated['action'];
        $action = match ($rawAction) {
            'activate' => 'is_active_on',
            'deactivate' => 'is_active_off',
            'feature' => 'is_featured_on',
            'unfeature' => 'is_featured_off',
            'cinema' => 'is_cinema_on',
            'uncinema' => 'is_cinema_off',
            default => $rawAction,
        };

        $ids = array_values(array_unique(array_map('intval', $validated['ids'])));

        $affected = DB::transaction(function () use ($action, $ids, $request) {
            $movies = Movie::query()->whereIn('id', $ids)->get();
            $count = 0;

            foreach ($movies as $movie) {
                match ($action) {
                    'is_active_on' => $movie->update(['is_active' => true]),
                    'is_active_off' => $movie->update(['is_active' => false]),
                    'is_featured_on' => $movie->update(['is_featured' => true]),
                    'is_featured_off' => $movie->update(['is_featured' => false]),
                    'is_cinema_on' => $movie->update(['is_cinema' => true]),
                    'is_cinema_off' => $movie->update(['is_cinema' => false]),
                    'delete' => $movie->delete(),
                    default => null,
                };
                $count++;
            }

            try {
                AuditLog::query()->create([
                    'user_id' => $request->user()?->id,
                    'action' => 'bulk_action',
                    'model_type' => Movie::class,
                    'model_id' => null,
                    'changes' => [
                        'action' => $action,
                        'ids' => $ids,
                        'affected' => $count,
                    ],
                    'ip_address' => $request->ip(),
                    'user_agent' => substr((string) $request->userAgent(), 0, 500),
                    'created_at' => now(),
                ]);
            } catch (\Throwable) {
                // Audit log fallback
            }

            return $count;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Đã thực hiện thao tác hàng loạt thành công.',
            'affected' => (int) $affected,
        ]);
    }

    /**
     * Đồng bộ diễn viên và đạo diễn vào bảng movie_person.
     * Tự động tìm hoặc tạo Person nếu chỉ truyền tên (hoặc từ PhimAPI).
     */
    private function syncPeople(Movie $movie, ?array $actors, ?array $directors): void
    {
        $personSync = [];

        if ($actors !== null) {
            foreach ($actors as $idx => $actor) {
                $personId = null;
                $characterName = null;
                $name = null;

                if (is_array($actor)) {
                    $personId = $actor['id'] ?? null;
                    $name = $actor['name'] ?? null;
                    $characterName = $actor['character_name'] ?? ($actor['characterName'] ?? null);
                } elseif (is_string($actor)) {
                    $name = trim($actor);
                }

                if (! $personId && ! empty($name)) {
                    $baseSlug = Str::slug($name);
                    $slug = $baseSlug ?: 'actor-'.time().'-'.$idx;
                    $person = Person::query()->firstOrCreate(
                        ['slug' => $slug],
                        ['name' => $name]
                    );
                    $personId = $person->id;
                }

                if ($personId) {
                    $personSync[$personId] = [
                        'role' => 'actor',
                        'character_name' => $characterName,
                        'sort_order' => $idx + 1,
                    ];
                }
            }
        }

        if ($directors !== null) {
            foreach ($directors as $idx => $dir) {
                $personId = null;
                $name = null;

                if (is_array($dir)) {
                    $personId = $dir['id'] ?? null;
                    $name = $dir['name'] ?? null;
                } elseif (is_string($dir)) {
                    $name = trim($dir);
                }

                if (! $personId && ! empty($name)) {
                    $baseSlug = Str::slug($name);
                    $slug = $baseSlug ?: 'director-'.time().'-'.$idx;
                    $person = Person::query()->firstOrCreate(
                        ['slug' => $slug],
                        ['name' => $name]
                    );
                    $personId = $person->id;
                }

                if ($personId) {
                    $personSync[$personId] = [
                        'role' => 'director',
                        'character_name' => null,
                        'sort_order' => $idx + 1,
                    ];
                }
            }
        }

        if ($actors !== null || $directors !== null) {
            $movie->people()->sync($personSync);
        }
    }

    /**
     * Đồng bộ danh sách thẻ từ khóa (Tags) cho phim.
     *
     * @param  array<int|string|array{id?: int, name?: string}>|null  $tags
     */
    protected function syncTags(Movie $movie, ?array $tags): void
    {
        if ($tags === null) {
            return;
        }

        $tagIds = [];
        foreach ($tags as $tag) {
            $tagId = null;
            $name = null;

            if (is_numeric($tag)) {
                $tagId = (int) $tag;
            } elseif (is_array($tag)) {
                $tagId = $tag['id'] ?? null;
                $name = $tag['name'] ?? null;
            } elseif (is_string($tag)) {
                $name = trim($tag);
            }

            if (! $tagId && ! empty($name)) {
                $baseSlug = Str::slug($name);
                $slug = $baseSlug ?: 'tag-'.time();
                $tagModel = Tag::query()->firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $name]
                );
                $tagId = $tagModel->id;
            }

            if ($tagId && ! in_array($tagId, $tagIds, true)) {
                $tagIds[] = $tagId;
            }
        }

        $movie->tags()->sync($tagIds);
    }

    /**
     * Đồng bộ danh sách tập và các server phát cho một bộ phim.
     *
     * @param  array<int, array<string, mixed>>  $episodes
     */
    protected function syncEpisodes(Movie $movie, array $episodes): void
    {
        foreach ($episodes as $idx => $epData) {
            $epName = trim((string) ($epData['name'] ?? ''));
            $epSlug = trim((string) ($epData['slug'] ?? ''));
            if ($epName === '' || $epSlug === '') {
                continue;
            }

            $sortOrder = isset($epData['sort_order']) ? (int) $epData['sort_order'] : ($idx + 1);

            /** @var Episode $episode */
            $episode = $movie->episodes()->updateOrCreate(
                ['slug' => $epSlug],
                [
                    'name' => $epName,
                    'sort_order' => $sortOrder,
                ]
            );

            $servers = $epData['servers'] ?? [];
            if (! empty($servers) && is_array($servers)) {
                foreach ($servers as $sIdx => $sData) {
                    $serverName = trim((string) ($sData['server_name'] ?? 'VIP'));
                    $langType = ServerLangType::fromString($sData['lang_type'] ?? null);

                    $episode->servers()->updateOrCreate(
                        ['server_name' => $serverName],
                        [
                            'lang_type' => $langType,
                            'link_m3u8' => $sData['link_m3u8'] ?? null,
                            'link_embed' => $sData['link_embed'] ?? null,
                            'sort_order' => isset($sData['sort_order']) ? (int) $sData['sort_order'] : ($sIdx + 1),
                            'is_active' => isset($sData['is_active']) ? (bool) $sData['is_active'] : true,
                        ]
                    );
                }
            }
        }
    }
}
