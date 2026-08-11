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
        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->string('type', 20)->default('favorite'); // favorite, watchlater, following
            $table->timestamps();

            $table->unique(['user_id', 'movie_id', 'type'], 'bookmarks_user_movie_type_unique');
            $table->index(['user_id', 'type'], 'bookmarks_user_type_index');
            $table->index('movie_id', 'bookmarks_movie_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookmarks');
    }
};
