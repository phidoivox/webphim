<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Genre;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class GenreController extends Controller
{
    /**
     * Lấy danh sách thể loại kèm số lượng phim active.
     */
    public function index(): JsonResponse
    {
        $genres = Cache::tags(['genres', 'movies'])->remember('genres:list', 3600, function () {
            return Genre::query()
                ->withCount(['movies' => function ($query) {
                    $query->active();
                }])
                ->orderBy('name')
                ->get()
                ->map(fn (Genre $genre) => [
                    'id' => $genre->id,
                    'name' => $genre->name,
                    'slug' => $genre->slug,
                    'moviesCount' => $genre->movies_count ?? 0,
                ])
                ->values()
                ->all();
        });

        return response()->json([
            'data' => $genres,
        ]);
    }
}
