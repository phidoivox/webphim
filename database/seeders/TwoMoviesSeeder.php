<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Genre;
use App\Models\Movie;
use Illuminate\Database\Seeder;

class TwoMoviesSeeder extends Seeder
{
    public function run(): void
    {
        $gViens = Genre::firstOrCreate(['slug' => 'vien-tuong'], ['name' => 'Viễn tưởng']);
        $gPhieu = Genre::firstOrCreate(['slug' => 'phieu-luu'], ['name' => 'Phiêu lưu']);
        $gHanh = Genre::firstOrCreate(['slug' => 'hanh-dong'], ['name' => 'Hành động']);
        $gHinh = Genre::firstOrCreate(['slug' => 'hinh-su'], ['name' => 'Hình sự']);

        $cMy = Country::firstOrCreate(['slug' => 'my'], ['name' => 'Mỹ']);
        $cHan = Country::firstOrCreate(['slug' => 'han-quoc'], ['name' => 'Hàn Quốc']);

        $m1 = Movie::updateOrCreate(
            ['slug' => 'phim-14'],
            [
                'name' => 'Bí Mật Không Gian',
                'origin_name' => 'Space Secrets',
                'content' => 'Hành trình khám phá hành tinh mới tràn đầy bí ẩn và nguy hiểm.',
                'type' => 'series',
                'status' => 'ongoing',
                'quality' => 'FHD',
                'is_cinema' => false,
                'thumb_url' => 'https://picsum.photos/seed/phim-14/300/450',
                'poster_url' => 'https://picsum.photos/seed/phim-14/500/750',
                'duration_minutes' => 45,
                'episode_current' => '10/10',
                'episode_total' => '10',
                'year' => 2026,
                'tmdb_rating' => 8.8,
                'imdb_rating' => 8.4,
                'rating_avg' => 9.0,
                'rating_count' => 50,
                'view_count' => 12000,
                'is_active' => true,
            ]
        );
        $m1->genres()->sync([$gViens->id, $gPhieu->id]);
        $m1->countries()->sync([$cMy->id]);

        $m2 = Movie::updateOrCreate(
            ['slug' => 'phim-15'],
            [
                'name' => 'Kẻ Trộm Thời Gian',
                'origin_name' => 'Time Thief',
                'content' => 'Cuộc rượt đuổi nghẹt thở giữa sát thủ và cảnh sát xuyên không gian thời gian.',
                'type' => 'single',
                'status' => 'completed',
                'quality' => '4K',
                'is_cinema' => true,
                'thumb_url' => 'https://picsum.photos/seed/phim-15/300/450',
                'poster_url' => 'https://picsum.photos/seed/phim-15/500/750',
                'duration_minutes' => 120,
                'episode_current' => null,
                'episode_total' => null,
                'year' => 2026,
                'tmdb_rating' => 8.5,
                'imdb_rating' => 8.1,
                'rating_avg' => 8.6,
                'rating_count' => 45,
                'view_count' => 9500,
                'is_active' => true,
            ]
        );
        $m2->genres()->sync([$gHanh->id, $gHinh->id]);
        $m2->countries()->sync([$cHan->id]);
    }
}
