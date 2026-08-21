<?php

namespace Tests\Feature\Api;

use App\Events\NotificationSentEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BroadcastingAuthTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test_key',
            'broadcasting.connections.reverb.secret' => 'test_secret',
            'broadcasting.connections.reverb.app_id' => 'test_app_id',
        ]);

        require base_path('routes/channels.php');

        $this->user = User::factory()->create([
            'name' => 'Broadcasting User',
            'email' => 'bc_user@example.com',
            'role' => 'user',
            'is_active' => true,
        ]);

        $this->otherUser = User::factory()->create([
            'name' => 'Other User',
            'email' => 'other_bc@example.com',
            'role' => 'user',
            'is_active' => true,
        ]);
    }

    public function test_guest_cannot_authenticate_broadcasting_channel(): void
    {
        $response = $this->postJson('/api/broadcasting/auth', [
            'channel_name' => 'private-user.'.$this->user->id,
            'socket_id' => '1234.5678',
        ]);

        $response->assertUnauthorized();
    }

    public function test_user_can_authenticate_own_private_channel(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/broadcasting/auth', [
            'channel_name' => 'private-user.'.$this->user->id,
            'socket_id' => '1234.5678',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['auth']);
    }

    public function test_user_cannot_authenticate_another_user_private_channel(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/broadcasting/auth', [
            'channel_name' => 'private-user.'.$this->otherUser->id,
            'socket_id' => '1234.5678',
        ]);

        $response->assertForbidden();
    }

    public function test_notification_sent_event_can_be_dispatched(): void
    {
        Event::fake([NotificationSentEvent::class]);

        event(new NotificationSentEvent($this->user->id, [
            'id' => 'test-id',
            'title' => 'Test Notification',
            'message' => 'Test message',
        ], 1));

        Event::assertDispatched(NotificationSentEvent::class, function ($event) {
            return $event->userId === $this->user->id
                && $event->broadcastAs() === 'notification.sent'
                && $event->broadcastOn()[0]->name === 'private-user.'.$this->user->id;
        });
    }
}
