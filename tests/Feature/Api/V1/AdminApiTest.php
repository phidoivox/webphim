<?php

namespace Tests\Feature\Api\V1;

use App\Models\Episode;
use App\Models\Genre;
use App\Models\Movie;
use App\Models\Person;
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

        // 3. Update Episode
        $updateEpRes = $this->putJson("/api/v1/admin/episodes/{$epId}", [
            'name' => 'Tập 1 (Bản Đẹp)',
            'slug' => 'tap-1',
            'servers' => [
                [
                    'server_name' => 'VIP 1 HD',
                    'lang_type' => 'vietsub',
                    'link_m3u8' => 'https://stream.example.com/tap1_hd.m3u8',
                ],
            ],
        ]);
        $updateEpRes->assertOk()
            ->assertJsonPath('data.name', 'Tập 1 (Bản Đẹp)');

        // 4. Delete Episode
        $this->deleteJson("/api/v1/admin/episodes/{$epId}")->assertOk();
    }

    public function test_admin_can_read_movie_with_actors_and_directors_without_missing_bio_error(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        $person = Person::query()->create([
            'name' => 'Tom Cruise',
            'slug' => 'tom-cruise',
            'biography' => 'Diễn viên Hollywood nổi tiếng',
            'avatar_url' => 'https://example.com/avatar.jpg',
        ]);

        $movie = Movie::query()->create([
            'name' => 'Nhiệm Vụ Bất Khả Thi',
            'slug' => 'nhiem-vu-bat-kha-thi',
            'type' => 'single',
            'quality' => 'HD',
            'status' => 'completed',
            'is_active' => true,
        ]);

        $movie->people()->attach($person->id, [
            'role' => 'actor',
            'character_name' => 'Ethan Hunt',
            'sort_order' => 1,
        ]);

        $movie->people()->attach($person->id, [
            'role' => 'director',
            'character_name' => null,
            'sort_order' => 1,
        ]);

        // GET Movie detail should succeed and return biography and avatarUrl
        $res = $this->getJson("/api/v1/admin/movies/{$movie->id}");
        $res->assertOk()
            ->assertJsonPath('data.actors.0.name', 'Tom Cruise')
            ->assertJsonPath('data.actors.0.biography', 'Diễn viên Hollywood nổi tiếng')
            ->assertJsonPath('data.actors.0.avatarUrl', 'https://example.com/avatar.jpg')
            ->assertJsonPath('data.directors.0.name', 'Tom Cruise')
            ->assertJsonPath('data.directors.0.biography', 'Diễn viên Hollywood nổi tiếng');
    }

    public function test_admin_can_crud_taxonomies_genres_countries_and_people(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        // 1. Create Genre with description (which maps to meta_description)
        $genreRes = $this->postJson('/api/v1/admin/genres', [
            'name' => 'Kinh Dị Siêu Nhiên',
            'description' => 'Tuyển tập các bộ phim kinh dị siêu nhiên đáng sợ nhất',
        ]);
        $genreRes->assertCreated()
            ->assertJsonPath('data.name', 'Kinh Dị Siêu Nhiên');
        $genreId = $genreRes->json('data.id');

        // Update Genre
        $updateGenreRes = $this->putJson("/api/v1/admin/genres/{$genreId}", [
            'name' => 'Kinh Dị Siêu Nhiên Update',
            'description' => 'Mô tả thể loại đã cập nhật',
        ]);
        $updateGenreRes->assertOk();

        // 2. Create Country with description (which maps to meta_description)
        $countryRes = $this->postJson('/api/v1/admin/countries', [
            'name' => 'Việt Nam Mới',
            'description' => 'Phim sản xuất tại Việt Nam',
        ]);
        $countryRes->assertCreated()
            ->assertJsonPath('data.name', 'Việt Nam Mới');
        $countryId = $countryRes->json('data.id');

        // Update Country
        $updateCountryRes = $this->putJson("/api/v1/admin/countries/{$countryId}", [
            'name' => 'Việt Nam Mới Update',
        ]);
        $updateCountryRes->assertOk();

        // 3. Create, Update, Delete Person (People Taxonomy)
        $personRes = $this->postJson('/api/v1/admin/people', [
            'name' => 'Trấn Thành',
            'biography' => 'Nghệ sĩ, đạo diễn và diễn viên Việt Nam',
            'avatar_url' => 'https://example.com/tran-thanh.jpg',
        ]);
        $personRes->assertCreated()
            ->assertJsonPath('data.name', 'Trấn Thành')
            ->assertJsonPath('data.biography', 'Nghệ sĩ, đạo diễn và diễn viên Việt Nam');
        $personId = $personRes->json('data.id');

        // Update Person
        $updatePersonRes = $this->putJson("/api/v1/admin/people/{$personId}", [
            'name' => 'Trấn Thành (Đạo Diễn)',
            'biography' => 'Đạo diễn phim chiếu rạp',
        ]);
        $updatePersonRes->assertOk()
            ->assertJsonPath('data.name', 'Trấn Thành (Đạo Diễn)')
            ->assertJsonPath('data.biography', 'Đạo diễn phim chiếu rạp');

        // List People
        $listPeopleRes = $this->getJson('/api/v1/admin/people?q=Trấn');
        $listPeopleRes->assertOk()
            ->assertJsonCount(1, 'data');

        // Delete Person
        $deletePersonRes = $this->deleteJson("/api/v1/admin/people/{$personId}");
        $deletePersonRes->assertOk();

        // Delete Genre & Country
        $this->deleteJson("/api/v1/admin/genres/{$genreId}")->assertOk();
        $this->deleteJson("/api/v1/admin/countries/{$countryId}")->assertOk();
    }

    public function test_user_model_authorization_methods(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($admin->isSuperAdmin());
        $this->assertFalse($admin->isModerator());

        $mod = User::factory()->create(['role' => 'moderator', 'is_active' => true]);
        $this->assertTrue($mod->isAdmin());
        $this->assertFalse($mod->isSuperAdmin());
        $this->assertTrue($mod->isModerator());

        $user = User::factory()->create(['role' => 'user', 'is_active' => true]);
        $this->assertFalse($user->isAdmin());
        $this->assertFalse($user->isSuperAdmin());
        $this->assertFalse($user->isModerator());

        $bannedAdmin = User::factory()->create(['role' => 'admin', 'is_active' => false]);
        $this->assertFalse($bannedAdmin->isAdmin());
    }

    public function test_admin_can_create_movie_with_episodes_and_servers(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        $payload = [
            'name' => 'Phim Bộ PhimAPI Test',
            'type' => 'series',
            'status' => 'ongoing',
            'quality' => 'FHD',
            'episodes' => [
                [
                    'name' => 'Tập 01',
                    'slug' => 'tap-01',
                    'sort_order' => 1,
                    'servers' => [
                        [
                            'server_name' => 'Vietsub',
                            'lang_type' => 'vietsub',
                            'link_m3u8' => 'https://stream.example.com/tap01.m3u8',
                            'link_embed' => 'https://embed.example.com/tap01',
                        ],
                        [
                            'server_name' => 'Thuyết Minh',
                            'lang_type' => 'thuyet-minh',
                            'link_m3u8' => 'https://stream.example.com/tap01_tm.m3u8',
                        ],
                    ],
                ],
                [
                    'name' => 'Tập 02',
                    'slug' => 'tap-02',
                    'sort_order' => 2,
                    'servers' => [
                        [
                            'server_name' => 'Vietsub',
                            'lang_type' => 'vietsub',
                            'link_m3u8' => 'https://stream.example.com/tap02.m3u8',
                        ],
                    ],
                ],
            ],
        ];

        $res = $this->postJson('/api/v1/admin/movies', $payload);
        $res->assertCreated();
        $movieId = $res->json('data.id');

        $this->assertDatabaseHas('episodes', [
            'movie_id' => $movieId,
            'slug' => 'tap-01',
            'name' => 'Tập 01',
        ]);
        $this->assertDatabaseHas('episodes', [
            'movie_id' => $movieId,
            'slug' => 'tap-02',
            'name' => 'Tập 02',
        ]);
        $this->assertDatabaseCount('episodes', 2);
        $this->assertDatabaseCount('episode_servers', 3);
    }

    public function test_adding_episode_invalidates_movie_detail_cache(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        $movie = Movie::query()->create([
            'name' => 'Phim Cache Test',
            'slug' => 'phim-cache-test',
            'type' => 'series',
            'quality' => 'HD',
            'status' => 'ongoing',
            'is_active' => true,
        ]);

        // Warm cache: detail chưa có tập nào
        $this->getJson('/api/v1/movies/phim-cache-test')
            ->assertOk()
            ->assertJsonCount(0, 'data.episodes');

        // Thêm tập mới qua admin API
        $this->postJson("/api/v1/admin/movies/{$movie->id}/episodes", [
            'name' => 'Tập 1',
            'slug' => 'tap-1',
        ])->assertCreated();

        // Detail phải thấy tập mới mà không cần flush thủ công
        $this->getJson('/api/v1/movies/phim-cache-test')
            ->assertOk()
            ->assertJsonCount(1, 'data.episodes')
            ->assertJsonPath('data.episodes.0.slug', 'tap-1');
    }

    public function test_admin_can_bulk_sync_episodes_for_movie(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        $movie = Movie::query()->create([
            'name' => 'Phim Cần Đồng Bộ Tập',
            'slug' => 'phim-can-dong-bo-tap',
            'type' => 'series',
            'quality' => 'HD',
            'status' => 'ongoing',
            'is_active' => true,
        ]);

        $syncPayload = [
            'episodes' => [
                [
                    'name' => 'Tập 01',
                    'slug' => 'tap-01',
                    'sort_order' => 1,
                    'servers' => [
                        [
                            'server_name' => 'Vietsub #1',
                            'lang_type' => 'vietsub',
                            'link_m3u8' => 'https://stream.example.com/tap1.m3u8',
                        ],
                    ],
                ],
                [
                    'name' => 'Tập 02',
                    'slug' => 'tap-02',
                    'sort_order' => 2,
                    'servers' => [
                        [
                            'server_name' => 'Vietsub #1',
                            'lang_type' => 'vietsub',
                            'link_m3u8' => 'https://stream.example.com/tap2.m3u8',
                        ],
                    ],
                ],
            ],
        ];

        $res = $this->postJson("/api/v1/admin/movies/{$movie->id}/episodes/sync", $syncPayload);
        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.count', 2)
            ->assertJsonPath('data.servers_count', 2);

        $this->assertDatabaseCount('episodes', 2);
        $this->assertEquals('Tập 2', $movie->fresh()->episode_current);
    }
}
