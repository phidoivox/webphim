<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Collection\AddCollectionMovieRequest;
use App\Http\Requests\Api\V1\Collection\StoreCollectionRequest;
use App\Http\Requests\Api\V1\Collection\UpdateCollectionRequest;
use App\Http\Resources\Api\V1\CollectionDetailResource;
use App\Http\Resources\Api\V1\CollectionSummaryResource;
use App\Models\Collection;
use App\Services\CollectionService;
use Illuminate\Http\JsonResponse;

class UserCollectionController extends Controller
{
    public function __construct(
        protected CollectionService $collectionService
    ) {}

    /**
     * Danh sách bộ sưu tập của user đăng nhập.
     */
    public function index(): JsonResponse
    {
        $collections = $this->collectionService->getUserCollections(request()->user());

        return response()->json([
            'status' => 'success',
            'data' => CollectionSummaryResource::collection($collections),
        ]);
    }

    /**
     * Tạo bộ sưu tập mới.
     */
    public function store(StoreCollectionRequest $request): JsonResponse
    {
        $collection = $this->collectionService->createCollection(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Tạo bộ sưu tập thành công.',
            'data' => new CollectionDetailResource($collection->loadCount('movies')),
        ], 201);
    }

    /**
     * Chi tiết bộ sưu tập của user (kiểm tra quyền sở hữu).
     */
    public function show(int $id): JsonResponse
    {
        $collection = $this->ownedCollection($id);
        $collection->load(['movies.genres'])->loadCount('movies');

        return response()->json([
            'status' => 'success',
            'data' => new CollectionDetailResource($collection),
        ]);
    }

    /**
     * Cập nhật bộ sưu tập.
     */
    public function update(UpdateCollectionRequest $request, int $id): JsonResponse
    {
        $collection = $this->ownedCollection($id);
        $updated = $this->collectionService->updateCollection($collection, $request->validated());
        $updated->load(['movies.genres'])->loadCount('movies');

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật bộ sưu tập thành công.',
            'data' => new CollectionDetailResource($updated),
        ]);
    }

    /**
     * Xóa bộ sưu tập.
     */
    public function destroy(int $id): JsonResponse
    {
        $collection = $this->ownedCollection($id);
        $collection->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa bộ sưu tập thành công.',
        ]);
    }

    /**
     * Thêm phim vào bộ sưu tập.
     */
    public function addMovie(AddCollectionMovieRequest $request, int $id): JsonResponse
    {
        $collection = $this->ownedCollection($id);
        $updated = $this->collectionService->addMovie($collection, (int) $request->validated('movie_id'));

        return response()->json([
            'status' => 'success',
            'message' => 'Đã thêm phim vào bộ sưu tập.',
            'data' => new CollectionDetailResource($updated),
        ]);
    }

    /**
     * Gỡ phim khỏi bộ sưu tập.
     */
    public function removeMovie(int $id, int $movieId): JsonResponse
    {
        $collection = $this->ownedCollection($id);
        $detached = $this->collectionService->removeMovie($collection, $movieId);

        if ($detached === 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Phim không có trong bộ sưu tập.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Đã gỡ phim khỏi bộ sưu tập.',
        ]);
    }

    protected function ownedCollection(int $id): Collection
    {
        return Collection::where('id', $id)
            ->where('created_by', request()->user()->id)
            ->firstOrFail();
    }
}
