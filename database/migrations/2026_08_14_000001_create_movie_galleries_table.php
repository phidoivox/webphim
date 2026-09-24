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
        Schema::create('movie_galleries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->string('media_type', 20)->default('image'); // 'image' hoặc 'video'
            $table->string('type', 30)->default('still'); // 'trailer', 'teaser', 'behind_the_scenes', 'still', 'backdrop', 'poster'
            $table->string('url', 1000);
            $table->string('thumb_url', 1000)->nullable();
            $table->string('caption', 255)->nullable();
            $table->unsignedSmallInteger('duration_seconds')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('movie_id', 'movie_galleries_movie_id_index');
            $table->index(['movie_id', 'media_type', 'sort_order'], 'movie_galleries_movie_media_sort_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_galleries');
    }
};
