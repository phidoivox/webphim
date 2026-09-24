<?php

namespace Database\Seeders;

use App\Models\Genre;
use Illuminate\Database\Seeder;

class GenreSeeder extends Seeder
{
    public function run(): void
    {
        $genres = [
            ['name' => 'Hành Động', 'slug' => 'hanh-dong'],
            ['name' => 'Tình Cảm', 'slug' => 'tinh-cam'],
            ['name' => 'Hài Hước', 'slug' => 'hai-huoc'],
            ['name' => 'Cổ Trang', 'slug' => 'co-trang'],
            ['name' => 'Tâm Lý', 'slug' => 'tam-ly'],
            ['name' => 'Hình Sự', 'slug' => 'hinh-su'],
            ['name' => 'Chiến Tranh', 'slug' => 'chien-tranh'],
            ['name' => 'Thể Thao', 'slug' => 'the-thao'],
            ['name' => 'Võ Thuật', 'slug' => 'vo-thuat'],
            ['name' => 'Viễn Tưởng', 'slug' => 'vien-tuong'],
            ['name' => 'Phiêu Lưu', 'slug' => 'phieu-luu'],
            ['name' => 'Khoa Học', 'slug' => 'khoa-hoc'],
            ['name' => 'Tài Liệu', 'slug' => 'tai-lieu'],
            ['name' => 'Kinh Dị', 'slug' => 'kinh-di'],
            ['name' => 'Chính Kịch', 'slug' => 'chinh-kich'],
            ['name' => 'Bí Ẩn', 'slug' => 'bi-an'],
            ['name' => 'Hoạt Hình', 'slug' => 'hoat-hinh'],
            ['name' => 'Gia Đình', 'slug' => 'gia-dinh'],
            ['name' => 'Âm Nhạc', 'slug' => 'am-nhac'],
            ['name' => 'Học Đường', 'slug' => 'hoc-duong'],
            ['name' => 'Lãng Mạn', 'slug' => 'lang-man'],
            ['name' => 'Thần Thoại', 'slug' => 'than-thoai'],
            ['name' => 'Gây Cấn', 'slug' => 'gay-can'],
        ];

        foreach ($genres as $genre) {
            Genre::updateOrCreate(
                ['slug' => $genre['slug']],
                [
                    'name' => $genre['name'],
                    'meta_title' => "Phim {$genre['name']} Hay Nhất",
                    'meta_description' => "Tuyển tập phim {$genre['name']} mới nhất, tuyển chọn chất lượng cao.",
                ]
            );
        }

        // Xóa sạch nếu trước đó đã tạo nhầm tv-shows hoặc anime trong bảng genres
        Genre::whereIn('slug', ['tv-shows', 'anime'])->delete();
    }
}
