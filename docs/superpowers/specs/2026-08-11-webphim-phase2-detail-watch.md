# WebPhim — Phase 2: Trang chi tiết phim + Trang xem phim (API Laravel song song)

- **Ngày**: 2026-08-11
- **Trạng thái**: Brainstorm đã xong — chờ người dùng duyệt spec
- **Cơ sở**: spec tổng thể `2026-08-11-webphim-ui-design.md` §3.2, §3.3, §5 — Phase 2 theo thứ tự triển khai

## Bối cảnh

Phase 1 đã xong (tokens, shell, trang chủ mock — 8 commit trên `main`). Phase 2 xây hai trang phía người xem và bắt đầu API Laravel thật:

- Trang chi tiết phim `/phim/:slug` (trước đây là 404)
- Trang xem phim `/xem/:slug/:episode` (nút XEM NGAY ở hero đã trỏ tới đây từ Phase 1)
- Backend: `GET /api/v1/movies/{slug}` — endpoint đọc duy nhất cho phase này + seeder dữ liệu mẫu

## Quyết định đã chốt với người dùng

| Quyết định | Lựa chọn |
|---|---|
| Backend trong phase này | Có — `GET /api/v1/movies/{slug}` (chi tiết + tập + server + credits + similar) + seeder. Trang chủ GIỮ mock (nối API sau) |
| Cách frontend gọi API | Client-fetch (giống pattern `/ket-noi`), `apiClient` dùng chung với fallback nhiều URL, skeleton khi tải |
| Player mock | Sample MP4 công khai (Big Buck Bunny, Sintel, Tears of Steel — mỗi server 1 file khác nhau để test chuyển server) |
| Quảng cáo | Có AdSlot placeholder, mặc định tất cả user = free (pre-roll 5s + banner 728×90) — phân biệt VIP khi có auth (Phase 4) |
| Bình luận | UI mock trên trang chi tiết (2–3 comment + khung "Đăng nhập để bình luận") — nối API Phase 4 |
| Nhắc "Tiếp tục xem từ phút X" | Có, mock dismissible, chỉ hiện với tập > 1 |
| Ngoài phạm vi | Auth, bookmark/comment/history thật, trang chủ nối API, `/home` endpoint, VIP thật |

## 1. Backend API

### Route

`routes/api.php`:

```php
Route::get('/v1/movies/{movie:slug}', [MovieController::class, 'show']);
```

### Controller

`app/Http/Controllers/Api/V1/MovieController.php` — `show(Movie $movie): JsonResponse`.

### Response — JSON camelCase (khớp type frontend, không map lại)

```jsonc
{
  "data": {
    "id": 1, "slug": "phim-1", "name": "Mặt Trời Đỏ", "originName": "Red Sun Rising",
    "thumbUrl": "…", "posterUrl": "…", "content": "mô tả phim",
    "year": 2026, "quality": "FHD", "type": "series", "status": "ongoing",
    "episodeCurrent": "12/20", "episodeTotal": null,
    "ratingAvg": 8.7, "ratingCount": 12, "viewCount": 12345,
    "isCinema": false, "isNew": false, "isHot": true,
    "trailerUrl": null, "durationMinutes": 45,
    "genres": ["Hành động", "Phiêu lưu"],
    "countries": ["Việt Nam"],
    "episodes": [
      { "id": 1, "name": "Tập 1", "slug": "tap-1",
        "servers": [ { "id": 1, "serverName": "SV1", "langType": "vietsub", "linkM3u8": "https://…/bbb.mp4" } ] }
    ],
    "credits": {
      "directors": [ { "id": 1, "name": "…", "avatarUrl": "…" } ],
      "actors":    [ { "id": 2, "name": "…", "avatarUrl": "…", "characterName": "…" } ]
    },
    "similar": [ /* shape MovieSummary: id, slug, name, thumbUrl, year, quality, type, episodeCurrent… */ ]
  }
}
```

- **`isNew` / `isHot`**: không có cột trong DB — tính động: `isNew` = `created_at ≥ now − 30 ngày`; `isHot` = `view_count ≥ 10.000` hoặc `rating_avg ≥ 8.5`
- **`similar`**: cùng thể loại (giao nhau ít nhất 1 `movie_genre`), loại trừ chính nó, order `rating_avg` desc, limit 10, shape summary (không kèm episodes/servers)
- **`credits`**: `movie_person` pivot role `director` / `actor` (đã có scoped relations `directors()` / `actors()` trong model `Movie`), order theo `sort_order`
- Slug không tồn tại (hoặc soft-deleted): trả `404 {"message": …}`
- Cột `backdrop_url` **không tồn tại** trong schema — detail page dùng poster/thumb, không cần backdrop (HeroBanner trang chủ giữ mock của nó)

### Seeder (`database/seeders/DatabaseSeeder.php`)

Tạo lại dữ liệu mẫu khớp fixture Phase 1 (idempotent — xoá trước, tạo sau):

- 8 genres đúng slug: `hanh-dong, tinh-cam, hai, kinh-di, vien-tuong, hoat-hinh, tam-ly, phieu-luu`
- 2–3 countries (Việt Nam, Hàn Quốc, Mỹ)
- 6–8 people (2–3 đạo diễn + 4–5 diễn viên, avatar picsum seed `person-N`)
- 14 movies khớp fixture: slug `phim-1..14`, name, type (series/single), quality, year, `thumb_url`/`poster_url` picsum seed `phim-N`, `content` = description (hero fixture cho phim 1/5/12, còn lại câu ngắn)
- Counter seed theo fixture: `rating_avg` (8.7, 8.1, 8.4…), `rating_count` 5–50, `view_count` (phim hot ≥ 10.000 để `isHot` đúng)
- Episodes: series → số tập tương ứng (phim-1: 12, phim-3: 20, phim-5: 24, phim-7: 12, phim-9: 10, phim-10: 16, phim-12: 12, phim-14: 10 — còn lại số nhỏ), tên "Tập N" slug `tap-N`; phim lẻ → 1 tập "Full" slug `tap-1`
- Mỗi episode 2 server: SV1/SV2, `lang_type` vietsub, `link_m3u8` = sample MP4 (3 file khác nhau luân phiên để test chuyển server)
- `movie_genre`, `movie_country`, `movie_person` (role director/actor + `character_name` cho actor, `sort_order`)

### Test (PHPUnit, sqlite :memory:)

`tests/Feature/Api/V1/MovieDetailTest.php`:

- `GET /api/v1/movies/phim-1` → 200; JSON chứa `data.name`, `data.episodes[0].servers[0].link_m3u8`, `data.credits.actors`, `data.similar` là array
- Slug lạ (`phim-999`) → 404
- `RefreshDatabase` + gọi seeder trong test

## 2. Frontend — tầng dữ liệu

### Types (`src/types/movie.ts` — thêm vào)

```ts
interface EpisodeServer { id: number; serverName: string; langType: string; linkM3u8: string | null; }
interface MovieEpisode { id: number; name: string; slug: string; servers: EpisodeServer[]; }
interface Credit { id: number; name: string; avatarUrl: string | null; characterName?: string | null; }
interface MovieDetail {
  id: number; slug: string; name: string; originName: string | null;
  thumbUrl: string; posterUrl: string; content: string | null;
  year: number | null; quality: string | null; type: string; status: string;
  episodeCurrent: string | null; episodeTotal: string | null;
  ratingAvg: number; ratingCount: number; viewCount: number;
  isCinema: boolean; isNew: boolean; isHot: boolean;
  trailerUrl: string | null; durationMinutes: number | null;
  genres: string[]; countries: string[];
  episodes: MovieEpisode[]; credits: { directors: Credit[]; actors: Credit[] };
  similar: MovieSummary[];
}
```

### `src/lib/api.ts` — client dùng chung

- `POSSIBLE_API_URLS` (chuyển từ `/ket-noi`): `NEXT_PUBLIC_API_URL` → `http://webphim.test/api` → `http://localhost/webphim/public/api` → `http://127.0.0.1:8000/api` → `http://localhost:8000/api`
- `fetchJson<T>(path)`: thử lần lượt các base, trả `{ baseUrl, data }` của base 200 đầu tiên (baseUrl để `/ket-noi` hiển thị URL đang dùng); hết → quăng `ApiError` (message tiếng Việt)
- `getMovieDetail(slug): Promise<MovieDetail>` → `(await fetchJson<{data: MovieDetail}>('/v1/movies/' + slug)).data``
- Refactor `/ket-noi`: dùng chung `fetchJson` (bỏ `probeBackends` cục bộ, giữ UI)

### Hook `useMovieDetail(slug)` (`src/hooks/useMovieDetail.ts`)

`{ data, loading, error, retry }` — fetch khi mount + khi slug đổi, guard `mounted`, retry gọi lại. Trang hiện **skeleton** khi loading, **error card + nút "Thử lại"** khi fail.

## 3. Trang chi tiết `/phim/[slug]`

Client component (fetch qua `useMovieDetail`). `generateMetadata` không dùng được vì client-fetch — chấp nhận, metadata tĩnh "PHIM HAY".

- **Hero**: grid 2 cột (mobile xếp dọc). Trái: poster `aspect-[2/3]` bo 12px, shadow. Phải: `name` (font-display extrabold) + `originName` muted · chips meta (year · quality · `type` label: series→"Phim bộ", single→"Phim lẻ" · `episodeCurrent`/`episodeTotal`) · genres · rating: sao cam (component `RatingStars`, **local state** — chưa gửi API) + `ratingAvg (ratingCount lượt)` · `content` `line-clamp-3` + nút "Xem thêm" · nút **XEM PHIM** (cam, to — trỏ `/xem/{slug}/{episode đầu}` hoặc `tap-1` nếu không có tập) + Bookmark toggle (local) + "Xem trailer" nếu `trailerUrl`
- **Chọn tập**: `EpisodeGrid` — lưới nút vuông bo 8px, `border-accent` cho tập đang mở, tick "đã xem" mock cho 3 tập đầu (icon check nhỏ, không emoji), click → `/xem/{slug}/{episode.slug}`
- **Diễn viên / Đạo diễn**: 2 dòng avatar scroll ngang (avatar picsum seed person id, vòng bo đầy đủ), actor hiện `characterName`
- **Phim tương tự**: tái sử dụng `CarouselRow` (tự scroll + mũi tên sẵn có)
- **Bình luận mock**: 2–3 `CommentItem` (avatar, tên, thời gian, nội dung, like count + nút like local) + khung placeholder "Đăng nhập để bình luận" (border-dashed)
- **Skeleton**: khối hero + lưới tập + carousel (shimmer, dùng `animate-pulse` + surface)

## 4. Trang xem `/xem/[slug]/[episode]`

Client component. Fetch detail → tìm episode theo param slug; không có (hoặc không server nào có link) → UI "Không tìm thấy tập này" + link về trang chi tiết.

- **Bố cục**: player full-width (tối tuyệt đối, `bg-base`), desktop: cột phải `w-80` danh sách tập; mobile: tab "Tập" dưới player (switch cột phải/tab)
- **PlayerShell** (client, component mới `src/components/player/PlayerShell.tsx`):
  - `<video>` HTML5, src = `linkM3u8` server đang chọn; autoplay sau khi hết pre-roll
  - Auto-hide: thanh điều khiển hiện khi mousemove/touch, ẩn sau 3s khi đang phát; tap màn hình toggle; thanh controls là gradient đen mờ đáy
  - Controls: play/pause · seek bar (input range, hiển thị thời gian hiện tại/tổng) · mute · fullscreen
  - Video `onError` → thông báo + gợi ý đổi server
- **AdSlot** (`src/components/ui/AdSlot.tsx`, mặc định free):
  - Pre-roll: overlay "Quảng cáo" countdown 5s → nút "Bỏ qua" active sau 5s; bỏ qua (hoặc hết 5s) → video chạy. Khi bỏ qua/hết → không show lại trong phiên
  - Banner: box placeholder `728×90` ("Ad Slot 728×90") dưới player, `hidden lg:block`
  - `isVip` prop để Phase 4 tắt khi VIP (mặc định `false`)
- **Server tabs**: SV1/SV2 đổi `video.src` + đổi lại nguồn, giữ `currentTime`
- **Episode list**: nút tập (giống EpisodeGrid), highlight tập đang xem, "đã xem" tick; desktop scroll độc lập cột phải
- **Thanh dưới player**: Bookmark · Like · "Báo lỗi phim" (local state + toast "Đã lưu bookmark" kiểu đơn giản; chưa gọi API)
- **Nhắc "Tiếp tục xem từ phút X"**: banner nhỏ dismissible (mock phút = `(tập số) * 3 % 15 + 5`, chỉ hiện khi tập > 1), nút "Xem tiếp" (tiếp tục phát) / "Tắt"

## 5. Xử lý lỗi

- API fail hết fallback → error card + "Thử lại" (cả 2 trang)
- Slug phim lạ → backend 404 → frontend "Không tìm thấy phim" + link về trang chủ
- Episode lạ / không có server → như trên
- Video lỗi → message trong player + gợi ý đổi server

## 6. Verification

- **Backend**: `composer test` (MovieDetailTest) · `vendor/bin/pint` · thực tế: `php artisan migrate --seed` (MySQL `webphim`) + `php artisan serve` + curl `http://127.0.0.1:8000/api/v1/movies/phim-1` (kiểm tra episodes/servers/credits/similar) và `phim-999` → 404
- **Frontend**: `pnpm lint` + `pnpm build`; dev server (port 3000 đang chạy):
  - `/phim/phim-1`: hero + tập + cast + tương tự + bình luận; skeleton khi tải; tắt backend → error + "Thử lại"
  - `/xem/phim-1/tap-1`: pre-roll 5s → video phát được; auto-hide controls; đổi server giữ nguyên thời điểm; chuyển tập; cột phải desktop / tab mobile; nhắc "tiếp tục xem" ở tập > 1
  - `/xem/phim-2/tap-1` (phim lẻ) vẫn chạy
- Sau mỗi task: commit riêng; cuối phase: ghi chú hoàn thành vào plan doc

## 7. Thứ tự triển khai (cho writing-plans)

1. Backend: seeder + controller + route + resource shape
2. Backend: feature test + `composer test` + chạy thực tế (migrate --seed + curl)
3. Frontend: types + `lib/api.ts` + refactor `/ket-noi` + `useMovieDetail`
4. Frontend: trang chi tiết `/phim/[slug]` (hero + EpisodeGrid + cast + similar + comments mock + skeleton)
5. Frontend: PlayerShell + AdSlot + trang xem `/xem/[slug]/[episode]`
6. Verify tổng (lint/build/dev server/curl) + ghi chú plan
