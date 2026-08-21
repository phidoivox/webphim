<?php

namespace Tests\Feature\Api\V1;

use App\Models\Episode;
use App\Models\Movie;
use App\Models\User;
use App\Models\WatchHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HistoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Movie $movie;

    protected Episode $episode;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'email' => 'user_test@example.com',
            'is_active' => true,
        ]);

        $this->movie = Movie::create([
            'name' => 'Kẻ Trộm Mặt Trăng 4',
            'origin_name' => 'Despicable Me 4',
            'slug' => 'ke-trom-mat-trang-4',
            'content' => 'Nội dung phim hoạt hình hấp dẫn...',
            'type' => 'single',
            'status' => 'completed',
            'thumb_url' => 'https://image.tmdb.org/t/p/w500/thumb.jpg',
            'poster_url' => 'https://image.tmdb.org/t/p/w500/poster.jpg',
            'year' => 2026,
            'is_active' => true,
        ]);

        $this->episode = Episode::create([
            'movie_id' => $this->movie->id,
            'name' => 'Tập 1',
            'slug' => 'tap-1',
            'sort_order' => 1,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_history_apis(): void
    {
        $response = $this->getJson('/api/v1/history');
        $response->assertStatus(401);

        $responseSync = $this->postJson('/api/v1/history/sync', [
            'movie_id' => $this->movie->id,
            'progress_seconds' => 120,
        ]);
        $responseSync->assertStatus(401);
    }

    public function test_user_can_sync_watch_progress_successfully(): void
    {
        Sanctum::actingAs($this->user);

        $payload = [
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 300,
            'duration_seconds' => 3600,
        ];

        $response = $this->postJson('/api/v1/history/sync', $payload);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'movieId',
                    'episodeId',
                    'progressSeconds',
                    'durationSeconds',
                    'progressPercent',
                    'isCompleted',
                    'watchedAt',
                ],
            ])
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'movieId' => $this->movie->id,
                    'episodeId' => $this->episode->id,
                    'progressSeconds' => 300,
                    'durationSeconds' => 3600,
                    'isCompleted' => false,
                ],
            ]);

        $this->assertDatabaseHas('watch_histories', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 300,
            'duration_seconds' => 3600,
            'is_completed' => 0,
        ]);
    }

    public function test_user_can_update_existing_progress(): void
    {
        Sanctum::actingAs($this->user);

        // Tạo ban đầu
        WatchHistory::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 100,
            'duration_seconds' => 3600,
            'watched_at' => now()->subMinutes(10),
        ]);

        // Gửi sync tiến độ mới
        $response = $this->postJson('/api/v1/history/sync', [
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 850,
            'duration_seconds' => 3600,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'progressSeconds' => 850,
                ],
            ]);

        $this->assertDatabaseCount('watch_histories', 1);
        $this->assertDatabaseHas('watch_histories', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'progress_seconds' => 850,
        ]);
    }

    public function test_system_marks_as_completed_when_progress_over_90_percent(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/history/sync', [
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 3400, // 3400 / 3600 = ~94.4%
            'duration_seconds' => 3600,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'isCompleted' => true,
                ],
            ]);

        $this->assertDatabaseHas('watch_histories', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'is_completed' => 1,
        ]);
    }

    public function test_user_can_get_history_list(): void
    {
        Sanctum::actingAs($this->user);

        WatchHistory::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 1200,
            'duration_seconds' => 3600,
            'watched_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/history');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'items' => [
                        '*' => [
                            'id',
                            'movieId',
                            'progressSeconds',
                            'durationSeconds',
                            'progressPercent',
                            'isCompleted',
                            'watchedAt',
                            'movie' => [
                                'id',
                                'name',
                                'slug',
                                'posterUrl',
                            ],
                            'episode',
                        ],
                    ],
                    'pagination',
                ],
            ]);
    }

    public function test_user_can_get_single_movie_progress(): void
    {
        Sanctum::actingAs($this->user);

        WatchHistory::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 640,
            'duration_seconds' => 3600,
            'watched_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/history/movie/{$this->movie->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'movieId' => $this->movie->id,
                    'progressSeconds' => 640,
                ],
            ]);
    }

    public function test_user_can_delete_single_history_item(): void
    {
        Sanctum::actingAs($this->user);

        $history = WatchHistory::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 640,
            'duration_seconds' => 3600,
            'watched_at' => now(),
        ]);

        $response = $this->deleteJson("/api/v1/history/{$history->id}");

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $this->assertDatabaseMissing('watch_histories', ['id' => $history->id]);
    }

    public function test_user_cannot_delete_another_users_history(): void
    {
        $otherUser = User::factory()->create();
        $history = WatchHistory::create([
            'user_id' => $otherUser->id,
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 640,
            'duration_seconds' => 3600,
            'watched_at' => now(),
        ]);

        Sanctum::actingAs($this->user);

        $response = $this->deleteJson("/api/v1/history/{$history->id}");
        $response->assertStatus(404);

        $this->assertDatabaseHas('watch_histories', ['id' => $history->id]);
    }

    public function test_user_can_clear_all_history(): void
    {
        Sanctum::actingAs($this->user);

        WatchHistory::create([
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'episode_id' => $this->episode->id,
            'progress_seconds' => 640,
            'duration_seconds' => 3600,
            'watched_at' => now(),
        ]);

        $response = $this->deleteJson('/api/v1/history');

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $this->assertDatabaseCount('watch_histories', 0);
    }

    public function test_user_can_merge_guest_history(): void
    {
        Sanctum::actingAs($this->user);

        $payload = [
            'items' => [
                [
                    'movie_id' => $this->movie->id,
                    'episode_id' => $this->episode->id,
                    'progress_seconds' => 450,
                    'duration_seconds' => 3600,
                    'watched_at' => now()->toIso8601String(),
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/history/merge', $payload);

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $this->assertDatabaseHas('watch_histories', [
            'user_id' => $this->user->id,
            'movie_id' => $this->movie->id,
            'progress_seconds' => 450,
        ]);
    }
}
