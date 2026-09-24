<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            ['name' => 'Trung Quốc', 'slug' => 'trung-quoc'],
            ['name' => 'Hàn Quốc', 'slug' => 'han-quoc'],
            ['name' => 'Nhật Bản', 'slug' => 'nhat-ban'],
            ['name' => 'Thái Lan', 'slug' => 'thai-lan'],
            ['name' => 'Âu Mỹ', 'slug' => 'au-my'],
            ['name' => 'Việt Nam', 'slug' => 'viet-nam'],
            ['name' => 'Đài Loan', 'slug' => 'dai-loan'],
            ['name' => 'Hồng Kông', 'slug' => 'hong-kong'],
            ['name' => 'Ấn Độ', 'slug' => 'an-do'],
            ['name' => 'Anh', 'slug' => 'anh'],
            ['name' => 'Pháp', 'slug' => 'phap'],
            ['name' => 'Canada', 'slug' => 'canada'],
            ['name' => 'Nga', 'slug' => 'nga'],
            ['name' => 'Philippines', 'slug' => 'philippines'],
            ['name' => 'Úc', 'slug' => 'uc'],
            ['name' => 'Đức', 'slug' => 'duc'],
            ['name' => 'Tây Ban Nha', 'slug' => 'tay-ban-nha'],
            ['name' => 'Ý', 'slug' => 'y'],
            ['name' => 'Thổ Nhĩ Kỳ', 'slug' => 'tho-nhi-ky'],
            ['name' => 'Indonesia', 'slug' => 'indonesia'],
            ['name' => 'Malaysia', 'slug' => 'malaysia'],
            ['name' => 'Brazil', 'slug' => 'brazil'],
            ['name' => 'Hà Lan', 'slug' => 'ha-lan'],
        ];

        foreach ($countries as $country) {
            Country::updateOrCreate(
                ['slug' => $country['slug']],
                [
                    'name' => $country['name'],
                    'meta_title' => "Phim {$country['name']} Hay Nhất",
                    'meta_description' => "Tuyển tập phim {$country['name']} chọn lọc, đặc sắc.",
                ]
            );
        }
    }
}
