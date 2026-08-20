<?php

namespace Tests\Feature\Api;

use App\Models\Comment;
use App\Models\Movie;
use App\Models\User;
use App\Notifications\CommentLikeNotification;
use App\Notifications\CommentReplyNotification;
use App\Notifications\SystemBroadcastNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $otherUser;
    protected Movie $movie;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Notification User',
            'email' => 'notif@example.com',
            'role' => 'user',
            'is_active' => true,
        ]);

        $this->otherUser = User::factory()->create([
            'name' => 'Other User',
            'email' => 'other@example.com',
            'role' => 'user',
            'is_active' => true,
        ]);

        $this->movie = Movie::create([
            'name' => 'One Piece',
            'slug' => 'one-piece',
            'type' => 'series',
            'is_active' => true,
        ]);
    }

    public function test_guest_cannot_access_notifications(): void
    {
        $this->getJson('/api/v1/notifications')->assertUnauthorized();
        $this->getJson('/api/v1/notifications/unread-count')->assertUnauthorized();
    }

    public function test_user_can_fetch_notifications_list(): void
    {
        Sanctum::actingAs($this->user);

        $this->user->notify(new SystemBroadcastNotification('Chào mừng', 'Chào mừng bạn đến với WebPhim'));

        $response = $this->getJson('/api/v1/notifications');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'message',
                        'link',
                        'iconType',
                        'isRead',
                        'readAt',
                        'createdAt',
                    ],
                ],
                'meta' => [
                    'currentPage',
                    'lastPage',
                    'perPage',
                    'total',
                    'unreadCount',
                ],
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_user_can_get_unread_count(): void
    {
        Sanctum::actingAs($this->user);

        $this->user->notify(new SystemBroadcastNotification('Thông báo 1', 'Nội dung 1'));
        $this->user->notify(new SystemBroadcastNotification('Thông báo 2', 'Nội dung 2'));

        $response = $this->getJson('/api/v1/notifications/unread-count');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'unreadCount' => 2,
                ],
            ]);
    }

    public function test_user_can_mark_single_notification_as_read(): void
    {
        Sanctum::actingAs($this->user);

        $this->user->notify(new SystemBroadcastNotification('Thông báo', 'Nội dung'));
        $notification = $this->user->notifications()->first();

        $response = $this->patchJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'unreadCount' => 0,
                ],
            ]);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_cannot_mark_other_users_notification_as_read(): void
    {
        $this->otherUser->notify(new SystemBroadcastNotification('Của người khác', 'Nội dung'));
        $notification = $this->otherUser->notifications()->first();

        Sanctum::actingAs($this->user);

        $response = $this->patchJson("/api/v1/notifications/{$notification->id}/read");
        $response->assertNotFound();
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        Sanctum::actingAs($this->user);

        $this->user->notify(new SystemBroadcastNotification('Thông báo 1', 'Nội dung 1'));
        $this->user->notify(new SystemBroadcastNotification('Thông báo 2', 'Nội dung 2'));

        $response = $this->postJson('/api/v1/notifications/read-all');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'unreadCount' => 0,
                ],
            ]);

        $this->assertEquals(0, $this->user->unreadNotifications()->count());
    }

    public function test_user_can_delete_notification(): void
    {
        Sanctum::actingAs($this->user);

        $this->user->notify(new SystemBroadcastNotification('Thông báo', 'Nội dung'));
        $notification = $this->user->notifications()->first();

        $response = $this->deleteJson("/api/v1/notifications/{$notification->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('notifications', [
            'id' => $notification->id,
        ]);
    }

    public function test_replying_to_comment_triggers_notification_for_parent_author(): void
    {
        $parentComment = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->otherUser->id,
            'content' => 'Bình luận gốc của other user',
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->user);

        $response = $this->postJson("/api/v1/movies/{$this->movie->slug}/comments", [
            'content' => 'Câu trả lời từ user',
            'parent_id' => $parentComment->id,
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->otherUser->id,
            'notifiable_type' => User::class,
            'type' => CommentReplyNotification::class,
        ]);
    }

    public function test_liking_comment_triggers_notification_for_comment_author(): void
    {
        $comment = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->otherUser->id,
            'content' => 'Bình luận hay',
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->user);

        $response = $this->postJson("/api/v1/comments/{$comment->id}/like");

        $response->assertOk();

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->otherUser->id,
            'notifiable_type' => User::class,
            'type' => CommentLikeNotification::class,
        ]);
    }
}
