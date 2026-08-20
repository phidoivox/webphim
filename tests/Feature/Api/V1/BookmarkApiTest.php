<?php

namespace Tests\Feature\Api\V1;

use App\Models\Bookmark;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookmarkApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $otherUser;
    protected Movie $movie1;
    protected Movie $movie2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'user1@example.com',
            'is_active' => true,
        ]);

        $this->otherUser = User::factory()->create([
            'email' => 'user2@example.com',
            'is_active' => true,
        ]);

        $this->movie1 = Movie::create([
            'name' => 'Kẻ Trộm Mặt Trăng 4',
            'origin_name' => 'Despicable Me 4',
            'slug' => 'ke-trom-mat-trang-4',
            'content' => 'Nội dung phim hoạt hình...',
            'type' => 'single',
            'status' => 'completed',
            'thumb_url' => 'https://image.tmdb.org/t/p/w500/thumb1.jpg',
            'poster_url' => 'https://image.tmdb.org/t/p/w500/poster1.jpg',
            'year' => 2026,
            'rating_avg' => 8.5,
            'is_active' => true,
        ]);

        $this->movie2 = Movie::create([
            'name' => 'Dune: Hành Tinh Cát - Phần 2',
            'origin_name' => 'Dune: Part Two',
            'slug' => 'dune-hanh-tinh-cat-phan-2',
            'content' => 'Nội dung phim khoa học viễn tưởng...',
            'type' => 'single',
            'status' => 'completed',
            'thumb_url' => 'https://image.tmdb.org/t/p/w500/thumb2.jpg',
            'poster_url' => 'https://image.tmdb.org/t/p/w500/poster2.jpg',
            'year' => 2024,
            'rating_avg' => 9.0,
            'is_active' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_bookmark_apis(): void
    {
        $response = $this->getJson('/api/v1/bookmarks');
        $response->assertStatus(401);

        $responseToggle = $this->postJson('/api/v1/bookmarks/toggle', [
            'movie_id' => $this->movie1->id,
        ]);
        $responseToggle->assertStatus(401);
    }

    public function test_user_can_toggle_bookmark_on_and_off(): void
    {
        Sanctum::actingAs($this->user);

        // 1. Lưu phim lần đầu (Add)
        $responseAdd = $this->postJson('/api/v1/bookmarks/toggle', [
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        $responseAdd->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'isBookmarked' => true,
                    'action' => 'added',
                    'totalCount' => 1,
                ],
            ]);

        $this->assertDatabaseHas('bookmarks', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        // 2. Bấm lưu lần 2 (Remove/Unbookmark)
        $responseRemove = $this->postJson('/api/v1/bookmarks/toggle', [
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        $responseRemove->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'isBookmarked' => false,
                    'action' => 'removed',
                    'totalCount' => 0,
                ],
            ]);

        $this->assertDatabaseMissing('bookmarks', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);
    }

    public function test_user_can_toggle_watchlater_type(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/bookmarks/toggle', [
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_WATCHLATER,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'isBookmarked' => true,
                    'type' => Bookmark::TYPE_WATCHLATER,
                ],
            ]);

        $this->assertDatabaseHas('bookmarks', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_WATCHLATER,
        ]);
    }

    public function test_user_can_get_paginated_bookmarks_list(): void
    {
        Sanctum::actingAs($this->user);

        Bookmark::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        Bookmark::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie2->id,
            'type' => Bookmark::TYPE_WATCHLATER,
        ]);

        $response = $this->getJson('/api/v1/bookmarks');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    '*' => [
                        'id',
                        'userId',
                        'movieId',
                        'type',
                        'createdAt',
                        'movie' => [
                            'id',
                            'name',
                            'slug',
                            'posterUrl',
                        ],
                    ],
                ],
                'meta' => [
                    'currentPage',
                    'lastPage',
                    'perPage',
                    'total',
                ],
            ]);

        $this->assertEquals(2, $response->json('meta.total'));
    }

    public function test_user_can_filter_bookmarks_by_type_and_search(): void
    {
        Sanctum::actingAs($this->user);

        Bookmark::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        Bookmark::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie2->id,
            'type' => Bookmark::TYPE_WATCHLATER,
        ]);

        // Filter type = favorite
        $responseFav = $this->getJson('/api/v1/bookmarks?type=favorite');
        $responseFav->assertStatus(200);
        $this->assertEquals(1, $responseFav->json('meta.total'));
        $this->assertEquals($this->movie1->id, $responseFav->json('data.0.movieId'));

        // Search q = Dune
        $responseSearch = $this->getJson('/api/v1/bookmarks?q=Dune');
        $responseSearch->assertStatus(200);
        $this->assertEquals(1, $responseSearch->json('meta.total'));
        $this->assertEquals($this->movie2->id, $responseSearch->json('data.0.movieId'));
    }

    public function test_user_can_check_bookmark_status_for_movie(): void
    {
        Sanctum::actingAs($this->user);

        Bookmark::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        $response = $this->getJson("/api/v1/bookmarks/check/{$this->movie1->id}");
        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'isBookmarked' => true,
                    'types' => ['favorite'],
                    'movieId' => $this->movie1->id,
                ],
            ]);

        $responseNotBookmarked = $this->getJson("/api/v1/bookmarks/check/{$this->movie2->id}");
        $responseNotBookmarked->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'isBookmarked' => false,
                    'types' => [],
                    'movieId' => $this->movie2->id,
                ],
            ]);
    }

    public function test_user_can_delete_individual_bookmark(): void
    {
        Sanctum::actingAs($this->user);

        $bookmark = Bookmark::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        $response = $this->deleteJson("/api/v1/bookmarks/{$bookmark->id}");
        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        $this->assertDatabaseMissing('bookmarks', [
            'id' => $bookmark->id,
        ]);
    }

    public function test_user_cannot_delete_another_users_bookmark(): void
    {
        $bookmark = Bookmark::create([
            'user_id' => $this->otherUser->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        Sanctum::actingAs($this->user);

        $response = $this->deleteJson("/api/v1/bookmarks/{$bookmark->id}");
        $response->assertStatus(404);

        $this->assertDatabaseHas('bookmarks', [
            'id' => $bookmark->id,
        ]);
    }

    public function test_user_can_clear_all_bookmarks(): void
    {
        Sanctum::actingAs($this->user);

        Bookmark::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        Bookmark::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie2->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        $response = $this->deleteJson('/api/v1/bookmarks');
        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'deletedCount' => 2,
            ]);

        $this->assertEquals(0, Bookmark::where('user_id', $this->user->id)->count());
    }

    public function test_user_can_merge_guest_bookmarks_on_login(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/bookmarks/merge', [
            'items' => [
                [
                    'movie_id' => $this->movie1->id,
                    'type' => Bookmark::TYPE_FAVORITE,
                ],
                [
                    'movie_id' => $this->movie2->id,
                    'type' => Bookmark::TYPE_WATCHLATER,
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'mergedCount' => 2,
            ]);

        $this->assertDatabaseHas('bookmarks', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie1->id,
            'type' => Bookmark::TYPE_FAVORITE,
        ]);

        $this->assertDatabaseHas('bookmarks', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie2->id,
            'type' => Bookmark::TYPE_WATCHLATER,
        ]);
    }
}
