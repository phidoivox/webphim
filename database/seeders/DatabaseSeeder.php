<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Episode;
use App\Models\EpisodeServer;
use App\Models\Genre;
use App\Models\Movie;
use App\Models\Person;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Xoá dữ liệu cũ — cascadeOnDelete ở migration tự dọn episode/server/pivot
        Movie::query()->forceDelete();
        Genre::query()->delete();
        Country::query()->delete();
        Person::query()->delete();

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
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        ];

        $characterNames = ['Minh', 'Lan', 'Hùng', 'Thảo', 'Bảo', 'Vy'];

        // [slug, name, originName, type, quality, genres, countries, ratingAvg, ratingCount, viewCount, episodeCurrent, episodes, content, isNew]
        $movieSpecs = [
            ['phim-1', 'Mặt Trời Đỏ', 'Red Sun Rising', 'series', 'FHD', ['hanh-dong', 'phieu-luu'], ['viet-nam'], 8.7, 42, 25000, null, 12, 'Một cựu đặc nhiệm trở về truy tìm sự thật về vụ mất tích của gia đình mình, kéo theo chuỗi bí mật chấn động cả thành phố.', false],
            ['phim-2', 'Chuyện Tình Đêm Mưa', null, 'single', 'FHD', ['tinh-cam'], ['viet-nam'], 8.1, 28, 5000, null, 1, 'Chuyện tình lãng mạn giữa hai con người gặp nhau trong một đêm mưa định mệnh.', false],
            ['phim-3', 'Thám Tử Rừng Xanh', null, 'series', 'HD', ['tam-ly', 'hinh-su'], ['viet-nam'], 8.4, 35, 5000, '12/20', 20, 'Một thám tử tài ba phá án giữa khu rừng đầy bí ẩn.', false],
            ['phim-4', 'Vùng Đất Quên', null, 'single', 'FHD', ['vien-tuong'], ['my'], 7.9, 15, 3500, null, 1, 'Cuộc phiêu lưu của một người lạc vào vùng đất bị lãng quên.', true],
            ['phim-5', 'Đội Quân Rồng Lửa', 'Fire Dragon Squad', 'series', 'HD', ['hoat-hinh', 'phieu-luu'], ['my'], 8.9, 50, 30000, null, 24, 'Nhóm phi công trẻ tuổi nhận nhiệm vụ bảo vệ thành phố bay khỏi thế lực bóng tối — bộ phim hoạt hình hành động được mong chờ nhất năm.', false],
            ['phim-6', 'Mùa Hè Năm Ấy', null, 'single', 'HD', ['tinh-cam', 'hai'], ['viet-nam'], 7.2, 12, 2000, null, 1, 'Kỷ niệm ngọt ngào của một mùa hè tuổi trẻ.', false],
            ['phim-7', 'Bí Mật Khu Phố Cũ', null, 'series', 'FHD', ['kinh-di', 'tam-ly'], ['viet-nam'], 8.0, 22, 8000, '6/12', 12, 'Những bí mật rùng rợn ẩn giấu trong khu phố cổ.', true],
            ['phim-8', 'Cơn Bão Lặng', null, 'single', 'FHD', ['hanh-dong', 'hinh-su'], ['my'], 8.3, 30, 6500, null, 1, 'Một cảnh sát ngầm đối đầu với tổ chức tội phạm xuyên quốc gia.', false],
            ['phim-9', 'Hành Trình Sao Băng', null, 'series', 'HD', ['vien-tuong', 'phieu-luu'], ['my'], 8.6, 38, 15000, null, 10, 'Hành trình khám phá vũ trụ của phi hành đoàn tàu Sao Băng.', false],
            ['phim-10', 'Người Giữ Lửa', null, 'series', 'HD', ['tam-ly', 'chinh-kich'], ['han-quoc'], 8.2, 26, 9000, '3/16', 16, 'Cuộc đời người lính cứu hỏa gắn với những mất mát và hy sinh.', true],
            ['phim-11', 'Khu Vườn Bí Ẩn', null, 'single', 'HD', ['kinh-di'], ['han-quoc'], 7.6, 18, 4000, null, 1, 'Khu vườn cổ chứa đựng lời nguyền từ trăm năm trước.', true],
            ['phim-12', 'Đại Chiến Robot', 'Robot Wars', 'series', 'FHD', ['hanh-dong', 'vien-tuong'], ['my'], 8.8, 45, 20000, null, 12, 'Năm 2089, nhân loại đối đầu với cuộc nổi dậy của robot — một kỹ sư trẻ phải chọn đứng về phía nào để cứu tương lai.', false],
            ['phim-13', 'Nhịp Đập Trái Tim', null, 'single', 'HD', ['tinh-cam'], ['han-quoc'], 7.8, 20, 7000, null, 1, 'Câu chuyện chữa lành của một bác sĩ tim mạch.', false],
            ['phim-14', 'Kẻ Săn Bóng Đêm', null, 'series', 'FHD', ['hanh-dong', 'hinh-su'], ['my'], 8.5, 33, 18000, null, 10, 'Sát thủ bí ẩn săn lùng những kẻ tội phạm ngoài vòng pháp luật.', true],
        ];

        // Lệch spec (có chủ đích): spec ghi "8 genres đúng slug" theo dropdown trang chủ (mock).
        // DB seeder dùng 10 genres — thêm hinh-su (Hình sự) và chinh-kich (Chính kịch) cho
        // phim-3/8/10/14; API trả tên genre đầy đủ, không ảnh hưởng fixture trang chủ.

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
                'rating_avg' => $ratingAvg,
                'rating_count' => $ratingCount,
                'view_count' => $viewCount,
                'is_active' => true,
            ]);

            // isNew = created_at trong 30 ngày — đẩy phim cũ ra 60 ngày
            $movie->forceFill(['created_at' => $isNew ? now()->subDays(5) : now()->subDays(60)])->save();

            $movie->genres()->attach(Genre::query()->whereIn('slug', $genreSlugs)->pluck('id'));
            $movie->countries()->attach(Country::query()->whereIn('slug', $countrySlugs)->pluck('id'));

            // Credits: 1 đạo diễn + 2 diễn viên (xoay vòng qua danh sách)
            $director = Person::query()->orderBy('id')->skip($index % 3)->first();
            $movie->directors()->attach($director->id, ['role' => 'director', 'sort_order' => 0]);
            foreach ([4, 6] as $actorOffset) {
                $actor = Person::query()->orderBy('id')->skip(($index + $actorOffset) % 8)->first();
                $movie->actors()->attach($actor->id, [
                    'role' => 'actor',
                    'character_name' => $characterNames[($index + $actorOffset) % 6],
                    'sort_order' => $actorOffset - 3,
                ]);
            }

            // Episodes: series → N tập, single → 1 tập "Full"
            for ($i = 1; $i <= $episodeCount; $i++) {
                $episode = Episode::query()->create([
                    'movie_id' => $movie->id,
                    'name' => $episodeCount === 1 ? 'Full' : "Tập {$i}",
                    'slug' => $episodeCount === 1 ? 'tap-1' : "tap-{$i}",
                    'sort_order' => $i,
                ]);
                foreach (['SV1', 'SV2'] as $si => $serverName) {
                    EpisodeServer::query()->create([
                        'episode_id' => $episode->id,
                        'server_name' => $serverName,
                        'lang_type' => 'vietsub',
                        'link_m3u8' => $sampleVideos[($index + $si) % count($sampleVideos)],
                        'sort_order' => $si,
                    ]);
                }
            }
        }
    }
}
