<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\GenreResource;
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
        $genres = Cache::tags(['taxonomies', 'genres'])->flexible('genres:list', [1800, 3600], function () {
            $collection = Genre::query()
                ->withCount(['movies' => function ($query) {
                    $query->active();
                }])
                ->orderBy('name')
                ->get();

            return GenreResource::collection($collection)->resolve();
        });

        return response()->json([
            'status' => 'success',
            'data' => $genres,
        ]);
    }
}
