<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreMovieRequest;
use App\Http\Requests\Api\V1\Admin\UpdateMovieRequest;
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

        $items = collect($paginator->items())->map(fn (Movie $m) => [
            'id' => $m->id,
            'name' => $m->name,
            'originName' => $m->origin_name,
            'slug' => $m->slug,
            'thumbUrl' => $m->thumb_url,
            'posterUrl' => $m->poster_url,
            'type' => $m->type instanceof \BackedEnum ? $m->type->value : $m->type,
            'status' => $m->status instanceof \BackedEnum ? $m->status->value : $m->status,
            'quality' => $m->quality instanceof \BackedEnum ? $m->quality->value : $m->quality,
            'year' => $m->year,
            'episodeCurrent' => $m->episode_current,
            'episodeTotal' => $m->episode_total,
            'viewCount' => $m->view_count,
            'ratingAvg' => (float) $m->rating_avg,
            'isActive' => (bool) $m->is_active,
            'isFeatured' => (bool) $m->is_featured,
            'isCinema' => (bool) $m->is_cinema,
            'genres' => $m->genres->map(fn ($g) => ['id' => $g->id, 'name' => $g->name]),
            'countries' => $m->countries->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
            'createdAt' => $m->created_at?->toISOString(),
            'updatedAt' => $m->updated_at?->toISOString(),
        ]);

        $counts = Movie::query()
            ->selectRaw('count(*) as total, sum(case when is_active = 1 then 1 else 0 end) as active, sum(case when type = "series" then 1 else 0 end) as series, sum(case when type = "single" then 1 else 0 end) as single, sum(case when is_featured = 1 then 1 else 0 end) as featured, sum(case when is_cinema = 1 then 1 else 0 end) as cinema, sum(case when is_active = 0 then 1 else 0 end) as hidden')
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $items,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'counts' => [
                    'total' => (int) ($counts->total ?? 0),
                    'active' => (int) ($counts->active ?? 0),
                    'series' => (int) ($counts->series ?? 0),
                    'single' => (int) ($counts->single ?? 0),
                    'featured' => (int) ($counts->featured ?? 0),
                    'cinema' => (int) ($counts->cinema ?? 0),
                    'hidden' => (int) ($counts->hidden ?? 0),
                ],
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
            $slug = $baseSlug;
            $counter = 1;
            while (Movie::query()->where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $validated['slug'] = $slug;
        }

        $movie = DB::transaction(function () use ($validated) {
            $genreIds = $validated['genre_ids'] ?? [];
            $countryIds = $validated['country_ids'] ?? [];
            $tagIds = $validated['tag_ids'] ?? [];
            $tags = $validated['tags'] ?? null;
            $actors = $validated['actors'] ?? [];
            $directors = $validated['directors'] ?? [];
            $galleries = $validated['galleries'] ?? [];

            unset($validated['genre_ids'], $validated['country_ids'], $validated['tag_ids'], $validated['tags'], $validated['actors'], $validated['directors'], $validated['galleries']);

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
                'genres:id,name,slug',
                'countries:id,name,slug',
                'tags:id,name,slug',
                'actors:id,name,avatar_url',
                'directors:id,name,avatar_url',
                'episodes.servers',
                'galleries',
            ])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $movie->id,
                'name' => $movie->name,
                'originName' => $movie->origin_name,
                'slug' => $movie->slug,
                'content' => $movie->content,
                'type' => $movie->type instanceof \BackedEnum ? $movie->type->value : $movie->type,
                'status' => $movie->status instanceof \BackedEnum ? $movie->status->value : $movie->status,
                'quality' => $movie->quality instanceof \BackedEnum ? $movie->quality->value : $movie->quality,
                'lang' => $movie->lang,
                'thumbUrl' => $movie->thumb_url,
                'posterUrl' => $movie->poster_url,
                'trailerUrl' => $movie->trailer_url,
                'duration' => $movie->duration,
                'durationMinutes' => $movie->duration_minutes,
                'episodeCurrent' => $movie->episode_current,
                'episodeTotal' => $movie->episode_total,
                'notifySchedule' => $movie->notify_schedule,
                'scheduleDayOfWeek' => $movie->schedule_day_of_week,
                'year' => $movie->year,
                'tmdbRating' => $movie->tmdb_rating,
                'imdbRating' => $movie->imdb_rating,
                'tmdbId' => $movie->tmdb_id,
                'imdbId' => $movie->imdb_id,
                'sourceUrl' => $movie->source_url,
                'metaTitle' => $movie->meta_title,
                'metaDescription' => $movie->meta_description,
                'metaKeywords' => $movie->meta_keywords,
                'ratingAvg' => $movie->rating_avg,
                'viewCount' => $movie->view_count,
                'isFeatured' => (bool) $movie->is_featured,
                'isCinema' => (bool) $movie->is_cinema,
                'isActive' => (bool) $movie->is_active,
                'genres' => $movie->genres->map(fn ($g) => ['id' => $g->id, 'name' => $g->name, 'slug' => $g->slug]),
                'countries' => $movie->countries->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug]),
                'tags' => $movie->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug]),
                'actors' => $movie->actors->map(fn ($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'characterName' => $a->pivot->character_name ?? null,
                ]),
                'directors' => $movie->directors->map(fn ($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                ]),
                'episodes' => $movie->episodes->map(fn ($ep) => [
                    'id' => $ep->id,
                    'name' => $ep->name,
                    'slug' => $ep->slug,
                    'sortOrder' => $ep->sort_order,
                    'servers' => $ep->servers->map(fn ($s) => [
                        'id' => $s->id,
                        'serverName' => $s->server_name,
                        'langType' => $s->lang_type instanceof \BackedEnum ? $s->lang_type->value : $s->lang_type,
                        'linkM3u8' => $s->link_m3u8,
                        'linkEmbed' => $s->link_embed,
                        'sortOrder' => $s->sort_order,
                        'isActive' => (bool) $s->is_active,
                    ]),
                ]),
                'galleries' => $movie->galleries->map(fn ($g) => [
                    'id' => $g->id,
                    'mediaType' => $g->media_type,
                    'type' => $g->type,
                    'url' => $g->url,
                    'thumbUrl' => $g->thumb_url,
                    'caption' => $g->caption,
                    'sortOrder' => $g->sort_order,
                ]),
            ],
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

            unset($validated['genre_ids'], $validated['country_ids'], $validated['tag_ids'], $validated['tags'], $validated['actors'], $validated['directors'], $validated['galleries']);

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
    public function bulkAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => [
                'required',
                'string',
                'in:is_active_on,is_active_off,is_featured_on,is_featured_off,is_cinema_on,is_cinema_off,delete,activate,deactivate,feature,unfeature,cinema,uncinema',
            ],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

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
            $count = match ($action) {
                'is_active_on' => Movie::query()->whereIn('id', $ids)->update(['is_active' => true]),
                'is_active_off' => Movie::query()->whereIn('id', $ids)->update(['is_active' => false]),
                'is_featured_on' => Movie::query()->whereIn('id', $ids)->update(['is_featured' => true]),
                'is_featured_off' => Movie::query()->whereIn('id', $ids)->update(['is_featured' => false]),
                'is_cinema_on' => Movie::query()->whereIn('id', $ids)->update(['is_cinema' => true]),
                'is_cinema_off' => Movie::query()->whereIn('id', $ids)->update(['is_cinema' => false]),
                'delete' => (function () use ($ids) {
                    $movies = Movie::query()->whereIn('id', $ids)->get();
                    $deleted = 0;
                    foreach ($movies as $movie) {
                        $movie->delete();
                        $deleted++;
                    }
                    return $deleted;
                })(),
            };

            if (\Illuminate\Support\Facades\Schema::hasTable('audit_logs')) {
                \App\Models\AuditLog::query()->create([
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
     * @param array<int|string|array{id?: int, name?: string}>|null $tags
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
}
