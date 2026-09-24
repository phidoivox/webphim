<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreCountryRequest;
use App\Http\Requests\Api\V1\Admin\StoreGenreRequest;
use App\Models\Country;
use App\Models\Genre;
use App\Models\Person;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminTaxonomyController extends Controller
{
    /**
     * Danh sách thể loại.
     */
    public function genres(): JsonResponse
    {
        $genres = Genre::query()
            ->withCount('movies')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $genres,
        ]);
    }

    public function storeGenre(StoreGenreRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if (isset($validated['description']) && ! isset($validated['meta_description'])) {
            $validated['meta_description'] = $validated['description'];
            unset($validated['description']);
        }

        $genre = Genre::query()->create($validated);
        Cache::tags(['taxonomies', 'genres'])->flush();
        Cache::forget('genres:list');

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm thể loại thành công.',
            'data' => $genre,
        ], 201);
    }

    public function updateGenre(Request $request, int $id): JsonResponse
    {
        $genre = Genre::query()->findOrFail($id);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('genres', 'slug')->ignore($id)],
            'description' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if (isset($validated['description']) && ! isset($validated['meta_description'])) {
            $validated['meta_description'] = $validated['description'];
            unset($validated['description']);
        }

        $genre->update($validated);
        Cache::tags(['taxonomies', 'genres'])->flush();
        Cache::forget('genres:list');

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật thể loại thành công.',
            'data' => $genre,
        ]);
    }

    public function destroyGenre(int $id): JsonResponse
    {
        $genre = Genre::query()->findOrFail($id);

        DB::transaction(function () use ($genre) {
            $genre->movies()->detach();
            $genre->delete();
        });

        Cache::tags(['taxonomies', 'genres'])->flush();
        Cache::forget('genres:list');

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa thể loại thành công.',
        ]);
    }

    /**
     * Danh sách quốc gia.
     */
    public function countries(): JsonResponse
    {
        $countries = Country::query()
            ->withCount('movies')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $countries,
        ]);
    }

    public function storeCountry(StoreCountryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if (isset($validated['description']) && ! isset($validated['meta_description'])) {
            $validated['meta_description'] = $validated['description'];
            unset($validated['description']);
        }

        $country = Country::query()->create($validated);
        Cache::tags(['taxonomies', 'countries'])->flush();
        Cache::forget('countries:list');

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm quốc gia thành công.',
            'data' => $country,
        ], 201);
    }

    public function updateCountry(Request $request, int $id): JsonResponse
    {
        $country = Country::query()->findOrFail($id);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('countries', 'slug')->ignore($id)],
            'description' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if (isset($validated['description']) && ! isset($validated['meta_description'])) {
            $validated['meta_description'] = $validated['description'];
            unset($validated['description']);
        }

        $country->update($validated);
        Cache::tags(['taxonomies', 'countries'])->flush();
        Cache::forget('countries:list');

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật quốc gia thành công.',
            'data' => $country,
        ]);
    }

    public function destroyCountry(int $id): JsonResponse
    {
        $country = Country::query()->findOrFail($id);

        DB::transaction(function () use ($country) {
            $country->movies()->detach();
            $country->delete();
        });

        Cache::tags(['taxonomies', 'countries'])->flush();
        Cache::forget('countries:list');

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa quốc gia thành công.',
        ]);
    }

    /**
     * Danh sách diễn viên & đạo diễn (People).
     */
    public function people(Request $request): JsonResponse
    {
        $query = Person::query();

        if ($request->filled('q')) {
            $keyword = trim((string) $request->input('q'));
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $keyword);
            $query->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                    ->orWhere('other_names', 'like', "%{$escaped}%");
            });
        }

        $people = $query->orderBy('name')->limit(50)->get();

        return response()->json([
            'status' => 'success',
            'data' => $people,
        ]);
    }

    public function storePerson(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:people,slug'],
            'other_names' => ['nullable', 'string', 'max:500'],
            'avatar_url' => ['nullable', 'string', 'max:1000'],
            'gender' => ['nullable', 'string', 'max:10'],
            'birthday' => ['nullable', 'date'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'biography' => ['nullable', 'string'],
            'tmdb_id' => ['nullable', 'string', 'max:50'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $person = Person::query()->create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm nhân vật thành công.',
            'data' => $person,
        ], 201);
    }

    public function updatePerson(Request $request, int $id): JsonResponse
    {
        $person = Person::query()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('people', 'slug')->ignore($id)],
            'other_names' => ['nullable', 'string', 'max:500'],
            'avatar_url' => ['nullable', 'string', 'max:1000'],
            'gender' => ['nullable', 'string', 'max:10'],
            'birthday' => ['nullable', 'date'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'biography' => ['nullable', 'string'],
            'tmdb_id' => ['nullable', 'string', 'max:50'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $person->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật thông tin nhân vật thành công.',
            'data' => $person->fresh(),
        ]);
    }

    public function destroyPerson(int $id): JsonResponse
    {
        $person = Person::query()->findOrFail($id);

        DB::transaction(function () use ($person) {
            $person->movies()->detach();
            $person->delete();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa nhân vật thành công.',
        ]);
    }
}
