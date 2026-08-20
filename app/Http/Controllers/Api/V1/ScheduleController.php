<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ScheduleService;
use Illuminate\Http\JsonResponse;

class ScheduleController extends Controller
{
    public function __construct(
        protected ScheduleService $scheduleService
    ) {}

    /**
     * Lấy danh sách lịch chiếu phim theo tuần (nhóm theo các thứ trong tuần).
     */
    public function index(): JsonResponse
    {
        $schedule = $this->scheduleService->getWeeklySchedule();

        return response()->json([
            'success' => true,
            'data' => $schedule,
        ]);
    }
}
