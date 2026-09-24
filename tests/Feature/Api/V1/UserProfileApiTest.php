<?php

namespace Tests\Feature\Api\V1;

use App\Models\Bookmark;
use App\Models\Collection;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserProfileApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Nguyen Van A',
            'email' => 'profile@example.com',
            'password' => Hash::make('matkhau123'),
            'is_active' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $this->getJson('/api/v1/user/profile')->assertStatus(401);
        $this->putJson('/api/v1/user/profile', ['name' => 'Moi'])->assertStatus(401);
    }

    public function test_authenticated_user_can_get_profile_with_stats(): void
    {
        Sanctum::actingAs($this->user);

        $movie = Movie::create([
            'name' => 'Phim Test',
            'origin_name' => 'Test Movie',
            'slug' => 'phim-test-profile',
            'content' => 'Noi dung',
            'type' => 'single',
            'status' => 'completed',
            'is_active' => true,
        ]);

        Bookmark::create(['user_id' => $this->user->id, 'movie_id' => $movie->id, 'type' => 'favorite']);
        Collection::create([
            'name' => 'BST Test',
            'slug' => 'bst-test',
            'created_by' => $this->user->id,
        ]);

        $response = $this->getJson('/api/v1/user/profile');

        $response->assertStatus(200)
            ->assertJsonPath('data.user.name', 'Nguyen Van A')
            ->assertJsonPath('data.stats.collectionsCount', 1)
            ->assertJsonPath('data.stats.bookmarksCount', 1);
    }

    public function test_user_can_update_name_and_avatar(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->putJson('/api/v1/user/profile', [
            'name' => 'Tran Thi B',
            'avatar_url' => 'https://example.com/avatar.png',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Tran Thi B')
            ->assertJsonPath('data.avatarUrl', 'https://example.com/avatar.png');
    }

    public function test_user_can_change_password_with_current_password(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->putJson('/api/v1/user/profile', [
            'current_password' => 'matkhau123',
            'password' => 'matkhaumoi456',
            'password_confirmation' => 'matkhaumoi456',
        ]);

        $response->assertStatus(200);

        $this->assertTrue(Hash::check('matkhaumoi456', $this->user->refresh()->password));
    }

    public function test_change_password_fails_with_wrong_current_password(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->putJson('/api/v1/user/profile', [
            'current_password' => 'sai-matkhau',
            'password' => 'matkhaumoi456',
            'password_confirmation' => 'matkhaumoi456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }
}
