<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\History\HistorySyncRequest;
use App\Http\Requests\Api\V1\History\MergeGuestHistoryRequest;
use App\Http\Resources\Api\V1\WatchHistoryResource;
use App\Services\HistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function __construct(
        protected HistoryService $historyService
    ) {}

    /**
     * Đồng bộ tiến trình xem phim
     */
    public function sync(HistorySyncRequest $request): JsonResponse
    {
        $history = $this->historyService->syncProgress(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Đồng bộ tiến trình xem thành công!',
            'data' => new WatchHistoryResource($history),
        ]);
    }

    /**
     * Danh sách lịch sử xem phim của người dùng
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $filter = $request->query('filter'); // 'completed' | 'in_progress' | null

        $paginator = $this->historyService->getUserHistory(
            $request->user(),
            $perPage,
            $filter
        );

        return response()->json([
            'status' => 'success',
            'data' => [
                'items' => WatchHistoryResource::collection($paginator->items()),
                'pagination' => [
                    'currentPage' => $paginator->currentPage(),
                    'lastPage' => $paginator->lastPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    /**
     * Lấy tiến trình xem của 1 bộ phim cụ thể
     */
    public function movieProgress(Request $request, int $movieId): JsonResponse
    {
        $history = $this->historyService->getMovieProgress($request->user(), $movieId);

        if (! $history) {
            return response()->json([
                'status' => 'success',
                'data' => null,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => new WatchHistoryResource($history),
        ]);
    }

    /**
     * Xóa 1 bản ghi lịch sử xem
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $deleted = $this->historyService->deleteItem($request->user(), $id);

        if (! $deleted) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy mục lịch sử xem hoặc bạn không có quyền xóa.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa mục lịch sử xem thành công!',
        ]);
    }

    /**
     * Xóa toàn bộ lịch sử xem của người dùng
     */
    public function clear(Request $request): JsonResponse
    {
        $count = $this->historyService->clearAll($request->user());

        return response()->json([
            'status' => 'success',
            'message' => "Đã xóa toàn bộ {$count} mục trong lịch sử xem phim.",
        ]);
    }

    /**
     * Gộp lịch sử xem từ thiết bị khách vào tài khoản
     */
    public function merge(MergeGuestHistoryRequest $request): JsonResponse
    {
        $count = $this->historyService->mergeGuestHistory(
            $request->user(),
            $request->validated()['items']
        );

        return response()->json([
            'status' => 'success',
            'message' => "Đã gộp thành công {$count} mục lịch sử vào tài khoản!",
        ]);
    }
}
