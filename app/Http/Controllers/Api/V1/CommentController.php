<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Comment\StoreCommentRequest;
use App\Http\Requests\Api\V1\Comment\UpdateCommentRequest;
use App\Http\Resources\Api\V1\CommentResource;
use App\Models\Comment;
use App\Models\Movie;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    public function __construct(
        protected CommentService $commentService
    ) {}

    /**
     * Danh sách bình luận gốc của một phim (kèm câu trả lời lồng nhau và trạng thái like).
     */
    public function index(Request $request, string|int $movie): JsonResponse
    {
        $movieId = is_numeric($movie)
            ? (int) $movie
            : Movie::where('slug', $movie)->value('id');

        if (! $movieId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy bộ phim yêu cầu.',
            ], 404);
        }

        $currentUser = $request->user('sanctum');
        $paginator = $this->commentService->getMovieComments($movieId, $request->all(), $currentUser);

        return response()->json([
            'status' => 'success',
            'data' => CommentResource::collection($paginator->items()),
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
     * Danh sách câu trả lời của một bình luận.
     */
    public function replies(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user('sanctum');
        $paginator = $this->commentService->getCommentReplies($id, $request->all(), $currentUser);

        return response()->json([
            'status' => 'success',
            'data' => CommentResource::collection($paginator->items()),
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
     * Đăng bình luận mới hoặc gửi câu trả lời.
     */
    public function store(StoreCommentRequest $request, string|int $movie): JsonResponse
    {
        $user = $request->user();
        $movieId = is_numeric($movie)
            ? (int) $movie
            : Movie::where('slug', $movie)->value('id');

        if (! $movieId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy bộ phim yêu cầu.',
            ], 404);
        }

        $comment = $this->commentService->storeComment($user, $movieId, $request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Đã gửi bình luận thành công.',
            'data' => new CommentResource($comment),
        ], 201);
    }

    /**
     * Cập nhật nội dung bình luận.
     */
    public function update(UpdateCommentRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $comment = Comment::findOrFail($id);

        Gate::authorize('update', $comment);

        $updated = $this->commentService->updateComment($user, $id, $request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật bình luận thành công.',
            'data' => new CommentResource($updated),
        ]);
    }

    /**
     * Xóa bình luận.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $comment = Comment::findOrFail($id);

        Gate::authorize('delete', $comment);

        $this->commentService->deleteComment($user, $id);

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa bình luận thành công.',
        ]);
    }

    /**
     * Thích hoặc Bỏ thích bình luận (Toggle Like).
     */
    public function toggleLike(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $result = $this->commentService->toggleLike($user, $id);

        $message = $result['isLiked']
            ? 'Đã thích bình luận.'
            : 'Đã bỏ thích bình luận.';

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $result,
        ]);
    }
}
