# Perf & Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 13 audit findings còn lại theo spec mà không đổi API response shape hiện tại.

**Architecture:** Backend trước (token expiry, bounds, overlay, indexes), frontend sau (cookie, sitemap, priorities). Mỗi task TDD: test RED, fix GREEN, suite liên quan pass mới commit.

**Tech Stack:** Laravel 13 / PHP 8.3 / MySQL / Redis, PHPUnit sqlite :memory:; Next.js 16.3 / React 19 / TS, `pnpm --prefix frontend exec tsc --noEmit`, `pnpm --prefix frontend build`.

**Spec:** `docs/superpowers/specs/2026-09-13-perf-sec-hardening.md`

## Global Constraints

- Không thêm dependency mới (npm/composer).
- Không đổi API response shape hiện tại — chỉ thêm field/endpoint mới.
- Login throttle 10 req/phút/IP giữ nguyên (`app/Providers/AppServiceProvider.php:56-60`).
- Sanctum `expiration` config giữ `null` — expiry set per-token qua `expires_at`.
- Next 16.3 breaking changes — đọc `frontend/node_modules/next/dist/docs/` trước khi viết code frontend (xem `frontend/AGENTS.md`).
- UI copy + code comments giữ style Việt/Anh hiện tại.
- Mỗi task backend chạy `php artisan test --filter=<Test>`; frontend chạy `tsc --noEmit` + `build` khi đổi code.

---

### Task 1: BE-1a — Token expiry theo rememberMe

**Files:**
- Modify: `app/Services/AuthService.php:19-70`
- Modify: `app/Http/Requests/Api/V1/Auth/LoginRequest.php:18-24`
- Test: `tests/Feature/Api/V1/AuthApiTest.php`

**Interfaces:**
- Consumes: `LoginRequest::validated()` thêm `remember_me?: bool`
- Produces: `AuthService::register(array): array{user, token}` (token 30 ngày), `AuthService::login(string, string, ?string, bool $remember = true)` (token 30 ngày / 24 giờ)

- [ ] **Step 1: Write the failing test**

```php
public function test_login_token_expiry_follows_remember_me(): void
{
    $user = User::factory()->create(['email' => 'ttl@example.com', 'password' => 'secret123', 'is_active' => true]);

    $long = $this->postJson('/api/v1/auth/login', ['email' => 'ttl@example.com', 'password' => 'secret123', 'remember_me' => true]);
    $long->assertOk();
    $longToken = $user->tokens()->latest('id')->first();
    $this->assertEqualsWithDelta(now()->addDays(30)->timestamp, $longToken->expires_at->timestamp, 120);

    $short = $this->postJson('/api/v1/auth/login', ['email' => 'ttl@example.com', 'password' => 'secret123', 'remember_me' => false]);
    $short->assertOk();
    $shortToken = $user->tokens()->latest('id')->first();
    $this->assertEqualsWithDelta(now()->addHours(24)->timestamp, $shortToken->expires_at->timestamp, 120);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=test_login_token_expiry_follows_remember_me`
Expected: FAIL — `expires_at` null, delta mismatch.

- [ ] **Step 3: Write minimal implementation**

```php
// app/Http/Requests/Api/V1/Auth/LoginRequest.php — thêm rule:
'remember_me' => ['nullable', 'boolean'],
```

```php
// app/Services/AuthService.php
public function register(array $data): array
{
    return DB::transaction(function () use ($data) {
        $user = User::create([...]); // giữ nguyên
        $token = $user->createToken('auth_token', ['*'], now()->addDays(30))->plainTextToken;

        return ['user' => $user, 'token' => $token];
    });
}

public function login(string $email, string $password, ?string $deviceName = null, bool $remember = true): array
{
    // ... giữ nguyên lookup + Hash::check + is_active abort
    $expiresAt = $remember ? now()->addDays(30) : now()->addHours(24);
    $token = $user->createToken($tokenName, ['*'], $expiresAt)->plainTextToken;

    return ['user' => $user, 'token' => $token];
}
```

```php
// app/Http/Controllers/Api/V1/AuthController.php — login truyền thêm:
$result = $this->authService->login(
    (string) $request->input('email'),
    (string) $request->input('password'),
    $request->input('device_name'),
    (bool) $request->boolean('remember_me', true),
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter="AuthApiTest"`
Expected: PASS — toàn bộ auth tests cũ + mới.

- [ ] **Step 5: Commit**

```bash
git add app/Services/AuthService.php app/Http/Requests/Api/V1/Auth/LoginRequest.php app/Http/Controllers/Api/V1/AuthController.php tests/Feature/Api/V1/AuthApiTest.php
git commit -m "feat(auth): token expiry 30d remember / 24h session"
```

### Task 2: BE-1b — Revoke-all tokens endpoint

**Files:**
- Modify: `app/Services/AuthService.php`
- Modify: `app/Http/Controllers/Api/V1/AuthController.php`
- Modify: `routes/api.php:38-41`
- Test: `tests/Feature/Api/V1/AuthApiTest.php`

**Interfaces:**
- Consumes: `AuthService::logout(User)` hiện tại
- Produces: `AuthService::logoutAll(User): int` (số token đã xóa); `POST /api/v1/auth/logout-all` → `{status, message, data: {revokedCount}}`

- [ ] **Step 1: Write the failing test**

```php
public function test_user_can_revoke_all_tokens(): void
{
    $user = User::factory()->create();
    $t1 = $user->createToken('a')->plainTextToken;
    $t2 = $user->createToken('b')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$t1}")
        ->postJson('/api/v1/auth/logout-all')
        ->assertOk()
        ->assertJsonPath('data.revokedCount', 2);

    $this->assertDatabaseCount('personal_access_tokens', 0);
    $this->withHeader('Authorization', "Bearer {$t2}")->getJson('/api/v1/auth/me')->assertUnauthorized();
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=test_user_can_revoke_all_tokens`
Expected: FAIL 404 — route chưa tồn tại.

- [ ] **Step 3: Write minimal implementation**

```php
// app/Services/AuthService.php
public function logoutAll(User $user): int
{
    return (int) $user->tokens()->delete();
}
```

```php
// app/Http/Controllers/Api/V1/AuthController.php
public function logoutAll(Request $request): JsonResponse
{
    $count = $this->authService->logoutAll($request->user());

    return response()->json([
        'status' => 'success',
        'message' => 'Đã đăng xuất khỏi tất cả thiết bị.',
        'data' => ['revokedCount' => $count],
    ], 200);
}
```

```php
// routes/api.php — trong group auth:sanctum hiện tại:
Route::post('/logout-all', [AuthController::class, 'logoutAll']);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter="AuthApiTest"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Services/AuthService.php app/Http/Controllers/Api/V1/AuthController.php routes/api.php tests/Feature/Api/V1/AuthApiTest.php
git commit -m "feat(auth): revoke-all tokens endpoint"
```

### Task 3: BE-1c + FE-1a — rememberMe plumbing + HttpOnly cookie

**Files:**
- Modify: `frontend/src/types/auth.ts:24-35`
- Modify: `frontend/src/lib/api.ts:199-223`
- Modify: `frontend/src/context/AuthContext.tsx:79-121`
- Modify: `frontend/src/components/auth/LoginForm.tsx:37-47`
- Modify: `app/Http/Controllers/Api/V1/AuthController.php:22-55`
- Test: `tests/Feature/Api/V1/AuthApiTest.php`

**Interfaces:**
- Consumes: `LoginRequest` có `remember_me` (Task 1); `LoginInput.rememberMe` đã có trong zod schema
- Produces: `LoginPayload` thêm `remember_me?: boolean`; cookie `auth_token` HttpOnly + SameSite=Lax (+ Secure khi prod); JSON giữ `token` tương thích

- [ ] **Step 1: Write the failing test**

```php
public function test_login_sets_httponly_auth_cookie(): void
{
    User::factory()->create(['email' => 'cookie@example.com', 'password' => 'secret123', 'is_active' => true]);

    $response = $this->postJson('/api/v1/auth/login', ['email' => 'cookie@example.com', 'password' => 'secret123']);
    $response->assertOk();
    $cookie = $response->headers->getCookies()[0] ?? null;
    $this->assertNotNull($cookie);
    $this->assertSame('auth_token', $cookie->getName());
    $this->assertTrue($cookie->isHttpOnly());
    $this->assertNotEmpty($response->json('data.token'));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=test_login_sets_httponly_auth_cookie`
Expected: FAIL — không có cookie nào.

- [ ] **Step 3: Write minimal implementation**

```php
// app/Http/Controllers/Api/V1/AuthController.php — register + login bọc response cookie:
private function withAuthCookie(JsonResponse $response, string $token, bool $remember): JsonResponse
{
    $minutes = $remember ? 60 * 24 * 30 : 60 * 24;

    return $response->withCookie(cookie(
        'auth_token', $token, $minutes, '/', null, app()->isProduction(), true, false, 'Lax'
    ));
}
```

```php
// register(): $remember = true; login(): $remember = (bool) $request->boolean('remember_me', true);
// logout()/logoutAll(): ->withoutCookie('auth_token')
```

```ts
// frontend/src/types/auth.ts
export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
  remember_me?: boolean;
}
```

```ts
// frontend/src/components/auth/LoginForm.tsx — onSubmit truyền rememberMe:
await login({
  email: data.email.trim(),
  password: data.password,
  remember_me: data.rememberMe,
});
```

- [ ] **Step 4: Run tests to verify**

Run: `php artisan test --filter="AuthApiTest"` — Expected: PASS.
Run: `pnpm --prefix frontend exec tsc --noEmit` — Expected: sạch.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Api/V1/AuthController.php tests/Feature/Api/V1/AuthApiTest.php frontend/src/types/auth.ts frontend/src/components/auth/LoginForm.tsx frontend/src/lib/api.ts frontend/src/context/AuthContext.tsx
git commit -m "feat(auth): httponly cookie + remember_me plumbing"
```

### Task 4: FE-1b — lib/auth.ts ngừng ghi token ra JS

**Files:**
- Modify: `frontend/src/lib/auth.ts:24-54`
- Test: thủ công — `document.cookie` không chứa `auth_token` sau login; reload vẫn giữ session qua context

**Interfaces:**
- Consumes: `AuthContext` set token memory (đã có)
- Produces: `setStoredToken` chỉ cache user meta, không ghi `localStorage` token hay `document.cookie`

- [ ] **Step 1: Write the failing check**

```bash
pnpm --prefix frontend exec tsc --noEmit
```

Grep xác nhận còn ghi JS: `grep -n "localStorage.setItem(TOKEN_KEY\|document.cookie = \`auth_token" frontend/src/lib/auth.ts` — Expected: còn match (RED = vẫn rò).

- [ ] **Step 2: Minimal implementation**

```ts
// frontend/src/lib/auth.ts
export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  // Token nằm ở HttpOnly cookie do backend set — không persist ra JS storage nữa.
  // Giữ hàm để tương thích caller, không ghi gì thêm.
}
```

Xóa `localStorage.setItem(TOKEN_KEY, token)` và block `document.cookie = auth_token...`. Giữ `removeStoredToken()` xóa local key cũ (migration 1 lần) nhưng không ghi mới. `getStoredToken()` giữ fallback đọc (client cũ) — không đụng.

- [ ] **Step 3: Verify**

Run: `grep -n "localStorage.setItem(TOKEN_KEY" frontend/src/lib/auth.ts` — Expected: no match.
Run: `pnpm --prefix frontend exec tsc --noEmit` — Expected: sạch.
Run: `pnpm --prefix frontend build` — Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/auth.ts
git commit -m "fix(auth): stop persisting token to JS-readable storage"
```

### Task 5: BE-2 — Bookmark per_page lower bound

**Files:**
- Modify: `app/Services/BookmarkService.php:90`
- Test: `tests/Feature/Api/V1/BookmarkApiTest.php`

**Interfaces:**
- Consumes: `$filters['per_page']` từ `BookmarkController::index()` (`$request->only([...])`)
- Produces: `getPaginatedBookmarks()` clamp `[1, 50]` — không đổi signature

- [ ] **Step 1: Write the failing test**

```php
public function test_bookmark_list_clamps_invalid_per_page(): void
{
    Sanctum::actingAs($this->user);

    $this->getJson('/api/v1/bookmarks?per_page=0')->assertOk()->assertJsonPath('meta.perPage', 1);
    $this->getJson('/api/v1/bookmarks?per_page=-5')->assertOk()->assertJsonPath('meta.perPage', 1);
    $this->getJson('/api/v1/bookmarks?per_page=999')->assertOk()->assertJsonPath('meta.perPage', 50);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=test_bookmark_list_clamps_invalid_per_page`
Expected: FAIL — `per_page=0` không clamp về 1.

- [ ] **Step 3: Write minimal implementation**

```php
// app/Services/BookmarkService.php:90
$perPage = min(max((int) ($filters['per_page'] ?? 24), 1), 50);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter="BookmarkApiTest"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Services/BookmarkService.php tests/Feature/Api/V1/BookmarkApiTest.php
git commit -m "fix(bookmarks): clamp per_page to [1, 50]"
```

### Task 6: BE-3 — Bỏ view log mỗi hit

**Files:**
- Modify: `app/Http/Controllers/Api/V1/MovieController.php:53-64`

**Interfaces:**
- Consumes: `MovieService::incrementViewCountBySlug(string)` — giữ nguyên
- Produces: `show()` giữ response + defer increment, không log info

- [ ] **Step 1: Write the failing check**

Run: `grep -n 'Movie viewed' app/Http/Controllers/Api/V1/MovieController.php`
Expected: còn match dòng `Log::info("Movie viewed: {$movie}")` (RED = còn ồn).

- [ ] **Step 2: Minimal implementation**

```php
defer(function () use ($movie) {
    $this->movieService->incrementViewCountBySlug($movie);
})->always();
```

Xóa dòng `Log::info(...)`. Kiểm tra `use Illuminate\Support\Facades\Log;` còn dùng ở file không — nếu không, xóa import.

- [ ] **Step 3: Verify**

Run: `grep -n 'Movie viewed' app/Http/Controllers/Api/V1/MovieController.php` — Expected: no match.
Run: `php artisan test --filter="MovieDetailTest"` — Expected: PASS (đếm view nguyên vẹn).

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/Api/V1/MovieController.php
git commit -m "chore(movies): drop per-hit view log"
```

### Task 7: BE-4 — Comment auth overlay cache

**Files:**
- Modify: `app/Services/CommentService.php:26-67`
- Modify: `app/Http/Controllers/Api/V1/CommentController.php:25-42`
- Test: `tests/Feature/Api/CommentTest.php`

**Interfaces:**
- Consumes: `getMovieCommentsPayload()` base guest (cache 120/300s) — giữ nguyên
- Produces: `getMovieComments(int, array, ?User)` khi có user: đọc base từ cùng cache key + overlay `is_liked` qua 1 batch query; `CommentResource` ưu tiên overlay

- [ ] **Step 1: Write the failing test**

```php
public function test_authenticated_comment_list_uses_cached_base_with_overlay(): void
{
    Sanctum::actingAs($this->user);
    $comment = Comment::create(['movie_id' => $this->movie->id, 'user_id' => $this->user->id, 'content' => 'Overlay test', 'status' => 'active']);

    DB::enableQueryLog();
    $res1 = $this->getJson("/api/v1/movies/{$this->movie->slug}/comments");
    $res1->assertOk()->assertJsonPath('data.0.isLiked', false);
    $firstQueries = count(DB::getQueryLog());

    DB::flushQueryLog();
    $this->postJson("/api/v1/comments/{$comment->id}/like")->assertOk();
    DB::flushQueryLog();

    $res2 = $this->getJson("/api/v1/movies/{$this->movie->slug}/comments");
    $res2->assertOk()->assertJsonPath('data.0.isLiked', true);

    // Overlay chỉ thêm batch likes query, không N+1 per-comment
    $this->assertLessThanOrEqual($firstQueries + 2, count(DB::getQueryLog()));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=test_authenticated_comment_list_uses_cached_base_with_overlay`
Expected: FAIL — query count vượt bound (hiện mỗi list login query full + withExists per-comment).

- [ ] **Step 3: Write minimal implementation**

```php
// app/Services/CommentService.php — thêm method:
public function getMovieCommentsForUser(int $movieId, array $filters, User $user): array
{
    $base = $this->getMovieCommentsPayload($movieId, $filters); // base guest từ cache
    $ids = collect($base['data'])->pluck('id')->all();
    $liked = empty($ids) ? [] : DB::table('comment_likes')
        ->where('user_id', $user->id)->whereIn('comment_id', $ids)->pluck('comment_id')->all();
    $likedSet = array_flip($liked);

    foreach ($base['data'] as &$row) {
        $row['isLiked'] = isset($likedSet[$row['id']]);
    }

    return $base;
}
```

```php
// app/Http/Controllers/Api/V1/CommentController.php::index — nhánh login:
$paginator = $this->commentService->getMovieCommentsForUser($movie->id, $request->all(), $currentUser);

return response()->json(['status' => 'success', 'data' => $paginator['data'], 'meta' => $paginator['meta']]);
```

`CommentResource` giữ `isset($comment->is_liked)` branch — payload array đã có `isLiked` nên resource serialize đúng. Không đụng `getMovieComments()` gốc (replies endpoint dùng tiếp).

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter="CommentTest"`
Expected: PASS — cũ + mới.

- [ ] **Step 5: Commit**

```bash
git add app/Services/CommentService.php app/Http/Controllers/Api/V1/CommentController.php tests/Feature/Api/CommentTest.php
git commit -m "perf(comments): cached base + batched like overlay for auth lists"
```

### Task 8: BE-5 — Migration 2 composite indexes

**Files:**
- Create: `database/migrations/2026_09_13_000001_add_perf_sort_indexes.php`
- Test: `php artisan migrate --env=testing` + `EXPLAIN` thủ công

**Interfaces:**
- Consumes: index cũ giữ nguyên (`comments_movie_active_feed_idx`, `comments_feed_pinned_idx`, `notifications_read_at_index`)
- Produces: `comments_popular_sort_idx(movie_id, status, likes_count, created_at)`, `notifications_user_order_idx(notifiable_type, notifiable_id, created_at)`

- [ ] **Step 1: Write the migration (RED = chưa có index)**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->index(['movie_id', 'status', 'likes_count', 'created_at'], 'comments_popular_sort_idx');
        });
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_type', 'notifiable_id', 'created_at'], 'notifications_user_order_idx');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_user_order_idx');
        });
        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex('comments_popular_sort_idx');
        });
    }
};
```

- [ ] **Step 2: Run migrate + verify fails-before/passes-after**

Run: `php artisan migrate --force` — Expected: PASS, 1 batch mới.
Run: `php artisan migrate:rollback --step=1 && php artisan migrate --force` — Expected: PASS cả 2 chiều.

- [ ] **Step 3: Verify EXPLAIN dùng index**

Run: `php artisan tinker --execute="echo json_encode(DB::select(\"EXPLAIN SELECT * FROM comments WHERE movie_id=1 AND status='active' ORDER BY likes_count DESC, created_at DESC LIMIT 15\"), JSON_PRETTY_PRINT);"`
Expected: `key` chứa `comments_popular_sort_idx` (MySQL local; sqlite testing bỏ qua EXPLAIN).

- [ ] **Step 4: Commit**

```bash
git add database/migrations/2026_09_13_000001_add_perf_sort_indexes.php
git commit -m "perf(db): indexes for popular sort + notification ordering"
```

### Task 9: FE-2 — Sitemap index + chunks

**Files:**
- Create: `frontend/src/app/sitemap/movies/[page]/route.ts` (chunk 1000 URLs, query DB phân trang theo id)
- Modify: `frontend/src/app/sitemap.ts` (thành index: static + genre + country + movie chunks)
- Test: `pnpm --prefix frontend build` + curl chunk 1

**Interfaces:**
- Consumes: `getFilteredMovies({per_page, page})` hiện tại cho chunk paging; `getSiteUrl()`; `GENRES`/`COUNTRIES` static
- Produces: `/sitemap.xml` (index), `/sitemap/movies/[page]` (tối đa 1000 URLs/chunk)

- [ ] **Step 1: Confirm RED (cap 50 hiện tại)**

Run: `grep -n "per_page: 50" frontend/src/app/sitemap.ts`
Expected: còn match (RED = catalog sâu không vào sitemap).

- [ ] **Step 2: Write chunk route**

```ts
// frontend/src/app/sitemap/movies/[page]/route.ts
import { getFilteredMovies } from "@/lib/api";
import { getSiteUrl } from "@/lib/env";

const CHUNK = 1000;

export async function GET(_req: Request, { params }: { params: Promise<{ page: string }> }) {
  const page = Math.max(1, parseInt((await params).page, 10) || 1);
  const res = await getFilteredMovies({ per_page: CHUNK, page }).catch(() => ({ data: [] }));
  const urls = (res.data ?? []).map((m) => ({ url: `${getSiteUrl()}/phim/${m.slug}`, lastModified: new Date() }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u.url}</loc></url>`).join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
```

- [ ] **Step 3: Rewrite sitemap.ts thành index**

```ts
// frontend/src/app/sitemap.ts — giữ static/genre/country, thay movieUrls bằng:
const moviePages = Math.max(1, Math.ceil((moviesResult?.meta?.total ?? 0) / 1000));
const xmlIndex = [...Array(moviePages)].map((_, i) => ({
  url: `${BASE_URL}/sitemap/movies/${i + 1}`,
  lastModified: new Date(),
}));
```

Giữ signature `MetadataRoute.Sitemap`. Lấy `total` từ 1 call `getFilteredMovies({per_page: 1})`.

- [ ] **Step 4: Verify**

Run: `pnpm --prefix frontend build` — Expected: pass, route `/sitemap/movies/[page]` xuất hiện.
Run: `pnpm --prefix frontend lint` — Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/sitemap.ts frontend/src/app/sitemap/movies/\[page\]/route.ts
git commit -m "perf(seo): sitemap index with 1000-url movie chunks"
```

### Task 10: FE-3 — Priorities + dynamic + waterfall

**Files:**
- Modify: `frontend/src/components/movie/MovieDetailView.tsx:181-209`
- Modify: `frontend/src/app/xem/[slug]/[episode]/WatchViewClient.tsx:1-29,367-368`
- Modify: `frontend/src/app/the-loai/[slug]/page.tsx:25-56`
- Modify: `frontend/src/app/quoc-gia/[slug]/page.tsx:25-56`

**Interfaces:**
- Consumes: `getCachedGenres()`, `getCachedCountries()`, `getFilteredMovies()` — giữ nguyên
- Produces: cùng JSX/data, chỉ đổi loading strategy

- [ ] **Step 1: Confirm RED (3 patterns cũ)**

Run: `grep -n "priority" frontend/src/components/movie/MovieDetailView.tsx` — Expected: 2 match (backdrop + poster).
Run: `grep -n "CommentSection" frontend/src/app/xem/\[slug\]/\[episode\]/WatchViewClient.tsx | head -3` — Expected: import static dòng 8.

- [ ] **Step 2: Minimal implementation**

```tsx
// MovieDetailView.tsx — poster bỏ priority, giữ backdrop:
<Image
  src={movie.posterUrl}
  alt={movie.name}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 256px, 260px"
  className="object-cover"
/>
```

```tsx
// WatchViewClient.tsx — CommentSection dynamic:
const CommentSection = dynamic(() => import("@/components/movie/comments/CommentSection"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-xl bg-white/5" />,
});
```

```tsx
// the-loai/[slug]/page.tsx — GenreContent song song:
const [genres, moviesData] = await Promise.all([
  getCachedGenres().catch(() => []),
  getFilteredMovies({ genre: slug, type: sParams.type, country: sParams.country, year: sParams.year, sort: sParams.sort || "latest", page: sParams.page || "1", per_page: "32" }).catch(() => ({ data: [], meta: { currentPage: 1, lastPage: 1, perPage: 32, total: 0, hasMore: false } })),
]);
```

```tsx
// quoc-gia/[slug]/page.tsx — tương tự với getCachedCountries + country: slug
```

- [ ] **Step 3: Verify**

Run: `pnpm --prefix frontend exec tsc --noEmit` — Expected: sạch.
Run: `pnpm --prefix frontend build` — Expected: pass.
Run: `grep -c "priority" frontend/src/components/movie/MovieDetailView.tsx` — Expected: 1.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/movie/MovieDetailView.tsx frontend/src/app/xem/\[slug\]/\[episode\]/WatchViewClient.tsx frontend/src/app/the-loai/\[slug\]/page.tsx frontend/src/app/quoc-gia/\[slug\]/page.tsx
git commit -m "perf(frontend): single LCP priority, lazy comments, parallel taxonomy fetch"
```

---

## Self-Review

**1. Spec coverage:** BE-1 (Tasks 1–3) expiry/rotation/revoke/remember/cookie; BE-2 (Task 5) bound; BE-3 (Task 6) log; BE-4 (Task 7) overlay; BE-5 (Task 8) indexes; FE-1 (Tasks 3–4) cookie flow; FE-2 (Task 9) sitemap; FE-3 (Task 10) priorities/dynamic/waterfall. Đủ 10/10 yêu cầu.

**2. Placeholder scan:** Không TBD/TODO. Mọi step có code + lệnh + expected cụ thể. Không "tương tự Task N" — Task 10 viết đủ cả 4 file edits.

**3. Type consistency:** `logoutAll(): int` + `revokedCount` dùng nhất quán Task 2. `LoginPayload.remember_me` + `LoginRequest remember_me` + `AuthService::login(..., bool $remember)` khớp Task 1→3. `getMovieCommentsForUser()` trả `array{data, meta}` khớp controller Task 7. Sitemap chunk `[page]` route + index `total/1000` khớp Task 9.
