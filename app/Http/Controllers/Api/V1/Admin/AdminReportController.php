<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
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
                'episode.movie:id,name,slug',
                'user:id,name,email',
                'server:id,server_name,lang_type',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        $items = collect($paginator->items())->map(fn (EpisodeReport $r) => [
            'id' => $r->id,
            'reportType' => $r->report_type,
            'description' => $r->description,
            'status' => $r->status,
            'adminNote' => $r->admin_note,
            'movie' => $r->episode?->movie ? [
                'id' => $r->episode->movie->id,
                'name' => $r->episode->movie->name,
                'slug' => $r->episode->movie->slug,
            ] : null,
            'episode' => $r->episode ? [
                'id' => $r->episode->id,
                'name' => $r->episode->name,
                'slug' => $r->episode->slug,
            ] : null,
            'server' => $r->server ? [
                'id' => $r->server->id,
                'serverName' => $r->server->server_name,
            ] : null,
            'user' => $r->user ? [
                'id' => $r->user->id,
                'name' => $r->user->name,
                'email' => $r->user->email,
            ] : null,
            'createdAt' => $r->created_at?->toISOString(),
            'resolvedAt' => $r->resolved_at?->toISOString(),
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $items,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Cập nhật trạng thái xử lý báo cáo (pending, resolved, rejected).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $report = EpisodeReport::query()->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,resolved,rejected'],
            'admin_note' => ['nullable', 'string'],
        ]);

        $validated['resolved_by'] = $request->user()?->id;
        if ($validated['status'] === 'resolved') {
            $validated['resolved_at'] = now();
        }

        $report->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật trạng thái báo cáo thành công.',
            'data' => $report->fresh(),
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
