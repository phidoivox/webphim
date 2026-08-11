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
        Schema::create('episodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('slug', 255);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['movie_id', 'slug'], 'episodes_movie_slug_unique');
            $table->index('movie_id', 'episodes_movie_id_index');
            $table->index(['movie_id', 'sort_order'], 'episodes_sort_order_index');
        });

        Schema::create('episode_servers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('episode_id')->constrained('episodes')->cascadeOnDelete();
            $table->string('server_name', 100);
            $table->string('lang_type', 20)->default('vietsub');
            $table->text('link_embed')->nullable();
            $table->text('link_m3u8')->nullable();
            $table->json('subtitles')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('episode_id', 'episode_servers_episode_id_index');
            $table->index(['episode_id', 'lang_type'], 'episode_servers_episode_lang_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('episode_servers');
        Schema::dropIfExists('episodes');
    }
};
