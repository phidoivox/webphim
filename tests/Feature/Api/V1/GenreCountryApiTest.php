<?php

namespace Tests\Feature\Api\V1;

use Database\Seeders\MovieTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GenreCountryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_list_of_genres_with_active_movie_counts(): void
    {
        $this->seed(MovieTestSeeder::class);

        $response = $this->getJson('/api/v1/genres');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'moviesCount',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
    }

    public function test_can_get_list_of_countries(): void
    {
        $this->seed(MovieTestSeeder::class);

        $response = $this->getJson('/api/v1/countries');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
    }
}
