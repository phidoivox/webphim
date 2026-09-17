<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function __construct(
        protected ScheduleService $scheduleService
    ) {}

    /**
     * Lịch chiếu tuần, hoặc 1 ngày với ?day=0-6 (0 = Chủ nhật).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'day' => ['sometimes', 'integer', 'between:0,6'],
        ]);

        if (array_key_exists('day', $validated)) {
            return response()->json([
                'status' => 'success',
                'data' => $this->scheduleService->getScheduleByDay((int) $validated['day']),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $this->scheduleService->getWeeklySchedule(),
        ]);
    }
}
