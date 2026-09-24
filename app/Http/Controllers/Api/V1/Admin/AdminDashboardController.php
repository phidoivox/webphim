<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Comment;
use App\Models\Episode;
use App\Models\EpisodeReport;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalMovies = Movie::query()->count();
        $activeMovies = Movie::query()->active()->count();
        $totalEpisodes = Episode::query()->count();
        $totalUsers = User::query()->count();
        $totalViews = (int) Movie::query()->sum('view_count');
        $totalComments = Comment::query()->count();
        $pendingReports = EpisodeReport::query()->where('status', 'pending')->count();

        // 14 days views timeseries calculation
        $daysCount = 14;
        $startDate = Carbon::today()->subDays($daysCount - 1);
        $dailyViews = [];

        try {
            $dbViews = DB::table('movie_view_logs')
                ->selectRaw('DATE(viewed_at) as log_date, COUNT(*) as aggregate')
                ->where('viewed_at', '>=', $startDate->copy()->startOfDay())
                ->groupBy('log_date')
                ->pluck('aggregate', 'log_date')
                ->all();
            if (! empty($dbViews)) {
                $dailyViews = $dbViews;
            }
        } catch (\Throwable) {
            // movie_view_logs fallback
        }

        if (empty($dailyViews)) {
            try {
                $dbViews = DB::table('watch_histories')
                    ->selectRaw('DATE(watched_at) as log_date, COUNT(*) as aggregate')
                    ->where('watched_at', '>=', $startDate->copy()->startOfDay())
                    ->groupBy('log_date')
                    ->pluck('aggregate', 'log_date')
                    ->all();
                if (! empty($dbViews)) {
                    $dailyViews = $dbViews;
                }
            } catch (\Throwable) {
                // watch_histories fallback
            }
        }

        $viewsTimeseries = [];
        $currentDate = $startDate->copy();
        for ($i = 0; $i < $daysCount; $i++) {
            $dateStr = $currentDate->format('Y-m-d');
            $labelStr = $currentDate->format('d/m');
            $dayCount = (int) ($dailyViews[$dateStr] ?? 0);

            $viewsTimeseries[] = [
                'date' => $dateStr,
                'label' => $labelStr,
                'views' => $dayCount,
            ];

            $currentDate->addDay();
        }

        // Recent activity logs
        $activityLogs = [];
        try {
            $auditLogs = AuditLog::query()
                ->with('user:id,name,email')
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();

            foreach ($auditLogs as $log) {
                $userName = $log->user?->name ?? 'Quản trị viên';
                $modelName = class_basename($log->model_type ?? 'Phim');
                $desc = match ($log->action) {
                    'create', 'created' => "{$userName} đã tạo mới {$modelName} #{$log->model_id}",
                    'update', 'updated' => "{$userName} đã cập nhật {$modelName} #{$log->model_id}",
                    'delete', 'deleted' => "{$userName} đã xóa {$modelName} #{$log->model_id}",
                    'toggle' => "{$userName} đã chuyển trạng thái {$modelName} #{$log->model_id}",
                    'bulk_action' => "{$userName} đã thực hiện thao tác hàng loạt trên {$modelName}",
                    default => "{$userName} đã thực hiện hành động: {$log->action}",
                };

                $activityLogs[] = [
                    'id' => (int) $log->id,
                    'action' => (string) $log->action,
                    'description' => $desc,
                    'time' => $log->created_at?->diffForHumans() ?? $log->created_at?->toISOString() ?? 'Gần đây',
                ];
            }
        } catch (\Throwable) {
            // audit_logs fallback
        }

        if (empty($activityLogs)) {
            $recentMoviesForLogs = Movie::query()->orderByDesc('created_at')->limit(5)->get();
            foreach ($recentMoviesForLogs as $m) {
                $activityLogs[] = [
                    'id' => (int) $m->id,
                    'action' => 'movie_created',
                    'description' => "Đã thêm phim mới: \"{$m->name}\"",
                    'time' => $m->created_at?->diffForHumans() ?? 'Gần đây',
                ];
            }

            $recentReportsForLogs = EpisodeReport::query()->with('episode.movie:id,name')->orderByDesc('created_at')->limit(5)->get();
            foreach ($recentReportsForLogs as $r) {
                $movieTitle = $r->episode?->movie?->name ?? 'Phim';
                $activityLogs[] = [
                    'id' => 10000 + (int) $r->id,
                    'action' => 'report_received',
                    'description' => "Nhận báo lỗi [{$r->report_type}] cho {$movieTitle}",
                    'time' => $r->created_at?->diffForHumans() ?? 'Gần đây',
                ];
            }
        }

        $recentMovies = Movie::query()
            ->with(['genres:id,name', 'episodes:id,movie_id,name'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (Movie $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'slug' => $m->slug,
                'thumbUrl' => $m->thumb_url,
                'posterUrl' => $m->poster_url,
                'type' => $m->type,
                'status' => $m->status,
                'quality' => $m->quality,
                'year' => $m->year,
                'viewCount' => $m->view_count,
                'isActive' => (bool) $m->is_active,
                'episodeCount' => $m->episodes->count(),
                'createdAt' => $m->created_at?->toISOString(),
            ]);

        $recentReports = EpisodeReport::query()
            ->with([
                'episode.movie:id,name,slug',
                'user:id,name,email',
            ])
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (EpisodeReport $r) => [
                'id' => $r->id,
                'reportType' => $r->report_type,
                'description' => $r->description,
                'status' => $r->status,
                'movieName' => $r->episode?->movie?->name,
                'episodeName' => $r->episode?->name,
                'reporterName' => $r->user?->name ?? 'Khách',
                'createdAt' => $r->created_at?->toISOString(),
            ]);

        // Top 5 most viewed movies (chuẩn camelCase)
        $topViewedMovies = Movie::query()
            ->orderByDesc('view_count')
            ->limit(5)
            ->get(['id', 'name', 'slug', 'thumb_url', 'view_count', 'rating_avg'])
            ->map(fn (Movie $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'slug' => $m->slug,
                'thumbUrl' => $m->thumb_url,
                'viewCount' => $m->view_count,
                'ratingAvg' => $m->rating_avg,
            ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'kpis' => [
                    'totalMovies' => $totalMovies,
                    'activeMovies' => $activeMovies,
                    'totalEpisodes' => $totalEpisodes,
                    'totalUsers' => $totalUsers,
                    'totalViews' => $totalViews,
                    'totalComments' => $totalComments,
                    'pendingReports' => $pendingReports,
                ],
                'viewsTimeseries' => $viewsTimeseries,
                'recentMovies' => $recentMovies,
                'recentReports' => $recentReports,
                'topViewedMovies' => $topViewedMovies,
                'activityLogs' => $activityLogs,
            ],
        ]);
    }
}
