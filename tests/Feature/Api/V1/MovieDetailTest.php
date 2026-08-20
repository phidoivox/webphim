<?php

namespace Tests\Feature\Api\V1;

use App\Models\Movie;
use Database\Seeders\MovieTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MovieDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_movie_detail_returns_full_json(): void
    {
        $this->seed(MovieTestSeeder::class);

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
                'gallery' => ['*' => ['id', 'mediaType', 'type', 'url', 'thumbUrl', 'caption', 'durationSeconds']],
                'similar' => ['*' => ['id', 'slug', 'name', 'thumbUrl', 'year', 'quality', 'type', 'ratingAvg', 'genres']],
            ],
        ]);
    }

    public function test_movie_detail_includes_gallery_media(): void
    {
        $this->seed(MovieTestSeeder::class);

        $response = $this->getJson('/api/v1/movies/phim-1');

        $response->assertOk();
        $response->assertJsonCount(5, 'data.gallery');
        $response->assertJsonPath('data.gallery.0.mediaType', 'video');
        $response->assertJsonPath('data.gallery.0.type', 'trailer');
        $response->assertJsonPath('data.gallery.0.durationSeconds', 135);
        $response->assertJsonPath('data.gallery.2.mediaType', 'image');
        $response->assertJsonPath('data.gallery.2.type', 'still');
    }

    public function test_unknown_slug_returns_404(): void
    {
        $this->seed(MovieTestSeeder::class);

        $this->getJson('/api/v1/movies/phim-999')->assertNotFound();
    }

    public function test_single_movie_has_one_full_episode(): void
    {
        $this->seed(MovieTestSeeder::class);

        $response = $this->getJson('/api/v1/movies/phim-2');

        $response->assertOk();
        $response->assertJsonCount(1, 'data.episodes');
        $response->assertJsonPath('data.episodes.0.name', 'Full');
    }

    public function test_soft_deleted_movie_returns_404(): void
    {
        $this->seed(MovieTestSeeder::class);

        Movie::query()->where('slug', 'phim-8')->firstOrFail()->delete();

        $this->getJson('/api/v1/movies/phim-8')->assertNotFound();
    }

    public function test_is_new_and_is_hot_are_computed(): void
    {
        $this->seed(MovieTestSeeder::class);

        // phim-4: created 5 ngày trước → isNew=true; 3500 lượt xem, rating 7.9 → isHot=false
        $response = $this->getJson('/api/v1/movies/phim-4');
        $response->assertOk();
        $response->assertJsonPath('data.isNew', true);
        $response->assertJsonPath('data.isHot', false);

        // phim-1: created 60 ngày trước → isNew=false; 25000 lượt xem → isHot=true
        $response = $this->getJson('/api/v1/movies/phim-1');
        $response->assertOk();
        $response->assertJsonPath('data.isNew', false);
        $response->assertJsonPath('data.isHot', true);

        // phim-13: created 60 ngày trước, 7000 lượt xem, rating 7.8 → cả hai đều false
        $response = $this->getJson('/api/v1/movies/phim-13');
        $response->assertOk();
        $response->assertJsonPath('data.isNew', false);
        $response->assertJsonPath('data.isHot', false);
    }

    public function test_similar_movies_contract(): void
    {
        $this->seed(MovieTestSeeder::class);

        $response = $this->getJson('/api/v1/movies/phim-1');
        $response->assertOk();

        $similar = $response->json('data.similar');
        $this->assertIsArray($similar);
        $this->assertLessThanOrEqual(10, count($similar));

        // phim-1 thuộc thể loại 'Hành động' + 'Phiêu lưu' — mọi item phải trùng ít nhất một genre
        $phim1Genres = ['Hành động', 'Phiêu lưu'];
        $ratingAvgs = [];
        foreach ($similar as $item) {
            $this->assertNotSame('phim-1', $item['slug']);
            $this->assertNotEmpty(array_intersect($phim1Genres, $item['genres']));
            $ratingAvgs[] = $item['ratingAvg'];
        }

        // Sắp xếp ratingAvg giảm dần
        $sorted = $ratingAvgs;
        rsort($sorted);
        $this->assertSame($sorted, $ratingAvgs);
    }
}
