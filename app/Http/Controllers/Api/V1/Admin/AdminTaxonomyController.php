<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Genre;
use App\Models\Person;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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

    public function storeGenre(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:genres,slug'],
            'description' => ['nullable', 'string'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $genre = Genre::query()->create($validated);
        Cache::tags(['genres'])->flush();

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
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $genre->update($validated);
        Cache::tags(['genres'])->flush();

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật thể loại thành công.',
            'data' => $genre,
        ]);
    }

    public function destroyGenre(int $id): JsonResponse
    {
        $genre = Genre::query()->findOrFail($id);
        $genre->movies()->detach();
        $genre->delete();
        Cache::tags(['genres'])->flush();

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

    public function storeCountry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:countries,slug'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $country = Country::query()->create($validated);
        Cache::tags(['countries'])->flush();

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
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $country->update($validated);
        Cache::tags(['countries'])->flush();

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật quốc gia thành công.',
            'data' => $country,
        ]);
    }

    public function destroyCountry(int $id): JsonResponse
    {
        $country = Country::query()->findOrFail($id);
        $country->movies()->detach();
        $country->delete();
        Cache::tags(['countries'])->flush();

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
            'other_names' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:500'],
            'bio' => ['nullable', 'string'],
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
}
