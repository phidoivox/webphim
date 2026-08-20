<?php

namespace Tests\Feature\Api\V1;

use Database\Seeders\MovieTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MovieFilterApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MovieTestSeeder::class);
    }

    public function test_can_filter_movies_by_type(): void
    {
        $response = $this->getJson('/api/v1/movies?type=series');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'name', 'thumbUrl', 'year', 'quality', 'type'],
                ],
                'meta' => ['currentPage', 'lastPage', 'perPage', 'total'],
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $movie) {
            $this->assertEquals('series', $movie['type']);
        }
    }

    public function test_can_filter_movies_by_genre(): void
    {
        $response = $this->getJson('/api/v1/movies?genre=hanh-dong');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $movie) {
            $this->assertContains('Hành động', $movie['genres']);
        }
    }

    public function test_can_filter_movies_by_country(): void
    {
        $response = $this->getJson('/api/v1/movies?country=han-quoc');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotEmpty($data);
    }

    public function test_can_filter_movies_by_year(): void
    {
        $response = $this->getJson('/api/v1/movies?year=2026');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $movie) {
            $this->assertEquals(2026, $movie['year']);
        }
    }

    public function test_can_sort_movies_by_views(): void
    {
        $response = $this->getJson('/api/v1/movies?sort=views');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertNotEmpty($data);
    }

    public function test_pagination_meta_structure(): void
    {
        $response = $this->getJson('/api/v1/movies?page=1&per_page=3');

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
        $this->assertEquals(1, $response->json('meta.currentPage'));
        $this->assertEquals(3, $response->json('meta.perPage'));
        $this->assertGreaterThan(3, $response->json('meta.total'));
    }

    public function test_can_search_movies_and_actors_by_keyword(): void
    {
        $response = $this->getJson('/api/v1/movies/search?q=Mặt Trời');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'movies' => [
                        '*' => ['id', 'slug', 'name', 'thumbUrl', 'year'],
                    ],
                    'actors' => [
                        '*' => ['id', 'slug', 'name', 'avatarUrl', 'role', 'knownFor'],
                    ],
                ],
            ]);

        $movies = $response->json('data.movies');
        $this->assertNotEmpty($movies);
        $this->assertStringContainsString('Mặt Trời', $movies[0]['name']);
    }

    public function test_filter_validation_rejects_invalid_sort(): void
    {
        $response = $this->getJson('/api/v1/movies?sort=sql_injection_attempt');
        $response->assertUnprocessable();
    }
}
