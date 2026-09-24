<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('movies', function (Blueprint $table) {
            $table->unsignedTinyInteger('schedule_day_of_week')
                ->nullable()
                ->after('notify_schedule')
                ->index('movies_schedule_day_of_week_index')
                ->comment('0: Chủ nhật, 1: Thứ 2, 2: Thứ 3, 3: Thứ 4, 4: Thứ 5, 5: Thứ 6, 6: Thứ 7');
        });

        // Backfill dữ liệu từ notify_schedule sang schedule_day_of_week
        $this->backfillScheduleDays();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movies', function (Blueprint $table) {
            $table->dropIndex('movies_schedule_day_of_week_index');
            $table->dropColumn('schedule_day_of_week');
        });
    }

    /**
     * Phân tích chuỗi text notify_schedule sang số ngày trong tuần (0 - 6).
     */
    private function backfillScheduleDays(): void
    {
        DB::table('movies')
            ->whereNotNull('notify_schedule')
            ->where('notify_schedule', '!=', '')
            ->select('id', 'notify_schedule')
            ->chunkById(100, function ($movies) {
                foreach ($movies as $movie) {
                    $day = $this->parseDayOfWeek($movie->notify_schedule);
                    if ($day !== null) {
                        DB::table('movies')
                            ->where('id', $movie->id)
                            ->update(['schedule_day_of_week' => $day]);
                    }
                }
            });
    }

    /**
     * Parse chuỗi tiếng Việt sang số ngày.
     */
    private function parseDayOfWeek(string $text): ?int
    {
        $lower = mb_strtolower($text, 'UTF-8');

        if (str_contains($lower, 'chủ nhật') || str_contains($lower, 'chu nhat') || str_contains($lower, 'cn')) {
            return 0;
        }
        if (str_contains($lower, 'thứ 2') || str_contains($lower, 'thứ hai') || str_contains($lower, 'thu 2') || str_contains($lower, 'thu hai')) {
            return 1;
        }
        if (str_contains($lower, 'thứ 3') || str_contains($lower, 'thứ ba') || str_contains($lower, 'thu 3') || str_contains($lower, 'thu ba')) {
            return 2;
        }
        if (str_contains($lower, 'thứ 4') || str_contains($lower, 'thứ tư') || str_contains($lower, 'thứ bốn') || str_contains($lower, 'thu 4') || str_contains($lower, 'thu tu')) {
            return 3;
        }
        if (str_contains($lower, 'thứ 5') || str_contains($lower, 'thứ năm') || str_contains($lower, 'thu 5') || str_contains($lower, 'thu nam')) {
            return 4;
        }
        if (str_contains($lower, 'thứ 6') || str_contains($lower, 'thứ sáu') || str_contains($lower, 'thu 6') || str_contains($lower, 'thu sau')) {
            return 5;
        }
        if (str_contains($lower, 'thứ 7') || str_contains($lower, 'thứ bảy') || str_contains($lower, 'thu 7') || str_contains($lower, 'thu bay')) {
            return 6;
        }

        return null;
    }
};
