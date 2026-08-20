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
            'schedule_day_of_week' => 1,
            'notify_schedule' => 'Thứ 2 hàng tuần',
            'is_active' => true,
            'rating_avg' => 8.5,
        ]);
        $movieMon->genres()->attach($genre->id);

        $movieFri = Movie::create([
            'name' => 'Phim Thứ Sáu',
            'slug' => 'phim-thu-sau',
            'type' => 'series',
            'schedule_day_of_week' => 5,
            'notify_schedule' => 'Thứ 6 hàng tuần',
            'is_active' => true,
            'rating_avg' => 9.0,
        ]);

        $response = $this->getJson('/api/v1/schedule');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
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
            'schedule_day_of_week' => 1,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/schedule');

        $response->assertOk();
        $this->assertCount(0, $response->json('data.1'));
    }
}
