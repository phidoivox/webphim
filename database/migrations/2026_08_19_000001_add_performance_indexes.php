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
        Schema::table('movies', function (Blueprint $table) {
            $table->index('rating_avg', 'movies_rating_avg_index');
            $table->index(['is_active', 'deleted_at', 'rating_avg'], 'movies_active_rating_idx');
        });

        Schema::table('bookmarks', function (Blueprint $table) {
            $table->index(['user_id', 'type', 'created_at'], 'bookmarks_user_type_created_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movies', function (Blueprint $table) {
            $table->dropIndex('movies_rating_avg_index');
            $table->dropIndex('movies_active_rating_idx');
        });

        Schema::table('bookmarks', function (Blueprint $table) {
            $table->dropIndex('bookmarks_user_type_created_idx');
        });
    }
};
