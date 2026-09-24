<?php

namespace Tests\Feature\Api\V1;

use App\Models\Collection;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCollectionApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Movie $movie;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Nguoi Chia Se',
            'is_active' => true,
        ]);

        $this->movie = Movie::create([
            'name' => 'Phim Cong Khai',
            'origin_name' => 'Public Movie',
            'slug' => 'phim-cong-khai',
            'content' => 'Noi dung',
            'type' => 'single',
            'status' => 'completed',
            'is_active' => true,
        ]);
    }

    public function test_guest_can_view_public_profile_with_public_collections_only(): void
    {
        $public = Collection::create([
            'name' => 'Cong Khai',
            'slug' => 'cong-khai-test',
            'is_public' => true,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        Collection::create([
            'name' => 'Rieng Tu',
            'slug' => 'rieng-tu-test',
            'is_public' => false,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        $response = $this->getJson("/api/v1/users/{$this->user->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.user.name', 'Nguoi Chia Se')
            ->assertJsonPath('data.user.collectionsCount', 1)
            ->assertJsonCount(1, 'data.collections')
            ->assertJsonPath('data.collections.0.slug', 'cong-khai-test');
    }

    public function test_guest_can_view_public_collection_detail(): void
    {
        $collection = Collection::create([
            'name' => 'Anime Hay',
            'slug' => 'anime-hay-public',
            'description' => 'Mo ta',
            'is_public' => true,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);
        $collection->movies()->attach($this->movie->id);

        $response = $this->getJson('/api/v1/collections/anime-hay-public');

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Anime Hay')
            ->assertJsonPath('data.creator.name', 'Nguoi Chia Se')
            ->assertJsonCount(1, 'data.movies');
    }

    public function test_guest_cannot_view_private_collection(): void
    {
        Collection::create([
            'name' => 'Bi Mat',
            'slug' => 'bi-mat-private',
            'is_public' => false,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        $this->getJson('/api/v1/collections/bi-mat-private')->assertStatus(404);
    }

    public function test_guest_gets_404_for_missing_collection(): void
    {
        $this->getJson('/api/v1/collections/khong-ton-tai')->assertStatus(404);
    }
}
