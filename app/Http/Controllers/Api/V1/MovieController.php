<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\MovieFilterRequest;
use App\Services\MovieService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovieController extends Controller
{
    public function __construct(
        protected MovieService $movieService
    ) {}

    /**
     * Danh sách phim có phân trang & bộ lọc.
     */
    public function index(MovieFilterRequest $request): JsonResponse
    {
        $payload = $this->movieService->getFilteredMoviesPayload(
            $request->validated(),
            $request->integer('per_page', 24),
            $request->integer('page', 1)
        );

        return response()->json([
            'status' => 'success',
            'data' => $payload['data'],
            'meta' => $payload['meta'],
        ]);
    }

    /**
     * Tìm kiếm phim và diễn viên theo từ khóa.
     */
    public function search(Request $request): JsonResponse
    {
        $keyword = (string) $request->query('q', '');
        $limit = (int) $request->query('limit', 5);
        $payload = $this->movieService->getSearchAllPayload($keyword, min(max($limit, 1), 30));

        return response()->json([
            'data' => $payload,
        ]);
    }

    /**
     * Chi tiết một bộ phim theo slug.
     */
    public function show(string $movie): JsonResponse
    {
        $payload = $this->movieService->getMovieDetailPayload($movie);

        // Tăng view count ngầm sau khi HTTP response đã gửi về client
        defer(function () use ($movie) {
            $this->movieService->incrementViewCountBySlug($movie);
        })->always();

        return response()->json(['data' => $payload]);
    }
}
