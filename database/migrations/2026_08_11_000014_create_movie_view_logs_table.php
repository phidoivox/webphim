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
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("
                CREATE TABLE `movie_view_logs` (
                    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    `movie_id`   BIGINT UNSIGNED NOT NULL,
                    `episode_id` BIGINT UNSIGNED NULL DEFAULT NULL,
                    `user_id`    BIGINT UNSIGNED NULL DEFAULT NULL,
                    `ip_address` VARCHAR(45)     NOT NULL,
                    `user_agent` VARCHAR(500)    NULL DEFAULT NULL,
                    `viewed_at`  DATETIME        NOT NULL,

                    PRIMARY KEY (`id`, `viewed_at`),
                    KEY `movie_view_logs_movie_id_index` (`movie_id`),
                    KEY `movie_view_logs_dedup_index` (`movie_id`, `ip_address`, `viewed_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log xem phim — phân vùng theo tháng'
                PARTITION BY RANGE COLUMNS(`viewed_at`) (
                    PARTITION p2026_01 VALUES LESS THAN ('2026-02-01 00:00:00'),
                    PARTITION p2026_02 VALUES LESS THAN ('2026-03-01 00:00:00'),
                    PARTITION p2026_03 VALUES LESS THAN ('2026-04-01 00:00:00'),
                    PARTITION p2026_04 VALUES LESS THAN ('2026-05-01 00:00:00'),
                    PARTITION p_future  VALUES LESS THAN (MAXVALUE)
                );
            ");
        } else {
            Schema::create('movie_view_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('movie_id');
                $table->unsignedBigInteger('episode_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('ip_address', 45);
                $table->string('user_agent', 500)->nullable();
                $table->dateTime('viewed_at');

                $table->index('movie_id', 'movie_view_logs_movie_id_index');
                $table->index(['movie_id', 'ip_address', 'viewed_at'], 'movie_view_logs_dedup_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_view_logs');
    }
};
