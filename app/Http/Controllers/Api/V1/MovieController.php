<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\MovieFilterRequest;
use App\Http\Resources\Api\V1\MovieDetailResource;
use App\Http\Resources\Api\V1\MovieSummaryResource;
use App\Http\Resources\Api\V1\PersonSearchResource;
use App\Services\MovieService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        $paginator = $this->movieService->filterMovies(
            $request->validated(),
            $request->integer('per_page', 24)
        );

        return response()->json([
            'data' => MovieSummaryResource::collection($paginator->items()),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'hasMore' => $paginator->hasMorePages(),
            ],
        ]);
    }

    /**
     * Tìm kiếm phim và diễn viên theo từ khóa.
     */
    public function search(Request $request): JsonResponse
    {
        $keyword = (string) $request->query('q', '');
        $limit = (int) $request->query('limit', 5);
        $result = $this->movieService->searchAll($keyword, min(max($limit, 1), 30));

        return response()->json([
            'data' => [
                'movies' => MovieSummaryResource::collection($result['movies']),
                'actors' => PersonSearchResource::collection($result['actors']),
            ],
        ]);
    }

    /**
     * Chi tiết một bộ phim theo slug.
     */
    public function show(string $movie): MovieDetailResource
    {
        $movieModel = $this->movieService->getMovieDetail($movie);
        $similarMovies = $this->movieService->getSimilarMovies($movieModel);

        // Tăng view count và ghi log ngầm sau khi HTTP response đã gửi về client
        defer(function () use ($movieModel, $movie) {
            $this->movieService->incrementViewCount($movieModel);
            Log::info("Movie viewed: {$movie}");
        })->always();

        return new MovieDetailResource($movieModel, $similarMovies);
    }
}
