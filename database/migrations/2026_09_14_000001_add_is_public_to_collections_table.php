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
        Schema::table('collections', function (Blueprint $table) {
            $table->boolean('is_public')->default(true)->after('thumb_url');
            $table->index(['created_by', 'is_public'], 'collections_user_public_idx');
            $table->index(['is_public', 'is_active', 'created_at'], 'collections_public_feed_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->dropIndex('collections_user_public_idx');
            $table->dropIndex('collections_public_feed_idx');
            $table->dropColumn('is_public');
        });
    }
};
