<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateReportRequest;
use App\Http\Resources\Api\V1\Admin\AdminReportResource;
use App\Models\EpisodeReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    /**
     * Danh sách báo cáo lỗi từ người dùng.
     */
    public function index(Request $request): JsonResponse
    {
        $query = EpisodeReport::query()
            ->with([
                'episode:id,movie_id,name,slug',
                'episode.movie:id,name,slug',
                'user:id,name,email',
                'server:id,server_name,lang_type',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->paginated($paginator, AdminReportResource::class);
    }

    /**
     * Cập nhật trạng thái xử lý báo cáo (pending, resolved, rejected).
     */
    public function update(UpdateReportRequest $request, int $id): JsonResponse
    {
        $report = EpisodeReport::query()->findOrFail($id);
        $validated = $request->validated();

        $validated['resolved_by'] = $request->user()?->id;
        if ($validated['status'] === 'resolved') {
            $validated['resolved_at'] = now();
        }

        $report->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật trạng thái báo cáo thành công.',
            'data' => new AdminReportResource($report->fresh()),
        ]);
    }

    /**
     * Xóa báo cáo.
     */
    public function destroy(int $id): JsonResponse
    {
        $report = EpisodeReport::query()->findOrFail($id);
        $report->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa báo cáo thành công.',
        ]);
    }
}
