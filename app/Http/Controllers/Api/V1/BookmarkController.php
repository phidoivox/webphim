<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Bookmark\MergeGuestBookmarksRequest;
use App\Http\Requests\Api\V1\Bookmark\ToggleBookmarkRequest;
use App\Http\Resources\Api\V1\BookmarkResource;
use App\Models\Bookmark;
use App\Services\BookmarkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function __construct(
        protected BookmarkService $bookmarkService
    ) {}

    /**
     * Chuyển đổi lưu / bỏ lưu phim (Toggle)
     */
    public function toggle(ToggleBookmarkRequest $request): JsonResponse
    {
        $user = $request->user();
        $movieId = (int) $request->validated('movie_id');
        $type = $request->validated('type', Bookmark::TYPE_FAVORITE) ?? Bookmark::TYPE_FAVORITE;

        $result = $this->bookmarkService->toggleBookmark($user, $movieId, $type);

        $message = $result['isBookmarked']
            ? 'Đã thêm phim vào tủ phim thành công'
            : 'Đã xóa phim khỏi tủ phim';

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $result,
        ]);
    }

    /**
     * Lấy danh sách tủ phim có phân trang
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['type', 'q', 'sort', 'per_page', 'page']);

        $bookmarks = $this->bookmarkService->getPaginatedBookmarks($user, $filters);

        return response()->paginated($bookmarks, BookmarkResource::class);
    }

    /**
     * Kiểm tra trạng thái lưu phim
     */
    public function check(Request $request, int $movieId): JsonResponse
    {
        $user = $request->user();
        $type = $request->query('type');

        $result = $this->bookmarkService->checkStatus($user, $movieId, $type);

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Xóa một phim khỏi tủ phim
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $deleted = $this->bookmarkService->deleteBookmark($user, $id);

        if (! $deleted) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy mục trong tủ phim hoặc bạn không có quyền xóa',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa phim khỏi tủ phim thành công',
        ]);
    }

    /**
     * Xóa tất cả phim trong tủ phim
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user();
        $type = $request->query('type');

        $count = $this->bookmarkService->clearAll($user, $type);

        return response()->json([
            'status' => 'success',
            'message' => "Đã xóa {$count} phim khỏi tủ phim",
            'deletedCount' => $count,
        ]);
    }

    /**
     * Gộp danh sách tủ phim của khách vào tài khoản
     */
    public function merge(MergeGuestBookmarksRequest $request): JsonResponse
    {
        $user = $request->user();
        $items = $request->validated('items');

        $mergedCount = $this->bookmarkService->mergeGuestBookmarks($user, $items);

        return response()->json([
            'status' => 'success',
            'message' => "Đã đồng bộ {$mergedCount} phim vào tủ phim của bạn",
            'mergedCount' => $mergedCount,
        ]);
    }
}
