<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Episode;
use App\Models\EpisodeServer;
use App\Models\Genre;
use App\Models\Movie;
use App\Models\MovieGallery;
use App\Models\Person;
use Illuminate\Database\Seeder;

class MovieTestSeeder extends Seeder
{
    public function run(): void
    {
        $genres = [
            ['name' => 'Hành động', 'slug' => 'hanh-dong'],
            ['name' => 'Tình cảm', 'slug' => 'tinh-cam'],
            ['name' => 'Hài', 'slug' => 'hai'],
            ['name' => 'Kinh dị', 'slug' => 'kinh-di'],
            ['name' => 'Viễn tưởng', 'slug' => 'vien-tuong'],
            ['name' => 'Hoạt hình', 'slug' => 'hoat-hinh'],
            ['name' => 'Tâm lý', 'slug' => 'tam-ly'],
            ['name' => 'Phiêu lưu', 'slug' => 'phieu-luu'],
            ['name' => 'Hình sự', 'slug' => 'hinh-su'],
            ['name' => 'Chính kịch', 'slug' => 'chinh-kich'],
        ];
        foreach ($genres as $g) {
            Genre::query()->create($g);
        }

        $countries = [
            ['name' => 'Việt Nam', 'slug' => 'viet-nam'],
            ['name' => 'Hàn Quốc', 'slug' => 'han-quoc'],
            ['name' => 'Mỹ', 'slug' => 'my'],
        ];
        foreach ($countries as $c) {
            Country::query()->create($c);
        }

        $people = [
            ['name' => 'Lê Minh Quân', 'slug' => 'le-minh-quan'],
            ['name' => 'Trần Ngọc Anh', 'slug' => 'tran-ngoc-anh'],
            ['name' => 'Phạm Hoàng Long', 'slug' => 'pham-hoang-long'],
            ['name' => 'Nguyễn Thu Hà', 'slug' => 'nguyen-thu-ha'],
            ['name' => 'Vũ Đức Huy', 'slug' => 'vu-duc-huy'],
            ['name' => 'Đặng Mai Phương', 'slug' => 'dang-mai-phuong'],
            ['name' => 'Hoàng Gia Bảo', 'slug' => 'hoang-gia-bao'],
            ['name' => 'Lý Thanh Trúc', 'slug' => 'ly-thanh-truc'],
        ];
        foreach ($people as $i => $p) {
            Person::query()->create([
                'name' => $p['name'],
                'slug' => $p['slug'],
                'avatar_url' => 'https://picsum.photos/seed/person-'.($i + 1).'/200/200',
            ]);
        }

        $sampleVideos = [
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        ];

        $characterNames = ['Minh', 'Lan', 'Hùng', 'Thảo', 'Bảo', 'Vy'];

        $movieSpecs = [
            ['phim-1', 'Mặt Trời Đỏ', 'Red Sun Rising', 'series', 'FHD', ['hanh-dong', 'phieu-luu'], ['viet-nam'], 8.7, 42, 25000, null, 12, 'Nội dung phim 1', false],
            ['phim-2', 'Chuyện Tình Đêm Mưa', null, 'single', 'FHD', ['tinh-cam'], ['viet-nam'], 8.1, 28, 5000, null, 1, 'Nội dung phim 2', false],
            ['phim-3', 'Thám Tử Rừng Xanh', null, 'series', 'HD', ['tam-ly', 'hinh-su'], ['viet-nam'], 8.4, 35, 5000, '12/20', 20, 'Nội dung phim 3', false],
            ['phim-4', 'Vùng Đất Quên', null, 'single', 'FHD', ['vien-tuong'], ['my'], 7.9, 15, 3500, null, 1, 'Nội dung phim 4', true],
            ['phim-8', 'Cơn Bão Lặng', null, 'single', 'FHD', ['hanh-dong', 'hinh-su'], ['my'], 8.3, 30, 6500, null, 1, 'Nội dung phim 8', false],
            ['phim-13', 'Nhịp Đập Trái Tim', null, 'single', 'HD', ['tinh-cam'], ['han-quoc'], 7.8, 20, 7000, null, 1, 'Nội dung phim 13', false],
            ['phim-14', 'Bí Mật Không Gian', 'Space Secrets', 'series', 'FHD', ['vien-tuong', 'phieu-luu'], ['my'], 9.0, 50, 12000, '10/10', 10, 'Hành trình khám phá hành tinh mới tràn đầy bí ẩn và nguy hiểm.', true],
            ['phim-15', 'Kẻ Trộm Thời Gian', 'Time Thief', 'single', '4K', ['hanh-dong', 'hinh-su'], ['han-quoc'], 8.6, 45, 9500, null, 1, 'Cuộc rượt đuổi nghẹt thở giữa sát thủ và cảnh sát xuyên qua các khoảng thời gian khác nhau.', true],
        ];

        foreach ($movieSpecs as $index => [$slug, $name, $originName, $type, $quality, $genreSlugs, $countrySlugs, $ratingAvg, $ratingCount, $viewCount, $episodeCurrent, $episodeCount, $content, $isNew]) {
            $movie = Movie::query()->create([
                'name' => $name,
                'origin_name' => $originName,
                'slug' => $slug,
                'content' => $content,
                'type' => $type,
                'status' => $type === 'single' ? 'completed' : 'ongoing',
                'quality' => $quality,
                'is_cinema' => $type === 'single',
                'thumb_url' => "https://picsum.photos/seed/{$slug}/300/450",
                'poster_url' => "https://picsum.photos/seed/{$slug}/500/750",
                'duration_minutes' => 45,
                'episode_current' => $episodeCurrent,
                'episode_total' => $type === 'series' ? (string) $episodeCount : null,
                'year' => 2026,
                'tmdb_rating' => $ratingAvg,
                'imdb_rating' => max(1.0, round($ratingAvg - 0.4, 1)),
                'rating_avg' => $ratingAvg,
                'rating_count' => $ratingCount,
                'view_count' => $viewCount,
                'is_active' => true,
            ]);

            $movie->forceFill(['created_at' => $isNew ? now()->subDays(5) : now()->subDays(60)])->save();
            $movie->genres()->attach(Genre::query()->whereIn('slug', $genreSlugs)->pluck('id'));
            $movie->countries()->attach(Country::query()->whereIn('slug', $countrySlugs)->pluck('id'));

            $director = Person::query()->first();
            if ($director) {
                $movie->directors()->attach($director->id, ['role' => 'director', 'sort_order' => 0]);
            }
            $actor = Person::query()->skip(1)->first();
            if ($actor) {
                $movie->actors()->attach($actor->id, ['role' => 'actor', 'character_name' => 'Minh', 'sort_order' => 1]);
            }

            for ($i = 1; $i <= $episodeCount; $i++) {
                $episode = Episode::query()->create([
                    'movie_id' => $movie->id,
                    'name' => $episodeCount === 1 ? 'Full' : "Tập {$i}",
                    'slug' => $episodeCount === 1 ? 'tap-1' : "tap-{$i}",
                    'sort_order' => $i,
                ]);
                EpisodeServer::query()->create([
                    'episode_id' => $episode->id,
                    'server_name' => 'Vietsub',
                    'lang_type' => 'vietsub',
                    'link_m3u8' => $sampleVideos[0],
                    'sort_order' => 0,
                ]);
                EpisodeServer::query()->create([
                    'episode_id' => $episode->id,
                    'server_name' => 'Lồng Tiếng',
                    'lang_type' => 'long-tieng',
                    'link_m3u8' => $sampleVideos[1],
                    'sort_order' => 1,
                ]);
            }

            // Seed Movie Gallery (Trailers & Images)
            MovieGallery::query()->create([
                'movie_id' => $movie->id,
                'media_type' => 'video',
                'type' => 'trailer',
                'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'thumb_url' => "https://picsum.photos/seed/{$slug}-trailer/640/360",
                'caption' => "Official Trailer - {$name}",
                'duration_seconds' => 135,
                'sort_order' => 1,
            ]);

            MovieGallery::query()->create([
                'movie_id' => $movie->id,
                'media_type' => 'video',
                'type' => 'teaser',
                'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'thumb_url' => "https://picsum.photos/seed/{$slug}-teaser/640/360",
                'caption' => "Teaser Khởi Chiếu - {$name}",
                'duration_seconds' => 45,
                'sort_order' => 2,
            ]);

            MovieGallery::query()->create([
                'movie_id' => $movie->id,
                'media_type' => 'image',
                'type' => 'still',
                'url' => "https://picsum.photos/seed/{$slug}-still-1/1200/800",
                'thumb_url' => "https://picsum.photos/seed/{$slug}-still-1/400/267",
                'caption' => 'Phân cảnh hành động kịch tính',
                'duration_seconds' => null,
                'sort_order' => 3,
            ]);

            MovieGallery::query()->create([
                'movie_id' => $movie->id,
                'media_type' => 'image',
                'type' => 'backdrop',
                'url' => "https://picsum.photos/seed/{$slug}-backdrop/1920/1080",
                'thumb_url' => "https://picsum.photos/seed/{$slug}-backdrop/400/225",
                'caption' => 'Toàn cảnh trường quay ngoài trời',
                'duration_seconds' => null,
                'sort_order' => 4,
            ]);

            MovieGallery::query()->create([
                'movie_id' => $movie->id,
                'media_type' => 'image',
                'type' => 'behind_the_scenes',
                'url' => "https://picsum.photos/seed/{$slug}-bts/1200/800",
                'thumb_url' => "https://picsum.photos/seed/{$slug}-bts/400/267",
                'caption' => 'Hậu trường vui vẻ của các diễn viên',
                'duration_seconds' => null,
                'sort_order' => 5,
            ]);
        }
    }
}
