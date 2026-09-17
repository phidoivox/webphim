<?php

namespace Tests\Feature\Api;

use App\Models\Genre;
use App\Models\Movie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_access_weekly_schedule(): void
    {
        $genre = Genre::create([
            'name' => 'Hành Động',
            'slug' => 'hanh-dong',
        ]);

        $movieMon = Movie::create([
            'name' => 'Phim Thứ Hai',
            'slug' => 'phim-thu-hai',
            'type' => 'series',
            'status' => 'ongoing',
            'schedule_days' => [1],
            'notify_schedule' => 'Thứ 2 hàng tuần',
            'is_active' => true,
            'rating_avg' => 8.5,
        ]);
        $movieMon->genres()->attach($genre->id);

        $movieFri = Movie::create([
            'name' => 'Phim Thứ Sáu',
            'slug' => 'phim-thu-sau',
            'type' => 'series',
            'status' => 'ongoing',
            'schedule_days' => [5],
            'notify_schedule' => 'Thứ 6 hàng tuần',
            'is_active' => true,
            'rating_avg' => 9.0,
        ]);

        $response = $this->getJson('/api/v1/schedule');

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
            ])
            ->assertJsonStructure([
                'status',
                'data' => [
                    '0', '1', '2', '3', '4', '5', '6',
                ],
            ]);

        // Thứ 2 (day 1) có 1 phim
        $this->assertCount(1, $response->json('data.1'));
        $this->assertEquals('Phim Thứ Hai', $response->json('data.1.0.name'));
        $this->assertEquals(['Hành Động'], $response->json('data.1.0.genres'));

        // Thứ 6 (day 5) có 1 phim
        $this->assertCount(1, $response->json('data.5'));
        $this->assertEquals('Phim Thứ Sáu', $response->json('data.5.0.name'));

        // Thứ 3 (day 2) trống
        $this->assertCount(0, $response->json('data.2'));
    }

    public function test_inactive_movies_are_excluded_from_schedule(): void
    {
        Movie::create([
            'name' => 'Phim Ẩn',
            'slug' => 'phim-an',
            'type' => 'series',
            'schedule_days' => [1],
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/schedule');

        $response->assertOk();
        $this->assertCount(0, $response->json('data.1'));
    }

    public function test_completed_and_single_movies_are_excluded_from_schedule(): void
    {
        Movie::create([
            'name' => 'Phim Đã Xong',
            'slug' => 'phim-da-xong',
            'type' => 'series',
            'status' => 'completed',
            'schedule_days' => [1],
            'is_active' => true,
        ]);
        Movie::create([
            'name' => 'Phim Lẻ',
            'slug' => 'phim-le',
            'type' => 'single',
            'status' => 'ongoing',
            'schedule_days' => [1],
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/schedule');

        $response->assertOk();
        $this->assertCount(0, $response->json('data.1'));
    }

    public function test_day_query_param_returns_single_day_list(): void
    {
        Movie::create([
            'name' => 'Phim Thứ Hai',
            'slug' => 'phim-thu-hai-day',
            'type' => 'series',
            'status' => 'ongoing',
            'schedule_days' => [1],
            'is_active' => true,
        ]);
        Movie::create([
            'name' => 'Phim Thứ Sáu',
            'slug' => 'phim-thu-sau-day',
            'type' => 'series',
            'status' => 'ongoing',
            'schedule_days' => [5],
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/schedule?day=1');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Phim Thứ Hai', $response->json('data.0.name'));

        $this->getJson('/api/v1/schedule?day=7')->assertStatus(422);
    }

    public function test_notify_schedule_text_auto_parses_schedule_days(): void
    {
        $movie = Movie::create([
            'name' => 'Phim Tự Parse',
            'slug' => 'phim-tu-parse',
            'type' => 'series',
            'status' => 'ongoing',
            'notify_schedule' => 'Thứ 6 hàng tuần lúc 20h',
            'is_active' => true,
        ]);

        $this->assertEquals([5], $movie->fresh()->schedule_days);

        // Checkboxes đã chọn thì giữ, không bị text ghi đè
        $explicit = Movie::create([
            'name' => 'Phim Chọn Tay',
            'slug' => 'phim-chon-tay',
            'type' => 'series',
            'status' => 'ongoing',
            'notify_schedule' => 'Thứ 6 hàng tuần',
            'schedule_days' => [2],
            'is_active' => true,
        ]);

        $this->assertEquals([2], $explicit->fresh()->schedule_days);

        $response = $this->getJson('/api/v1/schedule');
        $response->assertOk();
        $this->assertCount(1, $response->json('data.5'));
        $this->assertCount(1, $response->json('data.2'));
    }

    public function test_movie_with_multiple_schedule_days_appears_on_each_day(): void
    {
        Movie::create([
            'name' => 'Phim Nhiều Ngày',
            'slug' => 'phim-nhieu-ngay',
            'type' => 'series',
            'status' => 'ongoing',
            'schedule_days' => [1, 3, 5],
            'notify_schedule' => 'Thứ 2, Thứ 4, Thứ 6',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/schedule');
        $response->assertOk();

        // Phim xuất hiện ở cả 3 ngày
        $this->assertCount(1, $response->json('data.1'));
        $this->assertCount(1, $response->json('data.3'));
        $this->assertCount(1, $response->json('data.5'));
        $this->assertEquals('Phim Nhiều Ngày', $response->json('data.1.0.name'));
        $this->assertEquals('Phim Nhiều Ngày', $response->json('data.3.0.name'));

        // Không xuất hiện ở ngày khác
        $this->assertCount(0, $response->json('data.0'));
        $this->assertCount(0, $response->json('data.2'));

        // ?day filter cũng hoạt động
        $day1 = $this->getJson('/api/v1/schedule?day=1');
        $this->assertCount(1, $day1->json('data'));

        $day2 = $this->getJson('/api/v1/schedule?day=2');
        $this->assertCount(0, $day2->json('data'));
    }

    public function test_parse_schedule_days_multi(): void
    {
        $movie = Movie::create([
            'name' => 'Phim Parse Multi',
            'slug' => 'phim-parse-multi',
            'type' => 'series',
            'status' => 'ongoing',
            'notify_schedule' => 'Thứ 3 và Thứ 6 lúc 21h',
            'is_active' => true,
        ]);

        $days = $movie->fresh()->schedule_days;
        sort($days);
        $this->assertEquals([2, 5], $days);
    }
}
