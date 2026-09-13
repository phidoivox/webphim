<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_successfully(): void
    {
        $payload = [
            'name' => 'Nguyen Van A',
            'email' => 'nguyenvana@example.com',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'subscriptionType',
                        'subscriptionExpiresAt',
                        'avatarUrl',
                        'isActive',
                        'createdAt',
                    ],
                    'token',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'nguyenvana@example.com',
            'name' => 'Nguyen Van A',
            'role' => 'user',
            'subscription_type' => 'free',
            'is_active' => true,
        ]);
    }

    public function test_registration_fails_with_invalid_data(): void
    {
        // 1. Test missing fields
        $response = $this->postJson('/api/v1/auth/register', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);

        // 2. Test password confirmation mismatch
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'matkhau123',
            'password_confirmation' => 'khac_matkhau',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // 3. Test duplicate email
        User::factory()->create(['email' => 'duplicate@example.com']);
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'duplicate@example.com',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'secret123',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'subscriptionType',
                    ],
                    'token',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'secret123',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'banned@example.com',
            'password' => 'secret123',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'banned@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt.',
            ]);
    }

    public function test_authenticated_user_can_get_profile_via_me(): void
    {
        $user = User::factory()->create([
            'name' => 'Nguyen Van B',
            'email' => 'nguyenvanb@example.com',
            'role' => 'user',
            'subscription_type' => 'vip',
            'is_active' => true,
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $user->id,
                    'name' => 'Nguyen Van B',
                    'email' => 'nguyenvanb@example.com',
                    'role' => 'user',
                    'subscriptionType' => 'vip',
                ],
            ]);
    }

    public function test_unauthenticated_request_to_me_returns_401(): void
    {
        $response = $this->getJson('/api/v1/auth/me');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_logout_and_revoke_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('logout_test_token')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Đăng xuất thành công.',
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_user_can_revoke_all_tokens(): void
    {
        $user = User::factory()->create();
        $t1 = $user->createToken('a')->plainTextToken;
        $t2 = $user->createToken('b')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$t1}")
            ->postJson('/api/v1/auth/logout-all')
            ->assertOk()
            ->assertJsonPath('data.revokedCount', 2);

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->withHeader('Authorization', "Bearer {$t2}")->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_login_token_expiry_follows_remember_me(): void
    {
        $user = User::factory()->create(['email' => 'ttl@example.com', 'password' => 'secret123', 'is_active' => true]);

        $long = $this->postJson('/api/v1/auth/login', ['email' => 'ttl@example.com', 'password' => 'secret123', 'remember_me' => true]);
        $long->assertOk();
        $longToken = $user->tokens()->latest('id')->first();
        $this->assertEqualsWithDelta(now()->addDays(30)->timestamp, $longToken->expires_at->timestamp, 120);

        $short = $this->postJson('/api/v1/auth/login', ['email' => 'ttl@example.com', 'password' => 'secret123', 'remember_me' => false]);
        $short->assertOk();
        $shortToken = $user->tokens()->latest('id')->first();
        $this->assertEqualsWithDelta(now()->addHours(24)->timestamp, $shortToken->expires_at->timestamp, 120);
    }

    public function test_login_sets_httponly_auth_cookie(): void
    {
        User::factory()->create(['email' => 'cookie@example.com', 'password' => 'secret123', 'is_active' => true]);

        $response = $this->postJson('/api/v1/auth/login', ['email' => 'cookie@example.com', 'password' => 'secret123']);
        $response->assertOk();
        $cookie = $response->headers->getCookies()[0] ?? null;
        $this->assertNotNull($cookie);
        $this->assertSame('auth_token', $cookie->getName());
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_register_sets_httponly_auth_cookie(): void
    {
        $payload = [
            'name' => 'Cookie User',
            'email' => 'cookie_reg@example.com',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);
        $response->assertStatus(201);
        $cookie = $response->headers->getCookies()[0] ?? null;
        $this->assertNotNull($cookie);
        $this->assertSame('auth_token', $cookie->getName());
        $this->assertTrue($cookie->isHttpOnly());
    }

    public function test_logout_clears_auth_cookie(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('logout_cookie_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');

        $response->assertOk();
        $response->assertCookieExpired('auth_token');
    }

    public function test_logout_all_clears_auth_cookie(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('logout_all_cookie_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout-all');

        $response->assertOk();
        $response->assertCookieExpired('auth_token');
    }
}

