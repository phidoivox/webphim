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
        Schema::create('movies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('movies')->nullOnDelete();

            // Thông tin cơ bản
            $table->string('name', 500);
            $table->string('origin_name', 500)->nullable();
            $table->string('slug', 500)->unique('movies_slug_unique');
            $table->text('content')->nullable();

            // Phân loại
            $table->string('type', 20);
            $table->string('status', 20)->default('ongoing');
            $table->string('quality', 20)->nullable()->default('HD');
            $table->string('lang', 50)->nullable();
            $table->string('age_rating', 10)->nullable()->default('P');
            $table->boolean('is_cinema')->default(false);

            // Media
            $table->string('thumb_url', 1000)->nullable();
            $table->string('poster_url', 1000)->nullable();
            $table->string('trailer_url', 1000)->nullable();

            // Tập phim
            $table->string('duration', 50)->nullable();
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->string('episode_current', 50)->nullable();
            $table->string('episode_total', 50)->nullable();
            $table->unsignedSmallInteger('episode_current_num')->nullable();
            $table->unsignedSmallInteger('episode_total_num')->nullable();
            $table->string('notify_schedule', 255)->nullable();

            // Đánh giá & Thống kê
            $table->unsignedSmallInteger('year')->nullable();
            $table->decimal('imdb_rating', 3, 1)->nullable()->default(0.0);
            $table->decimal('tmdb_rating', 3, 1)->nullable()->default(0.0);
            $table->decimal('rating_avg', 3, 1)->default(0.0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedInteger('comment_count')->default(0);

            // Cờ trạng thái
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);

            // Đồng bộ dữ liệu
            $table->string('tmdb_id', 50)->nullable()->unique('movies_tmdb_id_unique');
            $table->string('imdb_id', 50)->nullable()->unique('movies_imdb_id_unique');
            $table->string('source_url', 1000)->nullable();
            $table->timestamp('last_synced_at')->nullable();

            // SEO Metadata
            $table->string('meta_title', 255)->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->string('meta_keywords', 500)->nullable();

            // Timestamps & Soft Delete
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('year', 'movies_year_index');
            $table->index(['deleted_at', 'is_active', 'type', 'status', 'created_at'], 'movies_active_type_status_created_idx');
            $table->index(['deleted_at', 'is_active', 'type', 'view_count'], 'movies_active_type_views_idx');
            $table->index(['deleted_at', 'is_active', 'is_featured', 'created_at'], 'movies_featured_home_idx');

            if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'])) {
                $table->fullText(['name', 'origin_name'], 'movies_fulltext_search');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movies');
    }
};
