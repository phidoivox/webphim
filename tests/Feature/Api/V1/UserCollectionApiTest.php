<?php

namespace Tests\Feature\Api\V1;

use App\Models\Collection;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserCollectionApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected Movie $movie;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['is_active' => true]);
        $this->otherUser = User::factory()->create(['is_active' => true]);

        $this->movie = Movie::create([
            'name' => 'Phim Hay',
            'origin_name' => 'Good Movie',
            'slug' => 'phim-hay-collection',
            'content' => 'Noi dung',
            'type' => 'single',
            'status' => 'completed',
            'poster_url' => 'https://example.com/poster.jpg',
            'is_active' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_manage_collections(): void
    {
        $this->getJson('/api/v1/user/collections')->assertStatus(401);
        $this->postJson('/api/v1/user/collections', ['name' => 'Test'])->assertStatus(401);
    }

    public function test_user_can_create_and_list_collections(): void
    {
        Sanctum::actingAs($this->user);

        $create = $this->postJson('/api/v1/user/collections', [
            'name' => 'Phim Anime bất hủ',
            'description' => 'Tuyển tập anime hay',
            'is_public' => true,
        ]);

        $create->assertStatus(201)
            ->assertJsonPath('data.name', 'Phim Anime bất hủ')
            ->assertJsonPath('data.isPublic', true);

        $this->assertDatabaseHas('collections', [
            'name' => 'Phim Anime bất hủ',
            'created_by' => $this->user->id,
        ]);

        $list = $this->getJson('/api/v1/user/collections');
        $list->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_create_collection_validates_name(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/v1/user/collections', ['name' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_can_update_and_delete_own_collection(): void
    {
        Sanctum::actingAs($this->user);

        $collection = Collection::create([
            'name' => 'Cu',
            'slug' => 'cu-slug',
            'is_public' => true,
            'created_by' => $this->user->id,
        ]);

        $this->putJson("/api/v1/user/collections/{$collection->id}", [
            'name' => 'Moi',
            'is_public' => false,
        ])->assertStatus(200)
            ->assertJsonPath('data.name', 'Moi')
            ->assertJsonPath('data.isPublic', false);

        $this->deleteJson("/api/v1/user/collections/{$collection->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('collections', ['id' => $collection->id]);
    }

    public function test_user_cannot_access_other_users_collection(): void
    {
        $collection = Collection::create([
            'name' => 'Cua Nguoi Khac',
            'slug' => 'cua-nguoi-khac',
            'created_by' => $this->otherUser->id,
        ]);

        Sanctum::actingAs($this->user);

        $this->getJson("/api/v1/user/collections/{$collection->id}")->assertStatus(404);
        $this->putJson("/api/v1/user/collections/{$collection->id}", ['name' => 'Hack'])
            ->assertStatus(404);
        $this->deleteJson("/api/v1/user/collections/{$collection->id}")->assertStatus(404);
    }

    public function test_user_can_add_and_remove_movie(): void
    {
        Sanctum::actingAs($this->user);

        $collection = Collection::create([
            'name' => 'Hanh Dong',
            'slug' => 'hanh-dong',
            'created_by' => $this->user->id,
        ]);

        $add = $this->postJson("/api/v1/user/collections/{$collection->id}/movies", [
            'movie_id' => $this->movie->id,
        ]);
        $add->assertStatus(200);

        // Thêm trùng không tạo pivot trùng
        $this->postJson("/api/v1/user/collections/{$collection->id}/movies", [
            'movie_id' => $this->movie->id,
        ])->assertStatus(200);

        $this->assertEquals(1, $collection->refresh()->movies()->count());

        // thumb_url tự động lấy từ poster phim
        $this->assertEquals('https://example.com/poster.jpg', $collection->refresh()->thumb_url);

        $this->deleteJson("/api/v1/user/collections/{$collection->id}/movies/{$this->movie->id}")
            ->assertStatus(200);

        $this->assertEquals(0, $collection->refresh()->movies()->count());
    }

    public function test_add_nonexistent_movie_fails(): void
    {
        Sanctum::actingAs($this->user);

        $collection = Collection::create([
            'name' => 'Test',
            'slug' => 'test-add-fail',
            'created_by' => $this->user->id,
        ]);

        $this->postJson("/api/v1/user/collections/{$collection->id}/movies", [
            'movie_id' => 999999,
        ])->assertStatus(422);
    }
}
