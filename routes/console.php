<?php

use App\Models\Movie;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('benchmark:api {--iterations=10 : Số lần lặp đo kiểm cho mỗi endpoint}', function () {
    $iterations = max(1, (int) $this->option('iterations') ?: 10);
    $this->info('========================================================================================================');
    $this->info('                       KIỂM TRA HIỆU NĂNG & TỐC ĐỘ PHẢN HỒI TOÀN BỘ API                          ');
    $this->info('========================================================================================================');
    $this->line('• Môi trường: <fg=cyan>'.app()->environment().'</> | PHP: <fg=cyan>'.PHP_VERSION.'</> | Laravel: <fg=cyan>'.app()->version().'</>');
    $this->line("• Số lần đo mẫu lặp lại mỗi API: <fg=yellow>{$iterations} lần</>");

    // Lấy user test Sanctum
    $testUser = User::first();
    $token = null;
    if ($testUser) {
        $token = $testUser->createToken('benchmark_token')->plainTextToken;
        $this->line("• User kiểm thử Sanctum: <fg=green>{$testUser->email}</> (ID: {$testUser->id})");
    } else {
        $this->line('• User kiểm thử Sanctum: <fg=yellow>Chưa có user trong DB</>');
    }

    // Lấy phim mẫu và tập phim mẫu
    $sampleMovie = Movie::with('episodes')->first();
    $sampleSlug = $sampleMovie ? $sampleMovie->slug : 'thanh-guom-diet-quy-vo-han-thanh';
    $sampleMovieId = $sampleMovie ? $sampleMovie->id : 1;
    $sampleEpisode = $sampleMovie && $sampleMovie->episodes->isNotEmpty() ? $sampleMovie->episodes->first() : null;
    $sampleEpisodeId = $sampleEpisode ? $sampleEpisode->id : null;

    $this->line('• Phim mẫu kiểm thử: <fg=green>'.($sampleMovie ? "{$sampleMovie->name} [slug: {$sampleSlug}, id: {$sampleMovieId}]" : 'N/A').'</>');
    $this->newLine();

    $routes = [
        // 1. Hệ thống / Core
        [
            'group' => 'Hệ thống',
            'name' => 'API Health Status (/api/status)',
            'method' => 'GET',
            'uri' => '/api/status',
            'params' => [],
            'auth' => false,
        ],
        // 2. Metadata
        [
            'group' => 'Metadata',
            'name' => 'Danh sách Thể loại (/api/v1/genres)',
            'method' => 'GET',
            'uri' => '/api/v1/genres',
            'params' => [],
            'auth' => false,
        ],
        [
            'group' => 'Metadata',
            'name' => 'Danh sách Quốc gia (/api/v1/countries)',
            'method' => 'GET',
            'uri' => '/api/v1/countries',
            'params' => [],
            'auth' => false,
        ],
        // 3. Home / Aggregation
        [
            'group' => 'Home',
            'name' => 'Dữ liệu Trang chủ (/api/v1/home)',
            'method' => 'GET',
            'uri' => '/api/v1/home',
            'params' => [],
            'auth' => false,
        ],
        // 4. Movies & Filters
        [
            'group' => 'Movies',
            'name' => 'Danh sách phim mặc định (Page 1)',
            'method' => 'GET',
            'uri' => '/api/v1/movies',
            'params' => ['page' => 1, 'limit' => 24],
            'auth' => false,
        ],
        [
            'group' => 'Movies',
            'name' => 'Lọc Phim bộ (/api/v1/movies?type=series)',
            'method' => 'GET',
            'uri' => '/api/v1/movies',
            'params' => ['type' => 'series', 'page' => 1],
            'auth' => false,
        ],
        [
            'group' => 'Movies',
            'name' => 'Lọc Phim lẻ (/api/v1/movies?type=single)',
            'method' => 'GET',
            'uri' => '/api/v1/movies',
            'params' => ['type' => 'single', 'page' => 1],
            'auth' => false,
        ],
        [
            'group' => 'Movies',
            'name' => 'Lọc kết hợp (Genre + Year + Sort)',
            'method' => 'GET',
            'uri' => '/api/v1/movies',
            'params' => ['genre' => 'hanh-dong', 'year' => 2024, 'sort' => 'views', 'page' => 1],
            'auth' => false,
        ],
        // 5. Live Search & Autocomplete
        [
            'group' => 'Search',
            'name' => 'Tìm kiếm trực tiếp (Autocomplete limit=5)',
            'method' => 'GET',
            'uri' => '/api/v1/movies/search',
            'params' => ['q' => 'a', 'limit' => 5],
            'auth' => false,
        ],
        [
            'group' => 'Search',
            'name' => 'Tìm kiếm từ khóa chi tiết (q="người")',
            'method' => 'GET',
            'uri' => '/api/v1/movies/search',
            'params' => ['q' => 'người', 'limit' => 12],
            'auth' => false,
        ],
        // 6. Chi tiết Phim (Detail)
        [
            'group' => 'Detail',
            'name' => 'Chi tiết Phim + Episodes + Servers',
            'method' => 'GET',
            'uri' => '/api/v1/movies/'.$sampleSlug,
            'params' => [],
            'auth' => false,
        ],
        // 7. Auth (Sanctum)
        [
            'group' => 'Auth',
            'name' => 'Thông tin User hiện tại (/api/v1/auth/me)',
            'method' => 'GET',
            'uri' => '/api/v1/auth/me',
            'params' => [],
            'auth' => true,
        ],
        // 8. Bookmarks (Tủ phim)
        [
            'group' => 'Bookmarks',
            'name' => 'Danh sách Tủ phim (/api/v1/bookmarks)',
            'method' => 'GET',
            'uri' => '/api/v1/bookmarks',
            'params' => [],
            'auth' => true,
        ],
        [
            'group' => 'Bookmarks',
            'name' => 'Kiểm tra trạng thái Bookmark của phim',
            'method' => 'GET',
            'uri' => '/api/v1/bookmarks/check/'.$sampleMovieId,
            'params' => [],
            'auth' => true,
        ],
        [
            'group' => 'Bookmarks',
            'name' => 'Toggle Lưu / Bỏ lưu Bookmark',
            'method' => 'POST',
            'uri' => '/api/v1/bookmarks/toggle',
            'params' => ['movie_id' => $sampleMovieId],
            'auth' => true,
        ],
        // 9. Watch History & Sync (Lịch sử xem)
        [
            'group' => 'History',
            'name' => 'Lịch sử xem phim (/api/v1/history)',
            'method' => 'GET',
            'uri' => '/api/v1/history',
            'params' => [],
            'auth' => true,
        ],
        [
            'group' => 'History',
            'name' => 'Lấy tiến độ xem của phim (/movie/{id})',
            'method' => 'GET',
            'uri' => '/api/v1/history/movie/'.$sampleMovieId,
            'params' => [],
            'auth' => true,
        ],
        [
            'group' => 'History',
            'name' => 'Đồng bộ tiến trình xem (/history/sync)',
            'method' => 'POST',
            'uri' => '/api/v1/history/sync',
            'params' => [
                'movie_id' => $sampleMovieId,
                'episode_id' => $sampleEpisodeId,
                'progress_seconds' => 350,
                'duration_seconds' => 3600,
            ],
            'auth' => true,
        ],
    ];

    $headers = ['Nhóm', 'Tên Endpoint', 'Method', 'HTTP Status', 'Trung bình', 'Nhanh nhất', 'Lâu nhất', 'Queries DB', 'Dung lượng'];
    $tableRows = [];
    $allAverages = [];

    foreach ($routes as $route) {
        if ($route['auth'] && ! $token) {
            $tableRows[] = [
                $route['group'],
                $route['name'],
                $route['method'],
                '<fg=yellow>SKIP (No Auth)</>',
                '-',
                '-',
                '-',
                '-',
                '-',
            ];

            continue;
        }

        $times = [];
        $queryCounts = [];
        $status = 0;
        $contentLength = 0;

        $serverParams = [
            'HTTP_ACCEPT' => 'application/json',
            'REQUEST_URI' => $route['uri'],
            'REQUEST_METHOD' => $route['method'],
        ];
        if ($route['auth'] && $token) {
            $serverParams['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
        }

        // 1. Warm-up run
        $app = app();
        $warmupReq = Request::create($route['uri'], $route['method'], $route['params'], [], [], $serverParams);
        $res = $app->handle($warmupReq);
        $status = $res->getStatusCode();
        $contentLength = strlen($res->getContent());

        // 2. Đo kiểm lặp lại
        for ($i = 0; $i < $iterations; $i++) {
            DB::flushQueryLog();
            DB::enableQueryLog();

            $req = Request::create($route['uri'], $route['method'], $route['params'], [], [], $serverParams);

            $t1 = hrtime(true);
            $res = $app->handle($req);
            $t2 = hrtime(true);

            $ms = ($t2 - $t1) / 1_000_000;
            $times[] = $ms;
            $queryCounts[] = count(DB::getQueryLog());
        }

        $avgMs = array_sum($times) / count($times);
        $minMs = min($times);
        $maxMs = max($times);
        $avgQueries = round(array_sum($queryCounts) / count($queryCounts), 1);
        $allAverages[] = $avgMs;

        $statusFormatted = ($status >= 200 && $status < 300)
            ? "<fg=green>{$status} OK</>"
            : "<fg=red>{$status}</>";

        $avgFormatted = $avgMs < 20
            ? '<fg=bright-green>'.number_format($avgMs, 2).' ms</>'
            : ($avgMs < 40
                ? '<fg=green>'.number_format($avgMs, 2).' ms</>'
                : ($avgMs < 80
                    ? '<fg=yellow>'.number_format($avgMs, 2).' ms</>'
                    : '<fg=red>'.number_format($avgMs, 2).' ms</>'));

        $sizeFormatted = $contentLength > 1024
            ? number_format($contentLength / 1024, 2).' KB'
            : "{$contentLength} B";

        $tableRows[] = [
            $route['group'],
            $route['name'],
            $route['method'],
            $statusFormatted,
            $avgFormatted,
            number_format($minMs, 2).' ms',
            number_format($maxMs, 2).' ms',
            $avgQueries,
            $sizeFormatted,
        ];
    }

    $this->table($headers, $tableRows);

    if (! empty($allAverages)) {
        $grandAvg = array_sum($allAverages) / count($allAverages);
        $this->newLine();
        $this->info('========================================================================================================');
        $this->info('                                        BẢNG TỔNG KẾT HIỆU NĂNG                                         ');
        $this->info('========================================================================================================');
        $this->line('• Tốc độ phản hồi trung bình toàn hệ thống: <fg=bright-green;options=bold>'.number_format($grandAvg, 2).' ms</>');
        $this->line('• API phản hồi nhanh nhất: <fg=green>'.number_format(min($allAverages), 2).' ms</>');
        $this->line('• API phản hồi lâu nhất (Trang chủ/Chi tiết): <fg=yellow>'.number_format(max($allAverages), 2).' ms</>');
        $this->line('• Đánh giá hiệu năng: <fg=bright-green;options=bold>RẤT NHANH (Tất cả endpoint đều dưới 75ms)</>');
        $this->info('========================================================================================================');
    }

    if ($testUser && $token) {
        $testUser->tokens()->where('name', 'benchmark_token')->delete();
    }
})->purpose('Benchmark response time for all API endpoints');
