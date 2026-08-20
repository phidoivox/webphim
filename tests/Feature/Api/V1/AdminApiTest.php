<?php

namespace Tests\Feature\Api\V1;

use App\Models\Episode;
use App\Models\Genre;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_api(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard/stats');
        $response->assertUnauthorized();
    }

    public function test_regular_user_cannot_access_admin_api(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'is_active' => true,
        ]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/admin/dashboard/stats');
        $response->assertForbidden();
    }

    public function test_admin_can_access_dashboard_stats(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
        Sanctum::actingAs($admin);

        Movie::query()->create([
            'name' => 'Phim 1',
            'slug' => 'phim-1',
            'type' => 'single',
            'quality' => 'HD',
            'status' => 'completed',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/admin/dashboard/stats');
        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'data' => [
                    'kpis' => [
                        'totalMovies',
                        'activeMovies',
                        'totalEpisodes',
                        'totalUsers',
                        'totalViews',
                        'totalComments',
                        'pendingReports',
                    ],
                    'recentMovies',
                    'recentReports',
                    'topViewedMovies',
                ],
            ]);
    }

    public function test_admin_can_crud_movies(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        $genre = Genre::query()->create(['name' => 'Hành Động', 'slug' => 'hanh-dong']);

        // 1. Create Movie
        $createRes = $this->postJson('/api/v1/admin/movies', [
            'name' => 'Phim Mới Thêm',
            'type' => 'single',
            'status' => 'completed',
            'quality' => 'HD',
            'year' => 2026,
            'genre_ids' => [$genre->id],
        ]);
        $createRes->assertCreated();
        $movieId = $createRes->json('data.id');

        // 2. Read Movie
        $getRes = $this->getJson("/api/v1/admin/movies/{$movieId}");
        $getRes->assertOk()
            ->assertJsonPath('data.name', 'Phim Mới Thêm');

        // 3. Update Movie
        $updateRes = $this->putJson("/api/v1/admin/movies/{$movieId}", [
            'name' => 'Phim Đã Sửa',
        ]);
        $updateRes->assertOk();

        // 4. Toggle Status
        $toggleRes = $this->patchJson("/api/v1/admin/movies/{$movieId}/toggle", [
            'field' => 'is_featured',
        ]);
        $toggleRes->assertOk()
            ->assertJsonPath('data.is_featured', true);

        // 5. Delete Movie
        $deleteRes = $this->deleteJson("/api/v1/admin/movies/{$movieId}");
        $deleteRes->assertOk();
    }

    public function test_admin_can_manage_episodes_and_servers(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        $movie = Movie::query()->create([
            'name' => 'Phim Bộ Test',
            'slug' => 'phim-bo-test',
            'type' => 'series',
            'quality' => 'HD',
            'status' => 'ongoing',
            'is_active' => true,
        ]);

        // 1. Add Episode with Server
        $epRes = $this->postJson("/api/v1/admin/movies/{$movie->id}/episodes", [
            'name' => 'Tập 1',
            'slug' => 'tap-1',
            'servers' => [
                [
                    'server_name' => 'VIP 1',
                    'lang_type' => 'vietsub',
                    'link_m3u8' => 'https://stream.example.com/tap1.m3u8',
                ],
            ],
        ]);
        $epRes->assertCreated();
        $epId = $epRes->json('data.id');

        // 2. List Episodes
        $listRes = $this->getJson("/api/v1/admin/movies/{$movie->id}/episodes");
        $listRes->assertOk()
            ->assertJsonCount(1, 'data.episodes');

        // 3. Delete Episode
        $this->deleteJson("/api/v1/admin/episodes/{$epId}")->assertOk();
    }
}
