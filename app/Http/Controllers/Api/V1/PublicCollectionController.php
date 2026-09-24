<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CollectionDetailResource;
use App\Models\Collection;
use Illuminate\Http\JsonResponse;

class PublicCollectionController extends Controller
{
    /**
     * Chi tiết bộ sưu tập công khai theo slug.
     */
    public function show(string $slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)
            ->public()
            ->with(['creator', 'movies.genres'])
            ->withCount('movies')
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => new CollectionDetailResource($collection),
        ]);
    }
}
