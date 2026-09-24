<?php

namespace Tests\Feature\Api\V1;

use App\Models\Episode;
use App\Models\EpisodeServer;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected Movie $movie;

    protected Episode $episode;

    protected EpisodeServer $server;

    protected function setUp(): void
    {
        parent::setUp();

        $this->movie = Movie::create([
            'name' => 'Kẻ Trộm Mặt Trăng 4',
            'origin_name' => 'Despicable Me 4',
            'slug' => 'ke-trom-mat-trang-4',
            'content' => 'Nội dung...',
            'type' => 'single',
            'status' => 'completed',
            'thumb_url' => 'https://example.com/thumb.jpg',
            'poster_url' => 'https://example.com/poster.jpg',
            'year' => 2026,
            'is_active' => true,
        ]);

        $this->episode = Episode::create([
            'movie_id' => $this->movie->id,
            'name' => 'Tập 1',
            'slug' => 'tap-1',
            'sort_order' => 1,
        ]);

        $this->server = EpisodeServer::create([
            'episode_id' => $this->episode->id,
            'server_name' => 'VIP #1',
            'lang_type' => 'vietsub',
            'link_m3u8' => 'https://example.com/video.m3u8',
            'sort_order' => 1,
            'is_active' => true,
        ]);
    }

    public function test_guest_can_submit_report(): void
    {
        $payload = [
            'episode_id' => $this->episode->id,
            'server_id' => $this->server->id,
            'report_type' => 'broken_link',
            'description' => 'Không thể phát video máy chủ này',
        ];

        $response = $this->postJson('/api/v1/reports', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Báo cáo lỗi đã được gửi thành công.',
            ]);

        $this->assertDatabaseHas('episode_reports', [
            'episode_id' => $this->episode->id,
            'server_id' => $this->server->id,
            'user_id' => null,
            'report_type' => 'broken_link',
            'status' => 'pending',
            'description' => 'Không thể phát video máy chủ này',
        ]);
    }

    public function test_authenticated_user_can_submit_report(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = [
            'episode_id' => $this->episode->id,
            'report_type' => 'no_sound',
            'description' => 'Phim không có tiếng',
        ];

        $response = $this->postJson('/api/v1/reports', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
            ]);

        $this->assertDatabaseHas('episode_reports', [
            'episode_id' => $this->episode->id,
            'server_id' => null,
            'user_id' => $user->id,
            'report_type' => 'no_sound',
            'status' => 'pending',
            'description' => 'Phim không có tiếng',
        ]);
    }

    public function test_submit_report_validation_errors(): void
    {
        // Thiếu episode_id và report_type
        $response = $this->postJson('/api/v1/reports', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['episode_id', 'report_type']);

        // Sai report_type và episode_id không tồn tại
        $response = $this->postJson('/api/v1/reports', [
            'episode_id' => 99999,
            'report_type' => 'invalid_type',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['episode_id', 'report_type']);
    }

    public function test_submit_report_rate_limit(): void
    {
        $payload = [
            'episode_id' => $this->episode->id,
            'report_type' => 'lag',
        ];

        // Gửi 6 lần hợp lệ (throttle:6,1)
        for ($i = 0; $i < 6; $i++) {
            $res = $this->postJson('/api/v1/reports', $payload);
            $res->assertStatus(201);
        }

        // Lần thứ 7 vượt ngưỡng rate limit
        $blocked = $this->postJson('/api/v1/reports', $payload);
        $blocked->assertStatus(429);
    }
}
