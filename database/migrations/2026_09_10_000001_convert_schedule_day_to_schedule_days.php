<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movies', function (Blueprint $table) {
            $table->json('schedule_days')
                ->nullable()
                ->after('notify_schedule')
                ->comment('Mảng ngày chiếu [0=CN,1=T2..6=T7]');
        });

        // Backfill: schedule_day_of_week (int) → schedule_days (json array)
        DB::table('movies')
            ->whereNotNull('schedule_day_of_week')
            ->select('id', 'schedule_day_of_week')
            ->chunkById(200, function ($movies) {
                foreach ($movies as $movie) {
                    DB::table('movies')
                        ->where('id', $movie->id)
                        ->update(['schedule_days' => json_encode([(int) $movie->schedule_day_of_week])]);
                }
            });

        Schema::table('movies', function (Blueprint $table) {
            $table->dropIndex('movies_schedule_day_of_week_index');
            $table->dropColumn('schedule_day_of_week');
        });
    }

    public function down(): void
    {
        Schema::table('movies', function (Blueprint $table) {
            $table->unsignedTinyInteger('schedule_day_of_week')
                ->nullable()
                ->after('notify_schedule')
                ->index('movies_schedule_day_of_week_index');
        });

        // Rollback: lấy phần tử đầu tiên từ JSON array
        DB::table('movies')
            ->whereNotNull('schedule_days')
            ->select('id', 'schedule_days')
            ->chunkById(200, function ($movies) {
                foreach ($movies as $movie) {
                    $days = json_decode($movie->schedule_days, true);
                    $first = is_array($days) && count($days) > 0 ? (int) $days[0] : null;
                    DB::table('movies')
                        ->where('id', $movie->id)
                        ->update(['schedule_day_of_week' => $first]);
                }
            });

        Schema::table('movies', function (Blueprint $table) {
            $table->dropColumn('schedule_days');
        });
    }
};
