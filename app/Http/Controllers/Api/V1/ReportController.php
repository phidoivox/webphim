<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreReportRequest;
use App\Models\EpisodeReport;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    /**
     * Tiếp nhận báo cáo lỗi từ người dùng (khách hoặc thành viên).
     */
    public function store(StoreReportRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = auth('sanctum')->user();

        $report = EpisodeReport::create([
            'user_id' => $user?->id,
            'episode_id' => $validated['episode_id'],
            'server_id' => $validated['server_id'] ?? null,
            'report_type' => $validated['report_type'],
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Báo cáo lỗi đã được gửi thành công.',
            'data' => [
                'id' => $report->id,
                'status' => $report->status,
                'created_at' => $report->created_at?->toISOString(),
            ],
        ], 201);
    }
}
