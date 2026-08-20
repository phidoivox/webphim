<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Gửi thông báo hệ thống broadcast tới toàn bộ người dùng.
     */
    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'link' => ['nullable', 'string', 'max:500'],
            'send_mail' => ['nullable', 'boolean'],
        ]);

        $sendMail = (bool) ($validated['send_mail'] ?? false);
        $link = $validated['link'] ?? null;

        $sentCount = $this->notificationService->broadcastSystemNotification(
            $validated['title'],
            $validated['message'],
            $link,
            $sendMail
        );

        return response()->json([
            'success' => true,
            'message' => "Đã gửi thông báo thành công tới {$sentCount} người dùng.",
            'data' => [
                'sentCount' => $sentCount,
                'sendMail' => $sendMail,
            ],
        ]);
    }
}
