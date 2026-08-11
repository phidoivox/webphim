<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\MovieDetailResource;
use App\Models\Movie;

class MovieController extends Controller
{
    public function show(string $movie): MovieDetailResource
    {
        $movie = Movie::query()
            ->where('slug', $movie)
            ->where('is_active', true)
            ->withoutTrashed()
            ->with(['genres', 'countries', 'episodes.servers', 'directors', 'actors'])
            ->firstOrFail(); // ModelNotFoundException → 404 JSON

        return new MovieDetailResource($movie);
    }
}
