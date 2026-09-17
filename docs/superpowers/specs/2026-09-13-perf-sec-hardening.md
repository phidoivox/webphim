# WebPhim — Perf & Security Hardening (đợt còn lại)

- **Ngày**: 2026-09-13
- **Trạng thái**: Chưa duyệt — chờ người dùng chốt trước khi lập plan
- **Phạm vi**: 13 findings audit còn lại sau đợt fix 2026-09-13 (14/27 đã xong, verify: backend 99 pass, tsc sạch, build pass, lint 0 errors)
- **Không gồm**: đổi contract auth đang chạy, redesign sitemap/index, đo production (slow log/Lighthouse/load test)

## Bối cảnh

Audit perf+sec 177 agents, verify 2 lens, còn 27 findings. Đợt 1 fix xong: unlike scope ID (`CommentService.php:280`), revalidate secret fail-closed (`route.ts`, `MovieObserver.php`), fan-out queue (`BroadcastSystemNotification`, `NotifyNewEpisode` jobs + `unreadCountsFor()`), replies limit 3, HeroBanner adjacent render, echo dynamic import, throttle IP, moderator guard, redirect whitelist, Header AbortController.

Stack: Laravel 13 / PHP 8.3 / MySQL / Redis (`CACHE_STORE=redis`, tags OK), Next.js 16.3 `cacheComponents:true`, Sanctum `expiration=null` (vendor default), `trustProxies` theo `TRUSTED_PROXIES` (trống = không trust thêm).

## Yêu cầu chức năng

### BE-1. Sanctum token expiry + rotation (thay thế: giữ token vĩnh viễn hiện tại)

- Login/register cấp token có `expires_at`: nhớ đăng nhập (`rememberMe=true`, default login form) = 30 ngày, không nhớ = 24 giờ.
- Mọi request auth với token hết hạn trả 401, frontend logout local + redirect `/dang-nhap`.
- Terminal logout thu hồi token hiện tại (đã có `AuthService::logout()`), thêm endpoint thu hồi tất cả token còn hiệu lực của user.
- Không dùng abilities phân quyền API — mọi token full access như hiện tại.

### BE-2. Bookmark per_page lower bound

- `BookmarkService::getList()` clamp `per_page` về `[1, 50]` (hiện chỉ `min(..., 50)`, `per_page=0`/`-5` lọt xuống paginate).
- Áp dụng cùng bound cho comment payload guest (`CommentService::getMovieCommentsPayload()` đã clamp `[1,50]` — giữ nguyên, không đổi).

### BE-3. View log giảm ồn

- `MovieController::show()` bỏ `Log::info("Movie viewed: ...")` mỗi hit, giữ `defer(incrementViewCountBySlug)`.
- Giữ hành vi đếm view hiện tại nguyên vẹn (không đổi logic increment).

### BE-4. Comment auth overlay cache (thay thế: bypass cache khi login)

- Payload base guest cache 120/300s giữ nguyên. User login đọc base từ cache + overlay `is_liked` per-user qua 1 query `comment_likes` batch (`whereIn comment_id + user_id`), không query N+1.
- `CommentResource::toArray()` ưu tiên `is_liked` overlay khi có, fallback `isLikedBy()` như hiện tại.
- Replies limit 3 đã fix — không đổi.

### BE-5. Index sort popular + notifications ordering

- Migration mới: composite index `comments(movie_id, status, likes_count DESC, created_at DESC)` phục vụ `sort=popular` (`CommentService.php:60-61`).
- Migration mới: composite index `notifications(notifiable_type, notifiable_id, created_at DESC)` phục vụ `getUserNotifications()` order latest.
- Giữ index cũ nguyên vẹn (không drop), rollback được.

### FE-1. HttpOnly auth cookie flow (thay thế: localStorage + JS cookie hiện tại)

- Backend set `auth_token` HttpOnly + Secure (prod) + SameSite=Lax sau login/register, clear sau logout. Response JSON giữ `token` 1 đợt để tương thích client cũ.
- Frontend: `lib/auth.ts` đọc token từ memory/context trước, localStorage chỉ fallback đọc (không ghi mới), không ghi `document.cookie` nữa.
- XSS không đọc được token từ JS sau khi xong (verify bằng đọc `document.cookie` không thấy `auth_token`).

### FE-2. Sitemap index + chunks

- `/sitemap.xml` hiện tại thành index trỏ `sitemap/movies/[page]`, mỗi chunk tối đa 1000 URLs (thay cap 50 hiện tại).
- Chunk query DB phân trang theo `id`, không load full catalog vào memory.
- Giữ static/genre/country URLs như hiện tại (`sitemap.ts:17-48`).

### FE-3. Priorities + dynamic imports còn lại

- `MovieDetailView.tsx:185` backdrop giữ `priority`, poster bỏ `priority` (chỉ 1 LCP candidate mỗi viewport).
- `WatchViewClient.tsx:8` `CommentSection` chuyển `next/dynamic` (ssr:false + skeleton), giữ `EpisodeGrid` static.
- `the-loai/[slug]/page.tsx:29` + `quoc-gia/[slug]/page.tsx:28` fetch taxonomy và movies song song (`Promise.all`), giữ fallback `[]` khi lỗi.

## Yêu cầu phi chức năng

- Mọi thay đổi backend có test RED trước GREEN sau (`php artisan test`), frontend typecheck + build pass.
- Không thêm dependency mới. Không đổi API response shape hiện tại (chỉ thêm field/endpoint mới).
- Đăng nhập 10 req/phút/IP giữ nguyên sau BE-1.

## Tiêu chí chấp nhận

- [ ] Token hết hạn 401 + frontend logout đúng; thu hồi all tokens hoạt động
- [ ] `per_page=0`/`-5` bookmark trả clamp 1, không 500
- [ ] 100 hits detail không sinh 100 dòng `Movie viewed` log
- [ ] Comment list login dùng cache base + 1 batch likes query
- [ ] `EXPLAIN` popular sort + notif list dùng index mới
- [ ] `document.cookie` không lộ `auth_token` sau login
- [ ] Sitemap index liệt kê >50 phim, chunk load <1000 URLs
- [ ] Chỉ 1 `priority` image mỗi detail viewport; CommentSection lazy; taxonomy+movies song song

## Ngoài phạm vi (ghi nhận, không làm đợt này)

- Đo production: slow query log, Lighthouse, bundle size, realtime load test
- Abilities phân quyền Sanctum, 2FA, OAuth
- Redesign sitemap discovery (ping search engine), prerender full catalog
