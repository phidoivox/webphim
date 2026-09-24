<?php

namespace Tests\Feature\Api\Admin;

use App\Models\User;
use App\Notifications\SystemBroadcastNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->regularUser = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'role' => 'user',
            'is_active' => true,
        ]);
    }

    public function test_guest_and_regular_user_cannot_broadcast_notifications(): void
    {
        $payload = [
            'title' => 'Thông báo hệ thống',
            'message' => 'Hệ thống bảo trì vào lúc 0h.',
        ];

        // Guest
        $this->postJson('/api/v1/admin/notifications/broadcast', $payload)->assertUnauthorized();

        // Regular user
        Sanctum::actingAs($this->regularUser);
        $this->postJson('/api/v1/admin/notifications/broadcast', $payload)->assertForbidden();
    }

    public function test_admin_can_broadcast_notification_to_all_active_users(): void
    {
        // Tạo thêm 3 user
        User::factory()->count(3)->create(['is_active' => true]);

        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'Bảo trì hệ thống',
            'message' => 'Hệ thống sẽ bảo trì nâng cấp trong 15 phút.',
            'link' => '/thong-bao',
            'send_mail' => false,
        ]);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
            ])
            ->assertJsonPath('data.sentCount', 5); // 1 admin + 1 regular + 3 new = 5 users

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->regularUser->id,
            'type' => SystemBroadcastNotification::class,
        ]);
    }

    public function test_admin_broadcast_validation(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/admin/notifications/broadcast', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'message']);
    }
}
