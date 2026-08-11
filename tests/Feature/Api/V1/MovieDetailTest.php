<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MovieDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_movie_detail_returns_full_json(): void
    {
        $this->seed();

        $response = $this->getJson('/api/v1/movies/phim-1');

        $response->assertOk();
        $response->assertJsonPath('data.name', 'Mặt Trời Đỏ');
        $response->assertJsonPath('data.type', 'series');
        $response->assertJsonCount(12, 'data.episodes');
        $response->assertJsonCount(2, 'data.episodes.0.servers');
        $response->assertJsonStructure([
            'data' => [
                'id', 'slug', 'name', 'originName', 'thumbUrl', 'posterUrl', 'content',
                'year', 'quality', 'type', 'status', 'episodeCurrent', 'episodeTotal',
                'ratingAvg', 'ratingCount', 'viewCount', 'isCinema', 'isNew', 'isHot',
                'trailerUrl', 'durationMinutes', 'genres', 'countries',
                'episodes' => ['*' => ['id', 'name', 'slug', 'servers' => ['*' => ['id', 'serverName', 'langType', 'linkM3u8']]]],
                'credits' => [
                    'directors' => ['*' => ['id', 'name', 'avatarUrl']],
                    'actors' => ['*' => ['id', 'name', 'avatarUrl', 'characterName']],
                ],
                'similar' => ['*' => ['id', 'slug', 'name', 'thumbUrl', 'year', 'quality', 'type', 'ratingAvg', 'genres']],
            ],
        ]);
    }

    public function test_unknown_slug_returns_404(): void
    {
        $this->seed();

        $this->getJson('/api/v1/movies/phim-999')->assertNotFound();
    }

    public function test_single_movie_has_one_full_episode(): void
    {
        $this->seed();

        $response = $this->getJson('/api/v1/movies/phim-2');

        $response->assertOk();
        $response->assertJsonCount(1, 'data.episodes');
        $response->assertJsonPath('data.episodes.0.name', 'Full');
    }
}
