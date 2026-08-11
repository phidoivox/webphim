# WebPhim — Thiết kế giao diện phía người xem

- **Ngày**: 2026-08-11
- **Trạng thái**: Đã duyệt bởi người dùng
- **Phạm vi**: Toàn bộ giao diện phía người xem (viewer-facing) — không gồm admin panel

## Bối cảnh

WebPhim là web phim tiếng Việt với kiến trúc hai app trong một repo:

- **Laravel 13 backend** (root, PHP 8.3, MySQL): schema Eloquent đầy đủ — `Movie` (tự tham chiếu `parent_id` cho phim bộ/phần; `SoftDeletes`; fulltext search MySQL trên name/origin_name), `Genre`, `Country`, `Tag`, `Person` (pivot `movie_person` với `role` actor/director), `Episode` → `EpisodeServer`, `Comment` (+ likes), `Rating`, `Bookmark`, `WatchHistory`, `Collection` (pivot `collection_movie`), `EpisodeReport`, `MovieViewLog`, `AuditLog`, `User` (mở rộng: `role`, `subscription_type`, `subscription_expires_at`, `avatar_url`, `is_active`). Hiện mới chỉ có endpoint `GET /api/status`.
- **Next.js 16 frontend** (`frontend/`, React 19, TypeScript, Tailwind 4, App Router, pnpm): hiện chỉ là trang test kết nối backend. Lưu ý: Next 16.3 có breaking changes so với training data — đọc `frontend/node_modules/next/dist/docs/` trước khi viết code (xem `frontend/AGENTS.md`).

## Yêu cầu đã chốt với người dùng

| Quyết định | Lựa chọn |
|---|---|
| Phạm vi | Toàn bộ phía người xem: Home, chi tiết phim, trang xem, danh mục, tìm kiếm, hồ sơ, trang VIP |
| Đối tượng | Người trẻ tuổi — hiện đại, đẹp mắt, dễ dùng, nhiều hiệu ứng, **không được mang vẻ "AI"** |
| Phong cách | Dark ấm (zinc) + accent cam `#FF5C1A`, không khí "cinema" |
| Nền tảng | Cân bằng cả hai: mobile có bottom tab bar, desktop có nav riêng |
| Mô hình VIP | Free = có quảng cáo; VIP = không quảng cáo + huy hiệu VIP |
| Mô hình duyệt | **Carousel-heavy** (kiểu Netflix): hero banner + hàng phim ngang cuộn |

## 1. Hệ thống thiết kế (Design System)

### Bảng màu — "Dark ấm" với accent cam

| Vai trò | Mã màu |
|---|---|
| Nền chính (tầng dưới) | `#0E0E10` — gần đen ấm |
| Surface (header, card đệm) | `#17171A` |
| Elevated (dropdown, modal, player) | `#1F1F23` |
| Text chính / phụ / mờ | `#F4F4F5` / `#A1A1AA` / `#71717A` |
| Accent cam | `#FF5C1A` — hover `#FF7A3D`, đậm `#E04A0F` |
| Trạng thái | success/error/warning phiên bản nhạt, hòa tông |

Cam chỉ dùng **có chủ đích**: nút hành động chính, nút ▶, badge VIP, glow khi hover. Không phun màu khắp trang.

### Typography

- Display/tiêu đề: **Space Grotesk** (hình học, hiện đại, có cá tính — không dùng Inter cho display, tránh vẻ "AI")
- Body/UI: system sans
- Scale rõ ràng: hero tiêu đề rất đậm (700–800), tiêu đề section to đậm, tên phim trên card cỡ vừa. Chữ là "phông nền" của poster — không trang trí rườm rà.

### Ngôn ngữ hiệu ứng — "điện ảnh, có chủ đích"

- Hover card phim: poster `scale(1.05)`, glow cam mờ phía dưới, overlay hiện nút ▶ + thông tin nhanh (năm, số tập, HD)
- Carousel snap-scroll mượt: mobile vuốt / desktop kéo + nút mũi tên
- Chuyển trang nhẹ fade/slide 150–250ms; skeleton shimmer khi tải
- Hero banner: gradient fade xuống nền, chữ hiện stagger
- Header desktop đổi nền mờ khi cuộn
- Tab bar mobile: tab đang chọn tô cam + chuyển động nhẹ

### Quy tắc "không AI"

- Cấm gradient tím/indigo
- Cấm glassmorphism (blur + border trắng mờ)
- Cấm emoji trong UI
- Bo góc 8–12px vừa phải
- Hiệu ứng nhấn bằng scale + glow, không dùng "card bồng bềnh"

## 2. Bố cục & Điều hướng

### Desktop (≥1024px)

- **Header sticky** (surface `#17171A`, 56–64px): logo ▶ PHIM HAY (icon play cam + Space Grotesk đậm) · nav: Trang chủ, Thể loại (dropdown), Quốc gia, Phim bộ, Phim lẻ, Sắp chiếu · phải: icon tìm kiếm (mở overlay), nút **Nâng cấp VIP** viền cam (ẩn khi đã VIP → thay bằng huy hiệu), avatar menu (Hồ sơ, Bookmark, Lịch sử, Đăng xuất)
- **Footer**: logo + mô tả ngắn, link thể loại phổ biến, chính sách, DMCA/liên hệ

### Mobile (<1024px)

- Header gọn: logo + search icon + avatar
- **Bottom tab bar cố định** 5 tab (icon + nhãn): **Trang chủ · Thể loại · Tìm kiếm · Thư viện** (Bookmark + Lịch sử + Bộ sưu tập) · **Cá nhân** (hồ sơ, VIP, đăng xuất). Tab Tìm kiếm mở SearchOverlay; tab Thể loại mở trang danh mục thể loại.
- Nội dung chừa padding dưới để không bị tab bar che

### Shell chung

Mọi trang dùng cùng shell (header + footer / tab bar) — nhất quán, dễ bảo trì.

## 3. Cấu trúc từng trang

### 3.1 Trang chủ (carousel-heavy)

- **Hero banner**: 1 phim nổi bật — poster nền + gradient fade, tên phim + thông tin (năm, thể loại, chất lượng), nút **XEM NGAY** (cam) + **Xem trailer**. Chấm tròn chuyển banner, auto-rotate 6–8s, tắt khi hover
- **Hàng carousel**: Phim mới · Đang hot · Phim bộ mới · Theo thể loại (3–4 hàng, 10–15 phim/hàng, snap-scroll + mũi tên desktop)
- **Slot quảng cáo** (chỉ user free) giữa các hàng — placeholder 728×90 / 300×250

### 3.2 Trang chi tiết phim (`/phim/:slug`)

- Hero: poster lớn + thông tin + điểm IMDb/TMDb + nút **XEM PHIM** (cam, hiện số tập) + Bookmark + đánh giá sao
- **Chọn tập**: lưới tập — tập đã xem có tick, tập đang xem highlight cam
- Diễn viên/đạo diễn (avatar scroll ngang) · Mô tả (mở rộng nếu dài)
- **Phim tương tự** (carousel) · **Bình luận + đánh giá** (đăng nhập mới viết được)

### 3.3 Trang xem phim (`/xem/:slug/tap-1`)

- Nền tối tuyệt đối; UI tự ẩn sau vài giây phát
- **Player shell**: player + chọn server (nhiều `EpisodeServer`) + chuyển tập nhanh + bookmark/like/report lỗi
- Desktop: danh sách tập cột phải; Mobile: tab "Tập" dưới player
- Free: ad pre-roll (countdown 5s) + banner nhỏ dưới player; VIP: sạch + huy hiệu cạnh player
- Nhắc "Tiếp tục xem từ phút X" nếu có lịch sử xem

### 3.4 Trang danh mục / thể loại (`/the-loai/:slug`, `/quoc-gia/:slug`, `/phim-bo`…)

- Tiêu đề + **filter chips**: Năm, Quốc gia, Chất lượng, Sắp xếp (Mới nhất / Xem nhiều / Đánh giá cao)
- Grid phim đáp ứng (2 cột mobile → 5–6 cột desktop) + nút **Xem thêm** (load more)

### 3.5 Tìm kiếm

- Overlay toàn màn hình, focus ngay, gõ tức thì (debounce 300ms), kết quả nổi bật + **từ khóa hot** (tag chips cam)

### 3.6 Hồ sơ cá nhân (`/ho-so`)

- Avatar + tên + **huy hiệu VIP** (cam) + nút nâng cấp
- Tabs: **Bookmark · Lịch sử xem** (hiện "đang xem tập X, phút Y", nút xóa) · **Bộ sưu tập** · **Đánh giá của tôi**

### 3.7 Trang nâng cấp VIP

- 3 gói: Tháng / Quý / Năm (ghi "tiết kiệm X%")
- Lợi ích: không quảng cáo, HD, huy hiệu VIP
- Nút thanh toán (cổng thanh toán triển khai sau — UI có sẵn)

## 4. Thành phần chung (components)

`MovieCard` (poster + hover overlay + badge HD/Mới) · `CarouselRow` · `HeroBanner` · `PlayerShell` (player + chọn server + chuyển tập) · `EpisodeGrid` · `FilterChips` · `AdSlot` (placeholder, chỉ render user free) · `VipBadge` · `RatingStars` · `CommentItem`/`CommentComposer` · `SkeletonCard` · `TabBar` (mobile) · `SearchOverlay` · `Toast` (feedback nhanh: "Đã lưu bookmark").

## 5. Luồng dữ liệu

- Frontend fetch từ **Laravel API** (`/api/v1/...`): `GET /home` (hero + carousel), `GET /movies` (filters), `GET /movies/{slug}` (chi tiết + tập + credits), `GET /search?q`, `POST /movies/{id}/rate`, comments, bookmarks, watch-history, collections. Xác thực **Sanctum**.
- Backend mới có `/api/status` → các endpoint chưa tồn tại, xây dựng song song với frontend (chi tiết ở kế hoạch triển khai).
- **Giai đoạn UI trước**: dùng mock data local (fixtures JSON) cùng shape với API thật để không chặn tiến độ frontend.

## 6. Thứ tự triển khai

1. **Phase 1**: Design tokens (theme Tailwind 4) + shell (header/footer/tab bar) + Trang chủ (hero + carousels) — mock data
2. **Phase 2**: Chi tiết phim + trang xem phim (player shell, chọn tập/server) — bắt đầu API Laravel song song
3. **Phase 3**: Danh mục/thể loại + tìm kiếm
4. **Phase 4**: Hồ sơ + trang VIP + tích hợp bình luận/bookmark/lịch sử
