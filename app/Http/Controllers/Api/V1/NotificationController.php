<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Lấy danh sách thông báo của người dùng hiện tại (phân trang).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min(50, $perPage));

        $paginator = $this->notificationService->getUserNotifications($request->user(), $perPage);

        $formattedData = collect($paginator->items())->map(function ($notif) {
            return NotificationService::formatNotification($notif);
        });

        return response()->json([
            'status' => 'success',
            'data' => $formattedData,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'unreadCount' => $this->notificationService->getUnreadCount($request->user()),
            ],
        ]);
    }

    /**
     * Lấy số lượng thông báo chưa đọc.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->getUnreadCount($request->user());

        return response()->json([
            'status' => 'success',
            'data' => [
                'unreadCount' => $count,
            ],
        ]);
    }

    /**
     * Đánh dấu một thông báo là đã đọc.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $success = $this->notificationService->markAsRead($request->user(), $id);

        if (! $success) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy thông báo hoặc bạn không có quyền truy cập.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Đã đánh dấu thông báo là đã đọc.',
            'data' => [
                'unreadCount' => $this->notificationService->getUnreadCount($request->user()),
            ],
        ]);
    }

    /**
     * Đánh dấu toàn bộ thông báo là đã đọc.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $affected = $this->notificationService->markAllAsRead($request->user());

        return response()->json([
            'status' => 'success',
            'message' => "Đã đánh dấu tất cả {$affected} thông báo là đã đọc.",
            'data' => [
                'unreadCount' => 0,
            ],
        ]);
    }

    /**
     * Xóa một thông báo.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $success = $this->notificationService->deleteNotification($request->user(), $id);

        if (! $success) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy thông báo hoặc bạn không có quyền truy cập.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa thông báo thành công.',
        ]);
    }
}
