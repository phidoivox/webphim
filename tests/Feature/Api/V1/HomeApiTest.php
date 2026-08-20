<?php

namespace Tests\Feature\Api\V1;

use App\Models\Movie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HomeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_home_data_returns_hero_and_sections(): void
    {
        Movie::query()->create([
            'name' => 'Phim Test 1',
            'slug' => 'phim-test-1',
            'type' => 'series',
            'quality' => 'HD',
            'status' => 'ongoing',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/home');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'heroMovies' => [
                        '*' => [
                            'id',
                            'slug',
                            'name',
                            'thumbUrl',
                            'posterUrl',
                            'backdropUrl',
                        ],
                    ],
                    'sections' => [
                        '*' => [
                            'id',
                            'title',
                            'movies' => [
                                '*' => [
                                    'id',
                                    'slug',
                                    'name',
                                    'thumbUrl',
                                    'posterUrl',
                                ],
                            ],
                        ],
                    ],
                ],
            ]);
    }

    public function test_inactive_and_soft_deleted_movies_are_excluded_from_home(): void
    {
        // Phim active
        Movie::query()->create([
            'name' => 'Phim Hoạt Động',
            'slug' => 'phim-hoat-dong',
            'type' => 'single',
            'quality' => 'HD',
            'status' => 'completed',
            'is_active' => true,
            'is_cinema' => true,
        ]);

        // Phim inactive type single (trước đây bị leak vì lỗi orWhere)
        Movie::query()->create([
            'name' => 'Phim Đã Tắt Kích Hoạt',
            'slug' => 'phim-inactive-single',
            'type' => 'single',
            'quality' => 'HD',
            'status' => 'completed',
            'is_active' => false,
            'is_cinema' => true,
        ]);

        // Phim soft-deleted
        $deleted = Movie::query()->create([
            'name' => 'Phim Đã Xóa',
            'slug' => 'phim-da-xoa',
            'type' => 'single',
            'quality' => 'HD',
            'status' => 'completed',
            'is_active' => true,
            'is_cinema' => true,
        ]);
        $deleted->delete();

        Cache::flush();
        $response = $this->getJson('/api/v1/home');
        $response->assertOk();

        $allSlugs = collect($response->json('data.sections'))
            ->flatMap(fn ($s) => collect($s['movies'])->pluck('slug'))
            ->unique()
            ->values()
            ->all();

        $this->assertContains('phim-hoat-dong', $allSlugs);
        $this->assertNotContains('phim-inactive-single', $allSlugs);
        $this->assertNotContains('phim-da-xoa', $allSlugs);
    }

    public function test_movie_observer_automatically_invalidates_home_cache(): void
    {
        $movie = Movie::query()->create([
            'name' => 'Phim Gốc',
            'slug' => 'phim-goc',
            'type' => 'series',
            'quality' => 'HD',
            'status' => 'ongoing',
            'is_active' => true,
        ]);

        // First call populates cache
        $firstResponse = $this->getJson('/api/v1/home');
        $firstResponse->assertOk();
        $this->assertContains('phim-goc', collect($firstResponse->json('data.sections'))->flatMap(fn ($s) => collect($s['movies'])->pluck('slug'))->all());

        // Update movie title/slug (Observer should trigger cache flush)
        $movie->update(['name' => 'Phim Đã Cập Nhật']);

        // Next call should reflect updated data without manual flush
        $secondResponse = $this->getJson('/api/v1/home');
        $secondResponse->assertOk();
        $allNames = collect($secondResponse->json('data.sections'))
            ->flatMap(fn ($s) => collect($s['movies'])->pluck('name'))
            ->all();

        $this->assertContains('Phim Đã Cập Nhật', $allNames);
    }
}
