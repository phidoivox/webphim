<?php

namespace Tests\Feature\Api;

use App\Models\Comment;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    protected Movie $movie;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->movie = Movie::create([
            'name' => 'Inception',
            'origin_name' => 'Inception (2010)',
            'slug' => 'inception',
            'type' => 'single',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'testuser@example.com',
            'role' => 'user',
        ]);
    }

    public function test_guest_can_fetch_comments_of_a_movie(): void
    {
        Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->user->id,
            'content' => 'Phim rất hay, xuất sắc!',
            'status' => 'active',
        ]);

        $response = $this->getJson("/api/v1/movies/{$this->movie->slug}/comments");

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'data' => [
                    '*' => [
                        'id',
                        'movieId',
                        'content',
                        'likesCount',
                        'repliesCount',
                        'isPinned',
                        'isSpoiler',
                        'author' => ['id', 'name'],
                        'createdAt',
                    ],
                ],
                'meta' => ['currentPage', 'total'],
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_authenticated_user_can_post_comment(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson("/api/v1/movies/{$this->movie->id}/comments", [
            'content' => 'Một bộ phim đỉnh cao của Christopher Nolan.',
            'is_spoiler' => false,
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.content', 'Một bộ phim đỉnh cao của Christopher Nolan.');

        $this->assertDatabaseHas('comments', [
            'movie_id' => $this->movie->id,
            'user_id' => $this->user->id,
            'content' => 'Một bộ phim đỉnh cao của Christopher Nolan.',
        ]);
    }

    public function test_user_can_reply_to_a_comment(): void
    {
        Sanctum::actingAs($this->user);

        $parent = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->user->id,
            'content' => 'Bình luận gốc',
            'status' => 'active',
        ]);

        $response = $this->postJson("/api/v1/movies/{$this->movie->id}/comments", [
            'content' => 'Đồng ý với quan điểm của bạn!',
            'parent_id' => $parent->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.parentId', $parent->id);

        $this->assertEquals(1, $parent->fresh()->replies_count);
    }

    public function test_user_can_toggle_like_on_comment(): void
    {
        Sanctum::actingAs($this->user);

        $comment = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->user->id,
            'content' => 'Nội dung bình luận',
            'status' => 'active',
        ]);

        // Like lần 1
        $res1 = $this->postJson("/api/v1/comments/{$comment->id}/like");
        $res1->assertOk()
            ->assertJsonPath('data.isLiked', true)
            ->assertJsonPath('data.likesCount', 1);

        $this->assertEquals(1, $comment->fresh()->likes_count);

        // Like lần 2 (Unlike)
        $res2 = $this->postJson("/api/v1/comments/{$comment->id}/like");
        $res2->assertOk()
            ->assertJsonPath('data.isLiked', false)
            ->assertJsonPath('data.likesCount', 0);

        $this->assertEquals(0, $comment->fresh()->likes_count);
    }

    public function test_user_can_delete_own_comment_but_not_others(): void
    {
        $otherUser = User::factory()->create(['role' => 'user']);
        $comment = Comment::create([
            'movie_id' => $this->movie->id,
            'user_id' => $this->user->id,
            'content' => 'Bình luận của user',
            'status' => 'active',
        ]);

        // otherUser cố gắng xóa -> 403 Forbidden
        Sanctum::actingAs($otherUser);
        $this->deleteJson("/api/v1/comments/{$comment->id}")
            ->assertForbidden();

        // Chính chủ xóa -> 200 OK
        Sanctum::actingAs($this->user);
        $this->deleteJson("/api/v1/comments/{$comment->id}")
            ->assertOk();

        $this->assertSoftDeleted('comments', ['id' => $comment->id]);
    }
}
