<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Comment;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCommentTest extends TestCase
{
    use RefreshDatabase;

    protected Movie $movie;

    protected User $admin;

    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->movie = Movie::create([
            'name' => 'Interstellar',
            'origin_name' => 'Interstellar (2014)',
            'slug' => 'interstellar',
            'type' => 'single',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

        $this->regularUser = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'role' => 'user',
        ]);
    }

    public function test_regular_user_cannot_access_admin_comments(): void
    {
        Sanctum::actingAs($this->regularUser);

        $this->getJson('/api/v1/admin/comments')
            ->assertForbidden();
    }

    public function test_admin_can_list_comments_with_filters(): void
    {
        Sanctum::actingAs($this->admin);

        Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->regularUser->id,
            'content' => 'Bình luận quản trị 1',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/v1/admin/comments');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'content', 'status', 'isPinned', 'author', 'movie'],
                ],
                'meta' => ['currentPage', 'total'],
            ]);
    }

    public function test_admin_can_update_comment_status(): void
    {
        Sanctum::actingAs($this->admin);

        $comment = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->regularUser->id,
            'content' => 'Nội dung spam quảng cáo',
            'status' => 'active',
        ]);

        $response = $this->patchJson("/api/v1/admin/comments/{$comment->id}/status", [
            'status' => 'spam',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'spam');

        $this->assertEquals('spam', $comment->fresh()->status);
    }

    public function test_admin_can_toggle_pin_comment(): void
    {
        Sanctum::actingAs($this->admin);

        $comment = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->regularUser->id,
            'content' => 'Thông báo từ Admin',
            'is_pinned' => false,
            'status' => 'active',
        ]);

        $response = $this->patchJson("/api/v1/admin/comments/{$comment->id}/pin");

        $response->assertOk()
            ->assertJsonPath('data.isPinned', true);

        $this->assertTrue($comment->fresh()->is_pinned);
    }

    public function test_admin_can_bulk_action_comments(): void
    {
        Sanctum::actingAs($this->admin);

        $c1 = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->regularUser->id,
            'content' => 'Spam 1',
            'status' => 'active',
        ]);
        $c2 = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->regularUser->id,
            'content' => 'Spam 2',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/admin/comments/bulk', [
            'action' => 'hide',
            'ids' => [$c1->id, $c2->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('affected', 2);

        $this->assertEquals('hidden', $c1->fresh()->status);
        $this->assertEquals('hidden', $c2->fresh()->status);
    }
}
