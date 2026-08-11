# WebPhim Phase 2 — Trang chi tiết + Trang xem (API Laravel song song) Implementation Plan

## Execution notes (2026-08-11 — đã hoàn thành)

6/6 task xong trên `main` (SDD: subagent per task + task review + fix loops). Commits:
`e27e84b` seeder (+`18eee0d` fix quality) · `24ee9f7` API (+`bdcd2e4` pint, `8325ab8` plan doc) · `5a4a9d5` data layer · `bd1bb60` detail page (+`e6cbde8` label fix, `738ac48` plan doc) · `c388368` watch page (+`6300d55` ref-in-effect, `e318d51` videoError reset) · cuối: verify + notes.

Điều chỉnh so với plan (đã review, chấp nhận):
- **Seeder quality**: phim-5/phim-9 = `HD` theo fixture Phase 1 (user ruling — plan ban đầu ghi FHD).
- **`getMovieDetail`**: fix type 2 token — `const { data: payload } ...; return payload.data;` (bóc wrapper `data` của Laravel resource).
- **Render gate** trên cả 2 trang: `if (error)` → error UI; `else if (loading || stale)` → skeleton; `stale = movie.slug !== slug` (hook giữ data cũ khi đổi slug — Task 3 minor).
- **AdSlot**: `onEndedRef.current = onEnded` gán trong dep-less `useEffect` (rule `react-hooks/refs` cấm viết ref lúc render).
- **PlayerShell**: `setVideoError(false)` trong `onLoadedMetadata` + `onPlaying` (recovery "thử đổi server" — trước đó overlay lỗi không bao giờ biến mất).
- **Label bookmark**: "Lưu phim" ↔ "Đã lưu" (user ruling copy 100% tiếng Việt).
- Tinker (psysh) phải dùng FQCN `App\Models\...` — bare class không resolve.

Minors deferred chờ final review: skip AdSlot chưa bắt autoplay ngay; toast "Đã bỏ bookmark" vi phạm copy tiếng Việt; subtitle luôn hiện `servers[0]`; autoplay rejection map chung vào message lỗi server; flash timer không track; `similarMovies()` thiếu `withoutTrashed()`; RatingStars giả định rating finite; hardcode "tap-1" khi không có tập.

**Final review (whole branch, opus, sau 6/6 task):** không có Critical, cấu trúc vững — merge sau fix. Fix wave 1 (1 fixer, 2 commits `d5ee1e1` + `3e8217d`): skip AdSlot gọi `onEndedRef` ngay (autoplay tức thì); toast → "Đã lưu phim"/"Đã bỏ lưu" (hết vi phạm ruling tiếng Việt); `similarMovies()` thêm `withoutTrashed()`; +3 test (soft-delete 404, isNew/isHot cả 4 tổ hợp, similar genre/order/limit/loại-trừ-chính-nó) → `composer test` 8/8 (281 assertions), pint sạch, lint 0, build ok. Re-review scoped: 4/4 ADDRESSED, không breakage mới. Minors còn lại (subtitle `servers[0]`, autoplay-rejection message, flash timer, RatingStars, AdSlot replay mỗi tập, fetchJson timeout) → Phase 3+.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây trang chi tiết phim `/phim/:slug` và trang xem phim `/xem/:slug/:episode` đọc dữ liệu thật từ endpoint Laravel mới `GET /api/v1/movies/{slug}`, kèm seeder dữ liệu mẫu.

**Architecture:** Backend thêm 1 endpoint đọc duy nhất (controller + JsonResource, JSON camelCase khớp type frontend, seeder tạo lại dữ liệu khớp fixture Phase 1). Frontend thêm `lib/api.ts` (client dùng chung, fallback nhiều URL kế thừa từ `/ket-noi`), hook `useMovieDetail`, rồi 2 trang client-component mới; player mock dùng sample MP4 công khai, AdSlot pre-roll placeholder mặc định free.

**Tech Stack:** Laravel 13 (PHP 8.3, MySQL `webphim` local, PHPUnit sqlite :memory:), Next.js 16.3 (React 19, TS strict, Tailwind 4, pnpm), sample video `commondatastorage.googleapis.com/gtv-videos-bucket`.

## Global Constraints

- **Next 16.3 breaking changes**: `frontend/AGENTS.md` — đọc guide trong `frontend/node_modules/next/dist/docs/` trước khi viết code App Router. Đã verify: `useParams` từ `next/navigation` hoạt động ở client component (không bật `cacheComponents` — `next.config.ts` trống), dynamic route không cần `generateStaticParams`.
- **Màu/token** (từ globals.css Phase 1): `bg-base/surface/elevated`, `text-ink/muted/faint`, `bg/text/border-accent*`; nền cam luôn viết `text-(--color-base)` (xung đột `text-base` của Tailwind v4), tuyệt đối không dùng `text-base` cho màu.
- **Cấm "vẻ AI"**: không gradient tím/indigo, không glassmorphism, **không emoji trong UI** (icon SVG), bo góc 8–12px.
- **Copy 100% tiếng Việt**; font display Space Grotesk (đã setup).
- **Backend**: API trả JSON **camelCase**; chỉ endpoint `GET /api/v1/movies/{slug}`; slug lạ/soft-deleted → 404. `withoutTrashed()` KHÔNG tồn tại trên Route binding (đã verify vendor) — query trong controller.
- **Lint rule React 19**: không gọi setState đồng bộ trong effect (`react-hooks/set-state-in-effect` là error) — setState chỉ trong callback async (.then/.catch/.finally, event handler, interval callback).
- **Verification**: backend = `composer test` (phpunit.xml, sqlite :memory:) + `vendor/bin/pint` + curl thật; frontend = `pnpm lint` + `pnpm build` + dev server (đang chạy port 3000, PID 10944).
- **Git**: branch `main`, identity `vohoa <vohoa@local>`; commit riêng mỗi task, message tiếng Anh theo convention đang có.
- **Sample video**: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/{BigBuckBunny,ElephantsDream,Sintel,TearsOfSteel}.mp4`.
- **Ngoài phạm vi**: auth, bookmark/comment/lịch sử thật (Phase 4), trang chủ nối API, `/api/v1/home`.

---

### Task 1: Seeder dữ liệu mẫu (khớp fixture Phase 1)

**Files:**
- Rewrite: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Consumes: —
- Produces: DB `webphim` có 14 movies slug `phim-1..14` (type series/single, quality, rating_avg, view_count, episodes, servers, credits, genres, countries) — Task 2 test + API dùng.

- [ ] **Step 1: Viết lại `database/seeders/DatabaseSeeder.php`**

```php
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
                'avatar_url' => "https://picsum.photos/seed/person-".($i + 1)."/200/200",
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
```

Lưu ý: `$movie->directors()` / `actors()` là scoped relations (đã có trong model) — `attach` với pivot `role`/`sort_order`/`character_name` như `movie_person` migration yêu cầu.

- [ ] **Step 2: Seed MySQL local và kiểm tra số lượng**

Đảm bảo Laragon MySQL đang chạy, `.env` trỏ DB `webphim`, rồi:

```bash
php artisan migrate:fresh --seed
php artisan tinker --execute="echo Movie::count().' movies, '.Episode::count().' episodes, '.EpisodeServer::count().' servers, '.Person::count().' people';"
```

Expected: `14 movies, ... episodes, ... servers, 8 people` — episodes = 12+1+20+1+24+1+12+1+10+16+1+12+1+10 = 122, servers = 244. Nếu MassAssignmentException ở model nào đó, thêm field đó vào `$fillable` của model.

- [ ] **Step 3: Commit**

```bash
git add database/seeders/DatabaseSeeder.php
git commit -m "feat(db): seed sample movies matching frontend fixtures"
```

---

### Task 2: Endpoint `GET /api/v1/movies/{slug}` (TDD)

**Files:**
- Create: `app/Http/Controllers/Api/V1/MovieController.php`
- Create: `app/Http/Resources/Api/V1/MovieDetailResource.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/Api/V1/MovieDetailTest.php`

**Interfaces:**
- Consumes: seeder Task 1.
- Produces: JSON camelCase theo spec §1 — `data` chứa `id, slug, name, originName, thumbUrl, posterUrl, content, year, quality, type, status, episodeCurrent, episodeTotal, ratingAvg, ratingCount, viewCount, isCinema, isNew, isHot, trailerUrl, durationMinutes, genres[], countries[], episodes[] (id, name, slug, servers[]: id, serverName, langType, linkM3u8), credits {directors[], actors[]} (id, name, avatarUrl, characterName?), similar[] (shape MovieSummary)`. 404 cho slug lạ/soft-deleted.

- [ ] **Step 1: Viết test (failing)**

`tests/Feature/Api/V1/MovieDetailTest.php`:

```php
<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MovieDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_movie_detail_returns_full_json(): void
    {
        $this->seed();

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
                'similar' => ['*' => ['id', 'slug', 'name', 'thumbUrl', 'year', 'quality', 'type', 'ratingAvg', 'genres']],
            ],
        ]);
    }

    public function test_unknown_slug_returns_404(): void
    {
        $this->seed();

        $this->getJson('/api/v1/movies/phim-999')->assertNotFound();
    }

    public function test_single_movie_has_one_full_episode(): void
    {
        $this->seed();

        $response = $this->getJson('/api/v1/movies/phim-2');

        $response->assertOk();
        $response->assertJsonCount(1, 'data.episodes');
        $response->assertJsonPath('data.episodes.0.name', 'Full');
    }
}
```

- [ ] **Step 2: Chạy test để thấy nó fail**

```bash
composer test --filter=MovieDetailTest
```

Expected: 3 tests FAIL (route chưa tồn tại → 404 assertion sai).

- [ ] **Step 3: Route**

`routes/api.php` — thêm:

```php
Route::get('/v1/movies/{movie}', [\App\Http\Controllers\Api\V1\MovieController::class, 'show']);
```

- [ ] **Step 4: Controller**

`app/Http/Controllers/Api/V1/MovieController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\MovieDetailResource;
use App\Models\Movie;

class MovieController extends Controller
{
    public function show(string $movie): MovieDetailResource
    {
        $movie = Movie::query()
            ->where('slug', $movie)
            ->where('is_active', true)
            ->withoutTrashed()
            ->with(['genres', 'countries', 'episodes.servers', 'directors', 'actors'])
            ->firstOrFail(); // ModelNotFoundException → 404 JSON

        return new MovieDetailResource($movie);
    }
}
```

- [ ] **Step 5: Resource**

`app/Http/Resources/Api/V1/MovieDetailResource.php`:

```php
<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MovieDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Movie $movie */
        $movie = $this->resource;

        return [
            'id' => $movie->id,
            'slug' => $movie->slug,
            'name' => $movie->name,
            'originName' => $movie->origin_name,
            'thumbUrl' => $movie->thumb_url,
            'posterUrl' => $movie->poster_url,
            'content' => $movie->content,
            'year' => $movie->year,
            'quality' => $movie->quality,
            'type' => $movie->type,
            'status' => $movie->status,
            'episodeCurrent' => $movie->episode_current,
            'episodeTotal' => $movie->episode_total,
            'ratingAvg' => $movie->rating_avg,
            'ratingCount' => $movie->rating_count,
            'viewCount' => $movie->view_count,
            'isCinema' => $movie->is_cinema,
            'isNew' => $movie->created_at->gte(now()->subDays(30)),
            'isHot' => $movie->view_count >= 10000 || $movie->rating_avg >= 8.5,
            'trailerUrl' => $movie->trailer_url,
            'durationMinutes' => $movie->duration_minutes,
            'genres' => $movie->genres->pluck('name')->values(),
            'countries' => $movie->countries->pluck('name')->values(),
            'episodes' => $movie->episodes
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($ep) => [
                    'id' => $ep->id,
                    'name' => $ep->name,
                    'slug' => $ep->slug,
                    'servers' => $ep->servers
                        ->sortBy('sort_order')
                        ->values()
                        ->map(fn ($s) => [
                            'id' => $s->id,
                            'serverName' => $s->server_name,
                            'langType' => $s->lang_type,
                            'linkM3u8' => $s->link_m3u8,
                        ]),
                ]),
            'credits' => [
                'directors' => $movie->directors
                    ->sortBy(fn ($p) => $p->pivot->sort_order)
                    ->values()
                    ->map(fn ($p) => $this->credit($p)),
                'actors' => $movie->actors
                    ->sortBy(fn ($p) => $p->pivot->sort_order)
                    ->values()
                    ->map(fn ($p) => [
                        ...$this->credit($p),
                        'characterName' => $p->pivot->character_name,
                    ]),
            ],
            'similar' => $this->similarMovies($movie),
        ];
    }

    private function credit(mixed $person): array
    {
        return [
            'id' => $person->id,
            'name' => $person->name,
            'avatarUrl' => $person->avatar_url,
        ];
    }

    /** Phim cùng thể loại — shape giống MovieSummary frontend (Phase 1). */
    private function similarMovies(Movie $movie): array
    {
        return Movie::query()
            ->whereKeyNot($movie->id)
            ->where('is_active', true)
            ->whereHas('genres', fn ($q) => $q->whereIn('genres.id', $movie->genres->pluck('id')))
            ->with('genres')
            ->orderByDesc('rating_avg')
            ->limit(10)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'slug' => $m->slug,
                'name' => $m->name,
                'originName' => $m->origin_name,
                'thumbUrl' => $m->thumb_url,
                'posterUrl' => $m->poster_url,
                'year' => $m->year,
                'quality' => $m->quality,
                'type' => $m->type,
                'episodeCurrent' => $m->episode_current,
                'episodeTotal' => $m->episode_total,
                'isNew' => $m->created_at->gte(now()->subDays(30)),
                'isHot' => $m->view_count >= 10000 || $m->rating_avg >= 8.5,
                'ratingAvg' => $m->rating_avg,
                'genres' => $m->genres->pluck('name')->values(),
            ])
            ->values()
            ->all();
    }
}
```

- [ ] **Step 6: Chạy test → PASS**

```bash
composer test
```

Expected: 3 tests của MovieDetailTest PASS (cùng ExampleTest vẫn xanh). `composer test` chạy toàn bộ suite (sqlite :memory:, seeder chạy trong test — hơi chậm vài giây, bình thường).

- [ ] **Step 7: Pint + kiểm tra thực tế trên MySQL**

```bash
vendor/bin/pint
php artisan serve   # nếu chưa có server chạy port 8000
```

Mở terminal khác:

```bash
curl -s http://127.0.0.1:8000/api/v1/movies/phim-1 | head -c 600
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/v1/movies/phim-999
```

Expected: JSON camelCase chứa `"name":"Mặt Trời Đỏ"`, `"episodes"`, `"credits"`, `"similar"`; và `404`.

- [ ] **Step 8: Commit**

```bash
git add routes/api.php app/Http/Controllers/Api/V1 app/Http/Resources/Api/V1 tests/Feature/Api/V1
git commit -m "feat(api): add GET /api/v1/movies/{slug} detail endpoint"
```

---

### Task 3: Tầng dữ liệu frontend — types, apiClient, hook, refactor /ket-noi

**Files:**
- Modify: `frontend/src/types/movie.ts` (thêm interface)
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/hooks/useMovieDetail.ts`
- Rewrite: `frontend/src/app/ket-noi/page.tsx` (dùng client chung)

**Interfaces:**
- Consumes: API Task 2 (response shape).
- Produces:
  - `fetchJson<T>(path): Promise<{ baseUrl: string; data: T }>` — ném `ApiError` khi fail hết base, `NotFoundError` khi gặp HTTP 404.
  - `getMovieDetail(slug: string): Promise<MovieDetail>`
  - `useMovieDetail(slug)` → `{ data: MovieDetail | null, loading: boolean, error: Error | null, retry: () => void }` — setState chỉ trong callback async (lint rule).
  - Dùng bởi: Task 4, Task 5.

- [ ] **Step 1: Thêm types vào `frontend/src/types/movie.ts`**

Append vào cuối file:

```ts
export interface EpisodeServer {
  id: number;
  serverName: string;
  langType: string;
  linkM3u8: string | null;
}

export interface MovieEpisode {
  id: number;
  name: string;
  slug: string;
  servers: EpisodeServer[];
}

export interface Credit {
  id: number;
  name: string;
  avatarUrl: string | null;
  characterName?: string | null;
}

export interface MovieDetail {
  id: number;
  slug: string;
  name: string;
  originName: string | null;
  thumbUrl: string;
  posterUrl: string;
  content: string | null;
  year: number | null;
  quality: string | null;
  type: string;
  status: string;
  episodeCurrent: string | null;
  episodeTotal: string | null;
  ratingAvg: number;
  ratingCount: number;
  viewCount: number;
  isCinema: boolean;
  isNew: boolean;
  isHot: boolean;
  trailerUrl: string | null;
  durationMinutes: number | null;
  genres: string[];
  countries: string[];
  episodes: MovieEpisode[];
  credits: { directors: Credit[]; actors: Credit[] };
  similar: MovieSummary[];
}
```

- [ ] **Step 2: Tạo `frontend/src/lib/api.ts`**

```ts
import type { MovieDetail } from "@/types/movie";

/** Fail hết các base URL — không kết nối được backend. */
export class ApiError extends Error {}

/** Backend trả 404 — slug không tồn tại. */
export class NotFoundError extends Error {}

const POSSIBLE_API_URLS = [
  process.env.NEXT_PUBLIC_API_URL || "http://webphim.test/api",
  "http://localhost/webphim/public/api",
  "http://127.0.0.1:8000/api",
  "http://localhost:8000/api",
];

export interface ApiResult<T> {
  baseUrl: string;
  data: T;
}

/** Thử lần lượt các base URL, trả kết quả của base 200 đầu tiên. */
export async function fetchJson<T>(path: string): Promise<ApiResult<T>> {
  let lastError: unknown = null;
  let notFound = false;

  for (const base of POSSIBLE_API_URLS) {
    try {
      const res = await fetch(`${base}${path}`, { cache: "no-store" });
      if (res.ok) {
        return { baseUrl: base, data: (await res.json()) as T };
      }
      if (res.status === 404) {
        notFound = true;
      } else {
        lastError = new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (notFound) {
    throw new NotFoundError("Không tìm thấy dữ liệu yêu cầu.");
  }
  throw new ApiError(
    "Không thể kết nối đến Backend Laravel qua các địa chỉ (webphim.test, localhost/webphim/public, 127.0.0.1:8000). Vui lòng kiểm tra Apache/Nginx trên Laragon hoặc gõ lệnh `php artisan serve`.",
    { cause: lastError }
  );
}

export async function getMovieDetail(slug: string): Promise<MovieDetail> {
  const { data: payload } = await fetchJson<{ data: MovieDetail }>(`/v1/movies/${slug}`);
  return payload.data; // bóc lớp `data` của Laravel resource — wrapper bị giữ lại khi destructure
}
```

- [ ] **Step 3: Tạo `frontend/src/hooks/useMovieDetail.ts`**

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { getMovieDetail } from "@/lib/api";
import type { MovieDetail } from "@/types/movie";

/** Fetch chi tiết phim — setState chỉ trong callback async (luật react-hooks/set-state-in-effect). */
export function useMovieDetail(slug: string) {
  const [data, setData] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    getMovieDetail(slug)
      .then((detail) => {
        if (!mounted) return;
        setData(detail);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error("Đã có lỗi xảy ra"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [slug, requestKey]);

  // Gọi từ nút "Thử lại" (event handler) — được phép setState đồng bộ
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequestKey((k) => k + 1);
  }, []);

  return { data, loading, error, retry };
}
```

- [ ] **Step 4: Refactor `frontend/src/app/ket-noi/page.tsx`** — bỏ `probeBackends` cục bộ, dùng `fetchJson` chung (UI giữ nguyên 100%)

```tsx
"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";

interface BackendStatus {
  status: string;
  message: string;
  timestamp: string;
  framework: string;
}

export default function KetNoi() {
  const [data, setData] = useState<BackendStatus | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { baseUrl, data: json } = await fetchJson<BackendStatus>("/status");
      setData(json);
      setActiveUrl(baseUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    }
    setLoading(false);
  };

  useEffect(() => {
    // Trạng thái khởi tạo đã là loading=true — setState chỉ xảy ra trong callback async
    let mounted = true;
    fetchJson<BackendStatus>("/status")
      .then(({ baseUrl, data: json }) => {
        if (!mounted) return;
        setData(json);
        setActiveUrl(baseUrl);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
              W
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">WebPhim Stack Connection Test</h1>
              <p className="text-sm text-slate-400">Next.js Frontend ↔️ Laravel Backend (Laragon)</p>
            </div>
          </div>
          <button
            onClick={checkConnection}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-all text-white shadow-md hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Đang thử lại..." : "Thử kết nối lại"}
          </button>
        </div>

        {/* Status Card */}
        <div className="mb-6">
          {loading ? (
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span className="text-sm font-medium text-slate-300">Đang tự động phát hiện và kết nối đến Laravel API...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex flex-col gap-2">
              <div className="flex items-center space-x-2 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Chưa thể kết nối tới Backend</span>
              </div>
              <p className="text-xs text-rose-400/80">{error}</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>KẾT NỐI BẮT CẦU THÀNH CÔNG!</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-200 font-mono">
                  200 OK
                </span>
              </div>
              <p className="text-xs text-emerald-400/80 font-mono mt-1">
                Đang kết nối qua URL: <span className="underline">{activeUrl}</span>
              </p>
            </div>
          )}
        </div>

        {/* Response JSON Output */}
        {data && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dữ liệu phản hồi thực tế từ Laravel API:</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-slate-300 font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-wrap gap-4 text-xs text-slate-400 justify-between">
          <div>Frontend: Next.js (Port 3000)</div>
          <div>Backend Domain: {activeUrl || "Laragon Webphim"}</div>
        </div>

      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify**

```bash
cd frontend
pnpm lint
pnpm build
```

Expected: lint sạch, build thành công. Lưu ý `src/data/movies.ts` vẫn giữ mock cho trang chủ — không xoá.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/movie.ts frontend/src/lib/api.ts frontend/src/hooks/useMovieDetail.ts frontend/src/app/ket-noi/page.tsx
git commit -m "feat(api-client): shared api client with URL fallback and movie detail hook"
```

---

### Task 4: Trang chi tiết `/phim/[slug]`

**Files:**
- Modify: `frontend/src/components/ui/icons.tsx` (thêm `StarIcon`, `CheckIcon`, `ThumbsUpIcon`)
- Create: `frontend/src/components/movie/RatingStars.tsx`
- Create: `frontend/src/components/movie/EpisodeGrid.tsx`
- Create: `frontend/src/components/movie/CommentItem.tsx`
- Create: `frontend/src/app/phim/[slug]/page.tsx`

**Interfaces:**
- Consumes: `useMovieDetail` + types (Task 3); `CarouselRow` (Phase 1); icons.
- Produces: `RatingStars({ value, interactive?, onChange? })`, `EpisodeGrid({ episodes, baseHref, currentSlug? })` (cả 2 dùng lại ở Task 5), trang `/phim/[slug]` đầy đủ hero + tập + credits + similar + bình luận mock + skeleton/error.

- [ ] **Step 1: Thêm icon vào `frontend/src/components/ui/icons.tsx`** (append cuối file, cùng kiểu `IconProps`)

```tsx
export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function ThumbsUpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}
```

- [ ] **Step 2: Tạo `frontend/src/components/movie/RatingStars.tsx`**

```tsx
"use client";

import { useState } from "react";
import { StarIcon } from "@/components/ui/icons";

interface RatingStarsProps {
  value: number; // rating hiện tại (0–5)
  interactive?: boolean; // cho phép click chấm điểm
  onChange?: (value: number) => void;
  className?: string;
}

export default function RatingStars({ value, interactive = false, onChange, className }: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? Math.round(value);

  return (
    <div className={`flex items-center gap-0.5 ${className ?? ""}`} aria-label={`Đánh giá ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(null)}
          onClick={() => interactive && onChange?.(i)}
          aria-label={`${i} sao`}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <StarIcon className={`h-4 w-4 transition-colors ${i <= active ? "fill-accent text-accent" : "text-faint"}`} />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Tạo `frontend/src/components/movie/EpisodeGrid.tsx`**

```tsx
import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons";
import type { MovieEpisode } from "@/types/movie";

interface EpisodeGridProps {
  episodes: MovieEpisode[];
  baseHref: string; // `/xem/${slug}`
  currentSlug?: string; // episode slug đang xem
}

// Mock: 3 tập đầu coi như đã xem (chưa có lịch sử thật — Phase 4)
const WATCHED_COUNT = 3;

export default function EpisodeGrid({ episodes, baseHref, currentSlug }: EpisodeGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
      {episodes.map((ep, i) => {
        const active = ep.slug === currentSlug;
        const watched = i < WATCHED_COUNT;
        return (
          <Link
            key={ep.id}
            href={`${baseHref}/${ep.slug}`}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
              active
                ? "border-accent bg-accent text-(--color-base)"
                : "border-elevated bg-surface text-muted hover:border-accent/60 hover:text-ink"
            }`}
          >
            {watched && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-(--color-base)" aria-hidden="true">
                <CheckIcon className="h-2.5 w-2.5" />
              </span>
            )}
            {ep.name}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Tạo `frontend/src/components/movie/CommentItem.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ThumbsUpIcon } from "@/components/ui/icons";

export interface MockComment {
  id: number;
  author: string;
  avatarUrl: string;
  time: string;
  content: string;
  likes: number;
}

export default function CommentItem({ comment }: { comment: MockComment }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="flex gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={comment.avatarUrl} alt={comment.author} className="h-9 w-9 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink">{comment.author}</span>
          <span className="text-xs text-faint">{comment.time}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{comment.content}</p>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className={`mt-1.5 flex items-center gap-1 text-xs transition-colors ${liked ? "text-accent" : "text-faint hover:text-accent"}`}
        >
          <ThumbsUpIcon className="h-3.5 w-3.5" />
          {comment.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Tạo `frontend/src/app/phim/[slug]/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { NotFoundError } from "@/lib/api";
import { BookmarkIcon, ChevronDownIcon, PlayIcon } from "@/components/ui/icons";
import RatingStars from "@/components/movie/RatingStars";
import EpisodeGrid from "@/components/movie/EpisodeGrid";
import CommentItem, { type MockComment } from "@/components/movie/CommentItem";
import CarouselRow from "@/components/home/CarouselRow";
import type { CarouselSection } from "@/types/movie";

const TYPE_LABEL: Record<string, string> = {
  series: "Phim bộ",
  single: "Phim lẻ",
  "tv-show": "TV Show",
};

const MOCK_COMMENTS: MockComment[] = [
  { id: 1, author: "PhimHayFan", avatarUrl: "https://picsum.photos/seed/avt-1/80/80", time: "2 giờ trước", content: "Phim hay quá, diễn viên chính diễn xuất cực đỉnh!", likes: 12 },
  { id: 2, author: "Cinephile_VN", avatarUrl: "https://picsum.photos/seed/avt-2/80/80", time: "5 giờ trước", content: "Tập mới căng quá, mong chờ tập sau.", likes: 8 },
  { id: 3, author: "XemPhimMoi", avatarUrl: "https://picsum.photos/seed/avt-3/80/80", time: "1 ngày trước", content: "Chất lượng hình ảnh rất tốt, đáng xem.", likes: 5 },
];

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

export default function MovieDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: movie, loading, error, retry } = useMovieDetail(slug);
  const [bookmarked, setBookmarked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // Skeleton khi tải lần đầu
  if (loading && !movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <SkeletonBlock className="aspect-[2/3] w-48 lg:w-64" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-9 w-2/3" />
            <SkeletonBlock className="h-5 w-1/2" />
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-11 w-40" />
          </div>
        </div>
        <SkeletonBlock className="mt-10 h-8 w-40" />
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10" />
          ))}
        </div>
      </div>
    );
  }

  // Lỗi mạng / backend down → thử lại
  if (error && !movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-10">
        {error instanceof NotFoundError ? (
          <>
            <p className="text-sm text-muted">Không tìm thấy phim này.</p>
            <Link href="/" className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover">
              Về trang chủ
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">{error.message}</p>
            <button type="button" onClick={retry} className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover">
              Thử lại
            </button>
          </>
        )}
      </div>
    );
  }

  if (!movie) return null;

  const firstEpisode = movie.episodes[0];
  const firstEpisodeSlug = firstEpisode?.slug ?? "tap-1";
  const similarSection: CarouselSection = { id: "similar", title: "Phim tương tự", movies: movie.similar };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-10">
      {/* Hero */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="relative mx-auto w-48 shrink-0 lg:mx-0 lg:w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={movie.posterUrl} alt={movie.name} className="aspect-[2/3] w-full rounded-xl object-cover shadow-2xl" />
          {movie.isNew && (
            <span className="absolute left-2 top-2 rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-(--color-base)">MỚI</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-extrabold text-ink lg:text-4xl">{movie.name}</h1>
          {movie.originName && <p className="mt-1 text-sm text-faint">{movie.originName}</p>}

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            <span>{movie.year}</span>
            <span>{movie.quality}</span>
            <span>{TYPE_LABEL[movie.type] ?? movie.type}</span>
            {movie.episodeTotal && <span>{movie.episodeTotal} tập</span>}
            <span className="text-faint">{movie.viewCount.toLocaleString("vi-VN")} lượt xem</span>
          </div>

          {movie.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span key={g} className="rounded-full border border-elevated bg-surface px-3 py-1 text-xs text-muted">{g}</span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <RatingStars value={movie.ratingAvg} interactive onChange={setUserRating} />
            <span className="text-sm font-semibold text-ink">{movie.ratingAvg.toFixed(1)}</span>
            <span className="text-xs text-faint">
              ({movie.ratingCount.toLocaleString("vi-VN")} lượt đánh giá{userRating > 0 ? ` — bạn đã chấm ${userRating} sao` : ""})
            </span>
          </div>

          {movie.content && (
            <p className={`mt-3 max-w-2xl text-sm leading-relaxed text-muted ${expanded ? "" : "line-clamp-3"}`}>{movie.content}</p>
          )}
          {movie.content && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover"
            >
              {expanded ? "Thu gọn" : "Xem thêm"}
              <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/xem/${movie.slug}/${firstEpisodeSlug}`}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover"
            >
              <PlayIcon className="h-4 w-4" />
              XEM PHIM
            </Link>
            <button
              type="button"
              onClick={() => setBookmarked((v) => !v)}
              className={`flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition-colors ${
                bookmarked ? "border-accent bg-accent/15 text-accent" : "border-elevated bg-surface text-muted hover:text-ink"
              }`}
            >
              <BookmarkIcon className={`h-4 w-4 ${bookmarked ? "fill-accent" : ""}`} />
              {bookmarked ? "Đã lưu" : "Lưu phim"}
            </button>
            {movie.trailerUrl && (
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-elevated bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
              >
                Xem trailer
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Chọn tập */}
      {movie.episodes.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink lg:text-xl">Chọn tập</h2>
          <div className="mt-3">
            <EpisodeGrid episodes={movie.episodes} baseHref={`/xem/${movie.slug}`} />
          </div>
        </section>
      )}

      {/* Diễn viên / Đạo diễn */}
      {(movie.credits.directors.length > 0 || movie.credits.actors.length > 0) && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink lg:text-xl">Diễn viên & đạo diễn</h2>
          {movie.credits.directors.length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-muted">Đạo diễn</h3>
              <div className="mt-2 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {movie.credits.directors.map((p) => (
                  <div key={p.id} className="w-20 shrink-0 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatarUrl ?? `https://picsum.photos/seed/person-${p.id}/160/160`} alt={p.name} className="mx-auto h-20 w-20 rounded-full object-cover" />
                    <p className="mt-2 line-clamp-2 text-xs text-ink">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {movie.credits.actors.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-muted">Diễn viên</h3>
              <div className="mt-2 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {movie.credits.actors.map((p) => (
                  <div key={p.id} className="w-20 shrink-0 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatarUrl ?? `https://picsum.photos/seed/person-${p.id}/160/160`} alt={p.name} className="mx-auto h-20 w-20 rounded-full object-cover" />
                    <p className="mt-2 line-clamp-2 text-xs text-ink">{p.name}</p>
                    {p.characterName && <p className="line-clamp-1 text-[10px] text-faint">{p.characterName}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Phim tương tự */}
      {movie.similar.length > 0 && (
        <div className="mt-10">
          <CarouselRow section={similarSection} />
        </div>
      )}

      {/* Bình luận */}
      <section className="mt-10 max-w-2xl">
        <h2 className="font-display text-lg font-bold text-ink lg:text-xl">Bình luận</h2>
        <div className="mt-4 space-y-5">
          {MOCK_COMMENTS.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-dashed border-elevated bg-surface p-4 text-center text-sm text-faint">
          Đăng nhập để bình luận — tính năng sẽ có ở giai đoạn sau.
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Verify**

```bash
cd frontend
pnpm lint
pnpm build
```

Expected: sạch. Build sinh thêm route `/phim/[slug]` (dynamic — không prerender).

- [ ] **Step 7: Kiểm tra dev server**

Dev server đang chạy port 3000. Backend phải chạy (Laragon Apache `webphim.test` hoặc `php artisan serve` port 8000):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/phim/phim-1
curl -s http://localhost:3000/phim/phim-1 | grep -o "animate-pulse" | head -1
```

Expected: 200; HTML SSR chứa skeleton `animate-pulse` (nội dung phim render phía client sau fetch — kiểm tra nội dung thật bằng trình duyệt). Kiểm tra trình duyệt: `/phim/phim-1` hiện hero (poster, tên, rating sao, nút XEM PHIM), lưới 12 tập, đạo diễn + 2 diễn viên, "Phim tương tự" carousel, 3 bình luận mock; `/phim/phim-999` → "Không tìm thấy phim này" + nút Về trang chủ; tắt backend → error + nút "Thử lại" hoạt động.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/ui/icons.tsx frontend/src/components/movie frontend/src/app/phim
git commit -m "feat(detail): add movie detail page with episodes, credits and similar"
```

---

### Task 5: Trang xem `/xem/[slug]/[episode]` — PlayerShell + AdSlot

**Files:**
- Modify: `frontend/src/components/ui/icons.tsx` (thêm `PauseIcon`, `Volume2Icon`, `VolumeXIcon`, `MaximizeIcon`, `FlagIcon`)
- Create: `frontend/src/components/player/PlayerShell.tsx`
- Create: `frontend/src/components/ui/AdSlot.tsx`
- Create: `frontend/src/app/xem/[slug]/[episode]/page.tsx`

**Interfaces:**
- Consumes: `useMovieDetail`, `MovieEpisode`, `NotFoundError` (Task 3); `EpisodeGrid` (Task 4).
- Produces: `PlayerShell({ src, title, autoPlay? })` (HTML5 + auto-hide controls + giữ currentTime khi đổi src), `AdSlot({ onEnded? })` (pre-roll countdown 10s, skip sau 5s), trang `/xem/[slug]/[episode]`.

- [ ] **Step 1: Thêm icon vào `frontend/src/components/ui/icons.tsx`** (append cuối file)

```tsx
export function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="14" y="4" width="4" height="16" rx="1" />
      <rect x="6" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function Volume2Icon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path d="M16 9a5 5 0 0 1 0 6" />
      <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </svg>
  );
}

export function VolumeXIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path d="m22 9-6 6" />
      <path d="m16 9 6 6" />
    </svg>
  );
}

export function MaximizeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </svg>
  );
}
```

- [ ] **Step 2: Tạo `frontend/src/components/player/PlayerShell.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MaximizeIcon, PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from "@/components/ui/icons";

interface PlayerShellProps {
  src: string | null;
  title: string;
  autoPlay?: boolean;
}

const HIDE_DELAY_MS = 3000;

export default function PlayerShell({ src, title, autoPlay = false }: PlayerShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Autoplay sau khi hết pre-roll (autoPlay = true từ parent)
  useEffect(() => {
    if (!autoPlay) return;
    videoRef.current?.play().catch(() => setVideoError(true));
  }, [autoPlay]);

  // Đổi src (chuyển server): giữ thời điểm hiện tại, phát lại nếu đang phát
  useEffect(() => {
    if (!src) return;
    const video = videoRef.current;
    if (!video) return;
    pendingSeekRef.current = video.currentTime;
    wasPlayingRef.current = !video.paused;
    video.load();
  }, [src]);

  // Dọn timer khi unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const showControls = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, HIDE_DELAY_MS);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setVideoError(true));
    } else {
      video.pause();
    }
    showControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    showControls();
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
    showControls();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
    setCurrentTime(video.currentTime);
    showControls();
  };

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="group relative aspect-video w-full bg-black"
      onMouseMove={showControls}
      onMouseLeave={() => setControlsVisible(false)}
      onClick={togglePlay}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-contain"
          muted={muted}
          aria-label={title}
          onPlay={() => { setPlaying(true); showControls(); }}
          onPause={() => { setPlaying(false); setControlsVisible(true); }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            if (pendingSeekRef.current != null) {
              e.currentTarget.currentTime = pendingSeekRef.current;
              pendingSeekRef.current = null;
            }
            if (wasPlayingRef.current) {
              e.currentTarget.play().catch(() => setVideoError(true));
              wasPlayingRef.current = false;
            }
          }}
          onError={() => setVideoError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-faint">
          Không có nguồn phát cho server này
        </div>
      )}

      {videoError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-base/90 text-sm text-muted">
          <p>Không thể phát video — thử chọn server khác.</p>
        </div>
      )}

      {/* Controls: tự ẩn sau 3s khi đang phát */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát"} className="text-ink hover:text-accent">
          {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          aria-label="Tua phim"
          className="h-1 flex-1 cursor-pointer accent-accent"
        />
        <span className="text-xs tabular-nums text-ink">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Bật tiếng" : "Tắt tiếng"} className="text-ink hover:text-accent">
          {muted ? <VolumeXIcon className="h-5 w-5" /> : <Volume2Icon className="h-5 w-5" />}
        </button>
        <button type="button" onClick={toggleFullscreen} aria-label="Toàn màn hình" className="text-ink hover:text-accent">
          <MaximizeIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Tạo `frontend/src/components/ui/AdSlot.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  /** Được gọi khi pre-roll kết thúc (đếm về 0) — parent bật autoPlay cho player. */
  onEnded?: () => void;
}

const SKIP_AFTER_SECONDS = 5;
const AUTO_END_SECONDS = 10;

export default function AdSlot({ onEnded }: AdSlotProps) {
  const [remaining, setRemaining] = useState(AUTO_END_SECONDS);
  const [dismissed, setDismissed] = useState(false);
  const firedRef = useRef(false);
  const onEndedRef = useRef(onEnded);

  // Cập nhật ref callback trong effect (KHÔNG viết ref lúc render — rule react-hooks/refs chặn;
  // dep-less effect giữ ref luôn fresh, tương đương hành vi)
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Báo parent một lần khi đếm về 0 — gọi callback ngoài effect, không setState đồng bộ
  useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      onEndedRef.current?.();
    }
  }, [remaining]);

  if (dismissed || remaining <= 0) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-base/95">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent text-lg font-bold text-accent">
        {remaining}
      </div>
      <p className="text-xs uppercase tracking-widest text-muted">Quảng cáo</p>
      <button
        type="button"
        disabled={remaining > SKIP_AFTER_SECONDS}
        onClick={() => setDismissed(true)}
        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
          remaining > SKIP_AFTER_SECONDS
            ? "cursor-not-allowed bg-elevated text-faint"
            : "bg-accent text-(--color-base) hover:bg-accent-hover"
        }`}
      >
        Bỏ qua ({remaining}s)
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Tạo `frontend/src/app/xem/[slug]/[episode]/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { NotFoundError } from "@/lib/api";
import PlayerShell from "@/components/player/PlayerShell";
import AdSlot from "@/components/ui/AdSlot";
import EpisodeGrid from "@/components/movie/EpisodeGrid";
import { BookmarkIcon, ChevronDownIcon, FlagIcon, ThumbsUpIcon } from "@/components/ui/icons";
import type { MovieDetail, MovieEpisode } from "@/types/movie";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

/** Player + server tabs + pre-roll — remount theo tập (key) để reset trạng thái. */
function PlayerArea({ movie, current }: { movie: MovieDetail; current: MovieEpisode | null }) {
  const [serverId, setServerId] = useState<number | null>(null);
  const [adDone, setAdDone] = useState(false);
  const activeServer = current?.servers.find((s) => s.id === serverId) ?? current?.servers[0] ?? null;

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-black">
        <AdSlot onEnded={() => setAdDone(true)} />
        <PlayerShell src={activeServer?.linkM3u8 ?? null} title={current?.name ?? movie.name} autoPlay={adDone} />
      </div>

      {current && current.servers.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-faint">Server:</span>
          {current.servers.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServerId(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                s.id === activeServer?.id ? "bg-accent text-(--color-base)" : "bg-surface text-muted hover:text-ink"
              }`}
            >
              {s.serverName}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function WatchPage() {
  const { slug, episode } = useParams<{ slug: string; episode: string }>();
  const { data: movie, loading, error, retry } = useMovieDetail(slug);
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [showContinue, setShowContinue] = useState(true);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  // Skeleton
  if (loading && !movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-10">
        <SkeletonBlock className="aspect-video w-full rounded-xl" />
        <SkeletonBlock className="mt-4 h-6 w-1/3" />
        <SkeletonBlock className="mt-6 h-8 w-24" />
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10" />
          ))}
        </div>
      </div>
    );
  }

  // Lỗi
  if (error && !movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-10">
        {error instanceof NotFoundError ? (
          <>
            <p className="text-sm text-muted">Không tìm thấy phim hoặc tập này.</p>
            <Link href="/" className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover">
              Về trang chủ
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">{error.message}</p>
            <button type="button" onClick={retry} className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover">
              Thử lại
            </button>
          </>
        )}
      </div>
    );
  }

  if (!movie) return null;

  const current = movie.episodes.find((e) => e.slug === episode) ?? null;

  // Episode không tồn tại (slug lạ hoặc phim chưa có tập) → UI riêng (spec §5)
  if (!current) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-10">
        <p className="text-sm text-muted">Không tìm thấy tập này.</p>
        <Link
          href={`/phim/${movie.slug}`}
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover"
        >
          Về trang chi tiết
        </Link>
      </div>
    );
  }

  const episodeNum = Number(episode.replace(/^tap-/, "")) || 0; // "Full" → 0
  const mockMinutes = episodeNum > 1 ? ((episodeNum * 3) % 15) + 5 : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Cột chính */}
        <div className="min-w-0 flex-1">
          <PlayerArea key={current?.id ?? "none"} movie={movie} current={current} />

          {/* Ad banner placeholder — user free */}
          <div className="mt-4 hidden h-[90px] w-full max-w-[728px] items-center justify-center rounded-lg border border-dashed border-elevated bg-surface text-xs text-faint lg:flex">
            Ad Slot 728×90
          </div>

          {/* Nhắc tiếp tục xem (mock — Phase 4 sẽ seek thật từ lịch sử) */}
          {mockMinutes && showContinue && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-elevated bg-surface px-4 py-3 text-sm text-muted">
              <p>
                Bạn đang xem ở phút <span className="font-semibold text-ink">{mockMinutes}</span> — muốn tiếp tục?
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setShowContinue(false)}
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-(--color-base) transition-colors hover:bg-accent-hover"
                >
                  Xem tiếp
                </button>
                <button
                  type="button"
                  onClick={() => setShowContinue(false)}
                  className="rounded-md border border-elevated px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {/* Thông tin + toolbar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold text-ink">{movie.name}</h1>
              <p className="mt-0.5 text-sm text-muted">
                {current?.name ?? "—"} · {current?.servers[0]?.serverName ?? "—"} ·{" "}
                <Link href={`/phim/${movie.slug}`} className="text-accent transition-colors hover:text-accent-hover">
                  Trang chi tiết
                </Link>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setBookmarked((v) => !v); flash(bookmarked ? "Đã bỏ bookmark" : "Đã lưu bookmark"); }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  bookmarked ? "border-accent bg-accent/15 text-accent" : "border-elevated bg-surface text-muted hover:text-ink"
                }`}
              >
                <BookmarkIcon className={`h-4 w-4 ${bookmarked ? "fill-accent" : ""}`} />
                {bookmarked ? "Đã lưu" : "Lưu phim"}
              </button>
              <button
                type="button"
                onClick={() => { setLiked((v) => !v); flash(liked ? "Đã bỏ thích" : "Cảm ơn bạn!"); }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  liked ? "border-accent bg-accent/15 text-accent" : "border-elevated bg-surface text-muted hover:text-ink"
                }`}
              >
                <ThumbsUpIcon className="h-4 w-4" />
                Thích
              </button>
              <button
                type="button"
                onClick={() => flash("Đã gửi báo lỗi — cảm ơn bạn!")}
                className="flex items-center gap-1.5 rounded-lg border border-elevated bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-ink"
              >
                <FlagIcon className="h-4 w-4" />
                Báo lỗi
              </button>
            </div>
          </div>

          {/* Danh sách tập — desktop ẩn (cột phải), mobile hiện khi bật tab */}
          {movie.episodes.length > 0 && (
            <div className="mt-4 lg:hidden">
              <button
                type="button"
                onClick={() => setShowEpisodeList((v) => !v)}
                aria-expanded={showEpisodeList}
                className="flex items-center gap-2 rounded-lg border border-elevated bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
              >
                Tập ({movie.episodes.length})
                <ChevronDownIcon className={`h-4 w-4 text-faint transition-transform ${showEpisodeList ? "rotate-180" : ""}`} />
              </button>
              {showEpisodeList && (
                <div className="mt-3">
                  <EpisodeGrid episodes={movie.episodes} baseHref={`/xem/${movie.slug}`} currentSlug={episode} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cột phải desktop: danh sách tập */}
        <aside className="hidden w-80 shrink-0 lg:block">
          <h2 className="font-display text-lg font-bold text-ink">Tập</h2>
          <div className="mt-3 max-h-[60vh] overflow-y-auto pr-1">
            <EpisodeGrid episodes={movie.episodes} baseHref={`/xem/${movie.slug}`} currentSlug={episode} />
          </div>
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-elevated px-4 py-2 text-sm text-ink shadow-xl lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
```

Ghi chú AdSlot (cụ thể hoá spec): spec §4 ghi "countdown 5s → Bỏ qua active sau 5s" mơ hồ (một chữ 5s cho cả hai) — plan chốt theo thống nhất khi brainstorm: tổng pre-roll **10s**, nút "Bỏ qua" active từ giây 5.

- [ ] **Step 5: Verify**

```bash
cd frontend
pnpm lint
pnpm build
```

Expected: sạch. Build sinh route `/xem/[slug]/[episode]`.

- [ ] **Step 6: Kiểm tra dev server**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/xem/phim-1/tap-1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/xem/phim-2/tap-1
```

Expected: cả hai 200 (SSR skeleton). Kiểm tra trình duyệt (checklist visual):
- Pre-roll đếm 10→0, nút "Bỏ qua" active sau 5s, hết đếm video tự phát (BigBuckBunny…)
- Controls tự ẩn sau 3s khi phát, hiện khi di chuột; play/pause/seek/mute/fullscreen hoạt động
- Đổi server SV1→SV2: video đổi nguồn, giữ thời điểm phát
- Tập > 1 (vd `/xem/phim-1/tap-3`): banner "Tiếp tục xem từ phút X" + 2 nút; `/xem/phim-1/tap-1` không hiện
- Desktop: cột phải "Tập" scroll; mobile (<1024px): tab "Tập" bên dưới player
- Bookmark/Thích/Báo lỗi → toast; banner "Ad Slot 728×90" dưới player desktop
- `/xem/phim-999/tap-1` → "Không tìm thấy phim hoặc tập này"

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/icons.tsx frontend/src/components/player frontend/src/components/ui/AdSlot.tsx frontend/src/app/xem
git commit -m "feat(watch): add watch page with player shell, ad slot and server switching"
```

---

### Task 6: Verify tổng + ghi chú plan

**Files:**
- Modify: `docs/superpowers/plans/2026-08-11-webphim-phase2-detail-watch.md` (ghi chú hoàn thành)

- [ ] **Step 1: Chạy toàn bộ verification**

```bash
composer test          # backend: 3 test API + 2 example
vendor/bin/pint        # backend style
cd frontend && pnpm lint && pnpm build   # frontend
```

Expected: tất cả xanh.

- [ ] **Step 2: Kiểm tra end-to-end bằng curl (backend + frontend)**

```bash
curl -s http://127.0.0.1:8000/api/v1/movies/phim-5 | grep -o '"episodes":\[[^]]*\]' | head -c 200   # 24 tập
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/phim/phim-5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/xem/phim-5/tap-3
```

Expected: API trả episodes, 2 route 200. Kiểm tra visual cuối (người dùng) trên trình duyệt: click phim bất kỳ từ trang chủ → chi tiết → XEM PHIM → player chạy được.

- [ ] **Step 3: Ghi chú hoàn thành vào đầu plan**

Thêm block "## Execution notes (2026-08-11 — đã hoàn thành)" ngay dưới header (giống Phase 1), ghi: 6 task xong, số commit, các lệch so với plan nếu có.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-08-11-webphim-phase2-detail-watch.md
git commit -m "docs: mark Phase 2 plan complete with execution notes"
```

---

## Self-Review

**1. Spec coverage:**
- API `GET /api/v1/movies/{slug}` (camelCase, episodes/servers/credits/similar, 404, isNew/isHot động) → Task 2
- Seeder khớp fixture (14 phim, genres đúng slug, 122 episodes, 244 servers, 8 people) → Task 1
- Feature test (200 + structure, 404, phim lẻ "Full") → Task 2
- Types + apiClient fallback + refactor /ket-noi + useMovieDetail → Task 3
- Trang chi tiết (hero, rating sao local, XEM PHIM, bookmark, EpisodeGrid tick/current, cast scroll, similar CarouselRow, bình luận mock, skeleton/error) → Task 4
- Trang xem (PlayerShell auto-hide + giữ currentTime khi đổi server, AdSlot pre-roll + banner, server tabs, episode list desktop/mobile, nhắc tiếp tục xem, bookmark/like/report + toast, notFound) → Task 5
- Verify tổng + ghi chú plan → Task 6

**2. Placeholder scan:** mọi step có code đầy đủ; không có TBD/TODO.

**3. Type consistency:**
- `MovieDetail`/`MovieEpisode`/`EpisodeServer`/`Credit` (Task 3) — Task 4/5 dùng đúng tên field: `episodes[].slug`, `servers[].linkM3u8/serverName`, `credits.actors[].characterName`, `similar` là `MovieSummary[]`
- `fetchJson<T>` trả `{ baseUrl, data }`; `NotFoundError` import đúng từ `@/lib/api` ở cả 2 trang
- `useMovieDetail` trả `{ data, loading, error: Error | null, retry }` — trang dùng `error instanceof NotFoundError` (error là Error, không phải string)
- `EpisodeGrid` props `(episodes, baseHref, currentSlug?)` — Task 4 (detail, không currentSlug) và Task 5 (xem, có currentSlug) dùng đúng
- Icon mới đều thêm vào `icons.tsx` trước khi component dùng (`StarIcon/CheckIcon/ThumbsUpIcon` Task 4; `PauseIcon/Volume2Icon/VolumeXIcon/MaximizeIcon/FlagIcon` Task 5)
- `AdSlot({ onEnded })` — Task 5 page truyền `onEnded={() => setAdDone(true)}` đúng tên
- `PlayerShell({ src, title, autoPlay })` — page truyền đủ 3 props
- Lint rule `set-state-in-effect`: mọi effect đều setState trong callback async hoặc gọi hàm DOM trực tiếp (video.play()) — không setState đồng bộ (trừ event handler/interval callback)
- Seeder: `directors()`/`actors()` attach với `role` trong pivot — khớp `movie_person` migration + model scoped relations
