# Kế Hoạch Áp Dụng Toàn Diện Công Nghệ Mới Nhất Cho Dự Án WebPhim

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiện đại hóa toàn bộ hệ thống WebPhim bằng việc áp dụng các công nghệ và tính năng mới nhất từ Laravel 11/12/13, Next.js 16, React 19 và Tailwind CSS v4; loại bỏ các mẫu code cũ, blocking, cache lỗi thời và thay thế bằng kiến trúc tối ưu hiệu năng cao.

**Architecture:** 
- Backend: Chuyển đổi tầng Caching sang Stale-While-Revalidate (`Cache::flexible`), tách các tác vụ phụ (view logs, notifications, broadcasting) ra sau response bằng `defer()`, tích hợp `Context` facade để truy vết logs xuyên suốt, và hỗ trợ Webhook Revalidation.
- Frontend: Tích hợp Dynamic Social OG Image (`next/og` `ImageResponse`), On-Demand Cache Invalidation (`revalidateTag`), tương tác 0ms với React 19 `useOptimistic`, và component responsive theo `@container` của Tailwind CSS v4.

**Tech Stack:** Laravel 13, Next.js 16.3, React 19.2, Tailwind CSS v4, Redis, Reverb, TanStack Query v5.

---

## Task 1: Backend - Tối ưu Caching SWR với `Cache::flexible()` & Song song hóa Query

**Files:**
- Modify: `app/Services/HomeService.php`
- Modify: `app/Services/MovieService.php`
- Test: `tests/Feature/HomeApiTest.php`

**Interfaces:**
- `HomeService::getHomeData(): array`
- `MovieService::getMovieDetail(string $slug): Movie`

- [ ] **Step 1: Viết test kiểm tra tính đúng đắn của dữ liệu HomeService và MovieService khi cache hoạt động**
- [ ] **Step 2: Cập nhật `HomeService.php` sử dụng `Cache::flexible`**
Thay thế `Cache::tags(...)->remember(...)` bằng `Cache::flexible` với dual-TTL (300s fresh, 600s stale) giúp chống Cache Stampede khi lưu lượng truy cập lớn.
- [ ] **Step 3: Chạy lại test xác nhận PASS**
Run: `php artisan test`

---

## Task 2: Backend - Deferred Tasks (`defer()`) & Distributed Logging Context (`Context`)

**Files:**
- Create: `app/Http/Middleware/AttachRequestContext.php`
- Modify: `bootstrap/app.php`
- Modify: `app/Services/CommentService.php`
- Modify: `app/Http/Controllers/Api/V1/MovieController.php`

**Interfaces:**
- `Context::add('request_id', string)`
- `Context::add('client_ip', string)`
- `defer(callable $callback)`

- [ ] **Step 1: Tạo Middleware `AttachRequestContext`**
Gắn `request_id` (UUID) và `user_id` vào Laravel `Context` để mọi Log và Exception đều tự động mang theo ngữ cảnh phiên.
- [ ] **Step 2: Đăng ký Middleware trong `bootstrap/app.php`**
- [ ] **Step 3: Refactor `CommentService.php` và `MovieController.php`**
Bọc các lời gọi `$parent->user->notify()` và `broadcast()` cũng như ghi log lượt xem vào `defer(fn () => ...)` để giải phóng HTTP response ngay lập tức.
- [ ] **Step 4: Chạy test PHPUnit xác nhận hoạt động ổn định**
Run: `php artisan test`

---

## Task 3: Backend & Frontend - Cơ chế On-Demand Cache Invalidation (Webhook + `revalidateTag`)

**Files:**
- Modify: `app/Observers/MovieObserver.php`
- Create: `frontend/src/app/api/revalidate/route.ts`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Tạo Route Handler `/api/revalidate` trên Next.js**
Sử dụng `revalidateTag()` và `revalidatePath()` có xác thực bí mật `REVALIDATION_SECRET`.
- [ ] **Step 2: Cập nhật `MovieObserver.php`**
Khi phim hoặc tập phim được tạo/sửa/xóa, tự động gửi HTTP POST không đồng bộ (qua `defer()` hoặc HTTP client) đến Next.js để xóa cache tức thì.
- [ ] **Step 3: Cập nhật các hàm fetch trong `frontend/src/lib/api.ts`**
Thêm `next: { tags: ['home', `movie-${slug}`, 'categories'] }` vào các lệnh `fetch()`.

---

## Task 4: Frontend - Dynamic OpenGraph Image Generation với Next.js `ImageResponse` (`next/og`)

**Files:**
- Create: `frontend/src/app/phim/[slug]/opengraph-image.tsx`
- Create: `frontend/src/app/opengraph-image.tsx`
- Modify: `frontend/src/app/phim/[slug]/page.tsx`

- [ ] **Step 1: Tạo file `frontend/src/app/phim/[slug]/opengraph-image.tsx`**
Sử dụng `ImageResponse` từ `next/og` để render banner ảnh 1200x630px chứa Poster phim, Tên phim, Thể loại, Điểm đánh giá và Logo WebPhim.
- [ ] **Step 2: Tạo file `frontend/src/app/opengraph-image.tsx` cho trang chủ**
- [ ] **Step 3: Kiểm tra route metadata và build Next.js**
Run: `pnpm --prefix frontend build`

---

## Task 5: Frontend - Tương tác 0ms với React 19 `useOptimistic`

**Files:**
- Modify: `frontend/src/components/movie/MovieCard.tsx`
- Modify: `frontend/src/components/movie/MovieDetailView.tsx`
- Modify: `frontend/src/components/movie/CommentItem.tsx`

- [ ] **Step 1: Cập nhật `MovieCard.tsx` và `MovieDetailView.tsx`**
Áp dụng React 19 `useOptimistic` và `useTransition` cho thao tác bấm Yêu thích / Xem sau trên Card phim.
- [ ] **Step 2: Cập nhật `CommentItem.tsx`**
Sử dụng `useOptimistic` cho tương tác Thích bình luận với cơ chế tự rollback nếu server trả lỗi.
- [ ] **Step 3: Kiểm tra tương tác trên UI và xác nhận không có lỗi console**

---

## Task 6: Frontend - CSS Container Queries (`@container`) với Tailwind CSS v4

**Files:**
- Modify: `frontend/src/components/movie/MovieCard.tsx`
- Modify: `frontend/src/components/home/CarouselRow.tsx`

- [ ] **Step 1: Cập nhật container context cho movie grid và carousels**
Đặt class `@container` lên wrapper của danh sách phim.
- [ ] **Step 2: Cập nhật `MovieCard.tsx` sử dụng `@container` breakpoints**
- [ ] **Step 3: Kiểm tra giao diện trên nhiều độ phân giải màn hình**

---

## Task 7: Tổng kiểm tra & Nghiệm thu toàn hệ thống

- [ ] **Step 1: Chạy toàn bộ backend test suite**
Run: `composer test`
- [ ] **Step 2: Chạy linter định dạng code PHP**
Run: `vendor/bin/pint`
- [ ] **Step 3: Chạy Next.js linter & production build**
Run: `pnpm --prefix frontend lint && pnpm --prefix frontend build`
- [ ] **Step 4: Kiểm tra kết nối API End-to-End giữa Frontend và Backend**
