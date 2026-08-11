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
        Schema::create('people', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('slug', 255)->unique('people_slug_unique');
            $table->string('other_names', 500)->nullable();
            $table->string('avatar_url', 1000)->nullable();
            $table->string('gender', 10)->nullable();
            $table->date('birthday')->nullable();
            $table->string('place_of_birth', 255)->nullable();
            $table->text('biography')->nullable();
            $table->string('tmdb_id', 50)->nullable()->index('people_tmdb_id_index');
            $table->timestamps();

            if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'])) {
                $table->fullText(['name', 'other_names'], 'people_fulltext_search');
            }
        });

        Schema::create('movie_person', function (Blueprint $table) {
            $table->foreignId('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->foreignId('person_id')->constrained('people')->cascadeOnDelete();
            $table->string('role', 20); // actor, director, writer, producer
            $table->string('character_name', 255)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->primary(['movie_id', 'person_id', 'role']);
            $table->index('person_id', 'movie_person_person_id_index');
            $table->index('role', 'movie_person_role_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_person');
        Schema::dropIfExists('people');
    }
};
