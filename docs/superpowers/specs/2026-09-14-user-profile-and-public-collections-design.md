# Thiết kế Kỹ thuật: Trang Cá nhân & Bộ sưu tập Phim công khai

- **Ngày tạo**: 2026-09-14
- **Trạng thái**: Approved by User
- **Phạm vi**: Full-stack (Laravel 13 API + Next.js 16 App Router)

---

## 1. Mục tiêu & Tổng quan nghiệp vụ

Cung cấp tính năng hồ sơ người dùng và bộ sưu tập phim (Movie Collections / Playlists):
1. Mỗi người dùng có thể quản lý thông tin tài khoản cá nhân (tên, avatar, mật khẩu).
2. Người dùng có thể tạo nhiều bộ sưu tập phim theo chủ đề riêng (ví dụ: "Phim Anime bất hủ", "Phim hành động cuối tuần").
3. Người dùng có thể tìm kiếm và thêm phim vào bộ sưu tập ngay trong trang quản lý cá nhân.
4. Mỗi bộ sưu tập có thể bật chế độ **Công khai (Public)** hoặc **Riêng tư (Private)**.
5. Người khác có thể truy cập trang hồ sơ công khai của người dùng (`/u/[id]`) và xem chi tiết từng bộ sưu tập công khai (`/bo-suu-tap/[slug]`).

---

## 2. Kiến trúc Cơ sở dữ liệu (Database Schema)

### 2.1 Bảng `collections`
Migration hiện tại: `database/migrations/2026_08_11_000012_create_collections_and_collection_movie_tables.php`.
Bổ sung migration thêm trường `is_public`:

```php
Schema::table('collections', function (Blueprint $table) {
    $table->boolean('is_public')->default(true)->after('thumb_url');
    $table->index(['created_by', 'is_public'], 'collections_user_public_idx');
    $table->index(['is_public', 'is_active', 'created_at'], 'collections_public_feed_idx');
});
```

**Các trường chính của `collections`:**
- `id`: Bigint unsigned (PK)
- `name`: String(255) — Tên bộ sưu tập
- `slug`: String(255) unique — Dùng cho routing SEO
- `description`: Text nullable — Mô tả ngắn
- `thumb_url`: String(1000) nullable — Ảnh bìa (tự động lấy poster của phim đầu tiên nếu để trống)
- `is_public`: Boolean default(true) — Trạng thái công khai
- `is_active`: Boolean default(true)
- `sort_order`: UnsignedInteger default(0)
- `created_by`: ForeignId references `users(id)` cascade on delete
- `timestamps`

### 2.2 Bảng pivot `collection_movie`
- `collection_id`: ForeignId references `collections(id)` cascade on delete
- `movie_id`: ForeignId references `movies(id)` cascade on delete
- `sort_order`: UnsignedInteger default(0)
- Primary Key: `['collection_id', 'movie_id']`

### 2.3 Model Eloquent
- **`App\Models\User`**:
  - `collections()`: `HasMany` to `Collection::class`, foreign key `created_by`.
- **`App\Models\Collection`**:
  - `creator()`: `BelongsTo` to `User::class`, foreign key `created_by`.
  - `movies()`: `BelongsToMany` to `Movie::class`, pivot table `collection_movie`, with timestamps/sort_order.
  - Scope `scopePublic(Builder $query)`: lọc `is_public = true` và `is_active = true`.

---

## 3. Kiến trúc Backend API (Laravel 13)

### 3.1 Nhóm API Cá nhân (Yêu cầu `auth:sanctum`)

Tạo `App\Http\Controllers\Api\V1\UserProfileController`:
- `GET /api/v1/user/profile`:
  - Trả về thông tin user (`id`, `name`, `email`, `avatar_url`, `subscription_type`, `created_at`) kèm thống kê `collections_count`, `bookmarks_count`.
- `PUT /api/v1/user/profile`:
  - Cập nhật `name`, `avatar_url`.
  - Đổi mật khẩu nếu gửi kèm `current_password` và `password`.

Tạo `App\Http\Controllers\Api\V1\UserCollectionController`:
- `GET /api/v1/user/collections`:
  - Danh sách bộ sưu tập của user đăng nhập kèm `movies_count` và danh sách tóm tắt phim bên trong.
- `POST /api/v1/user/collections`:
  - Tạo mới bộ sưu tập. Validate: `name` (required, max 100), `description` (nullable, max 500), `is_public` (boolean). Tự động tạo slug duy nhất (kèm random hash ngắn nếu trùng slug).
- `GET /api/v1/user/collections/{id}`:
  - Chi tiết bộ sưu tập của user kèm toàn bộ phim bên trong (xác thực quyền sở hữu `created_by === auth()->id()`).
- `PUT /api/v1/user/collections/{id}`:
  - Cập nhật `name`, `description`, `is_public`.
- `DELETE /api/v1/user/collections/{id}`:
  - Xóa bộ sưu tập.
- `POST /api/v1/user/collections/{id}/movies`:
  - Thêm phim vào bộ sưu tập. Validate: `movie_id` (exists:movies,id). Tránh trùng lặp (`syncWithoutDetaching`). Tự động cập nhật `thumb_url` cho bộ sưu tập nếu chưa có.
- `DELETE /api/v1/user/collections/{id}/movies/{movieId}`:
  - Gỡ phim ra khỏi bộ sưu tập (`detach`).

### 3.2 Nhóm API Công khai (Public, Không cần Auth, HTTP Cache ETag)

Tạo `App\Http\Controllers\Api\V1\PublicProfileController`:
- `GET /api/v1/users/{id}`:
  - Thông tin công khai user: `id`, `name`, `avatar_url`, `created_at`, `subscription_type`.
  - Danh sách các bộ sưu tập công khai (`is_public = true`, `is_active = true`) kèm số lượng phim và ảnh thumbnail.

Tạo `App\Http\Controllers\Api\V1\PublicCollectionController`:
- `GET /api/v1/collections/{slug}`:
  - Chi tiết bộ sưu tập công khai: `id`, `name`, `slug`, `description`, `thumb_url`, `created_at`.
  - Thông tin tác giả (`creator`: `id`, `name`, `avatar_url`).
  - Danh sách phim `movies`: Trả về mảng `MovieSummaryResource` (có đủ poster, tên, điểm số, chất lượng, phục vụ hiển thị `MovieCard`).

---

## 4. Kiến trúc Giao diện Frontend (Next.js 16 App Router)

### 4.1 Route `/tai-khoan` — Trung tâm Cá nhân (Protected Route)
- Sử dụng `useAuth()`: Nếu chưa đăng nhập, hiển thị Skeleton và chuyển hướng sang `/dang-nhap`.
- Cấu trúc 2 Tab rõ ràng:
  1. **Tab Thông tin tài khoản**:
     - Form sửa Tên hiển thị.
     - Bộ chọn nhanh Avatar (các avatar hoạt hình/chủ đề phim được định dạng sẵn) hoặc nhập link ảnh avatar tùy chọn.
     - Form đổi mật khẩu bảo mật (mật khẩu hiện tại, mật khẩu mới, xác nhận).
  2. **Tab Bộ sưu tập của tôi**:
     - Nút "Tạo bộ sưu tập mới" -> Modal form (Tên, Mô tả, Switch toggle Công khai).
     - Danh sách các Card bộ sưu tập của user:
       - Badge trạng thái `Công khai` (màu xanh lá) / `Riêng tư` (màu xám).
       - Số lượng phim, nút "Xem/Sửa", nút "Xóa".
     - Khi chọn một bộ sưu tập:
       - Xem danh sách phim dạng lưới.
       - Nút **"Thêm phim"** -> Mở modal có ô tìm kiếm tích hợp `searchLiveSuggestions` (debounce 250ms). Khi người dùng gõ từ khóa, gợi ý phim hiện ra, bấm vào là phim được thêm ngay vào bộ sưu tập.
       - Mỗi thẻ phim trong danh sách quản lý có nút thùng rác nhỏ để gỡ phim khỏi bộ sưu tập.
       - Nút copy link chia sẻ nếu bộ sưu tập là công khai (`/bo-suu-tap/[slug]`).

### 4.2 Route `/u/[id]` — Hồ sơ người dùng công khai (Public)
- Layout phong cách trang cá nhân hiện đại, tối giản:
  - Header: Avatar tròn viền sáng, Tên người dùng, Badge VIP (nếu có), Ngày tham gia ("Thành viên từ tháng X/202X").
  - Thống kê: Số bộ sưu tập công khai đã chia sẻ.
- Body: Lưới danh sách các bộ sưu tập công khai. Mỗi thẻ hiển thị thumbnail, tên bộ sưu tập, mô tả ngắn, số lượng phim, link sang `/bo-suu-tap/[slug]`.

### 4.3 Route `/bo-suu-tap/[slug]` — Chi tiết Bộ sưu tập công khai (Public SEO)
- Server Component hỗ trợ `generateMetadata`: tiêu đề SEO, OpenGraph image, Twitter card.
- Header bộ sưu tập:
  - Tên bộ sưu tập nổi bật, mô tả chi tiết.
  - Thông tin người tạo: Tác giả, link bấm về trang `/u/[id]` của họ.
  - Nút "Chia sẻ": Hỗ trợ Web Share API hoặc copy link nhanh vào clipboard kèm toast thông báo.
- Body: Danh sách phim hiển thị bằng component `MovieCard.tsx` (có đầy đủ thumbnail, năm, rating, bấm vào xem ngay hoặc xem chi tiết).

### 4.4 Tích hợp Điều hướng
- Cập nhật `frontend/src/components/layout/UserMenu.tsx`: Thêm mục "Hồ sơ & Bộ sưu tập" trỏ vào `/tai-khoan`.

---

## 5. Kế hoạch Kiểm thử (Testing)
1. **Backend Tests (PHPUnit)**:
   - `UserProfileTest`: Cập nhật thông tin profile, đổi mật khẩu thành công và thất bại.
   - `UserCollectionTest`: Tạo bộ sưu tập, sửa, xóa, thêm phim, xóa phim, kiểm tra quyền sở hữu (không thể sửa/xóa collection của user khác).
   - `PublicCollectionTest`: Khách xem profile người dùng (chỉ thấy public collection), xem bộ sưu tập công khai (không xem được private collection).
2. **Frontend Typecheck & Verification**:
   - `pnpm exec tsc --noEmit` đạt 0 lỗi type.
   - Kiểm tra tương tác tạo bộ sưu tập, tìm kiếm thêm phim, đổi chế độ công khai, và xem trang public.
