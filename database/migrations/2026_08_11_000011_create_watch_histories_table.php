<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('watch_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->foreignId('episode_id')->nullable()->constrained('episodes')->nullOnDelete();
            $table->foreignId('server_id')->nullable()->constrained('episode_servers')->nullOnDelete();
            $table->unsignedInteger('progress_seconds')->default(0);
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamp('watched_at');
            $table->timestamps();

            $table->unique(['user_id', 'movie_id', 'episode_id'], 'watch_histories_user_movie_episode_unique');
            $table->index('movie_id', 'watch_histories_movie_id_index');
            $table->index(['user_id', 'is_completed', 'watched_at'], 'watch_histories_user_resume_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('watch_histories');
    }
};
