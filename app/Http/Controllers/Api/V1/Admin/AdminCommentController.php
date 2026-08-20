<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CommentResource;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCommentController extends Controller
{
    public function __construct(
        protected CommentService $commentService
    ) {}

    /**
     * Danh sách bình luận phục vụ quản trị và kiểm duyệt.
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->commentService->adminGetComments($request->all());

        return response()->json([
            'status' => 'success',
            'data' => CommentResource::collection($paginator->items()),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Cập nhật trạng thái kiểm duyệt (active, hidden, spam).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,hidden,spam'],
        ], [
            'status.in' => 'Trạng thái không hợp lệ. Cho phép: active, hidden, spam.',
        ]);

        $comment = $this->commentService->adminUpdateStatus($id, $validated['status']);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật trạng thái bình luận thành công.',
            'data' => new CommentResource($comment),
        ]);
    }

    /**
     * Ghim hoặc bỏ ghim bình luận lên đầu danh sách phim.
     */
    public function togglePin(Request $request, int $id): JsonResponse
    {
        $comment = $this->commentService->adminTogglePin($id);

        $message = $comment->is_pinned
            ? 'Đã ghim bình luận lên đầu danh sách.'
            : 'Đã bỏ ghim bình luận.';

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => new CommentResource($comment),
        ]);
    }

    /**
     * Xóa bình luận từ quản trị viên.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $force = $request->boolean('force', false);
        $this->commentService->adminDeleteComment($id, $force);

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa bình luận thành công.',
        ]);
    }

    /**
     * Thao tác hàng loạt trên nhiều bình luận (Bulk Action).
     */
    public function bulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:activate,hide,spam,delete'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $affected = $this->commentService->adminBulkAction($validated['action'], $validated['ids']);

        return response()->json([
            'status' => 'success',
            'message' => "Đã xử lý {$affected} bình luận thành công.",
            'affected' => $affected,
        ]);
    }
}
