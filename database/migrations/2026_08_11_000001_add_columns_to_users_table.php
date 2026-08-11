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
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_url', 1000)->nullable()->after('remember_token');
            $table->string('role', 20)->default('user')->after('avatar_url');
            $table->string('subscription_type', 20)->default('free')->after('role');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_type');
            $table->boolean('is_active')->default(true)->after('subscription_expires_at');

            $table->index('role', 'users_role_index');
            $table->index('subscription_type', 'users_subscription_type_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_index');
            $table->dropIndex('users_subscription_type_index');

            $table->dropColumn([
                'avatar_url',
                'role',
                'subscription_type',
                'subscription_expires_at',
                'is_active',
            ]);
        });
    }
};
