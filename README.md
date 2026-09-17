# 🎬 WebPhim - Nền tảng xem phim trực tuyến hiện đại Full-Stack

WebPhim là hệ thống website xem phim trực tuyến mã nguồn mở được phát triển trên kiến trúc hiện đại, hiệu năng cao kết hợp giữa **Next.js 16 (App Router)** ở frontend và **Laravel 12 (RESTful API & Realtime)** ở backend.

---

## ⚡ Công nghệ sử dụng (Tech Stack)

### 🎨 Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Components & Client Components)
- **UI Library:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Streaming Player:** [HLS.js](https://github.com/video-dev/hls.js/) hỗ trợ phát video m3u8 chất lượng cao, đa luồng, chọn server/tập phim, phím tắt điều khiển.
- **Biểu tượng & Giao diện:** [Lucide React](https://lucide.dev/), thiết kế Dark mode hiện đại, Responsive đa nền tảng (Mobile, Tablet, Desktop).
- **SEO & Performance:** Tự động sinh Dynamic OpenGraph Image (`next/og`), VideoObject JSON-LD, Sitemap Index phân trang chunks, On-demand Incremental Static Regeneration (ISR).

### ⚙️ Backend
- **Framework:** [Laravel 12](https://laravel.com/) (PHP 8.2+)
- **Xác thực:** [Laravel Sanctum](https://laravel.com/docs/sanctum) (Hỗ trợ cả HttpOnly Cookie & Bearer Token).
- **Thời gian thực (Realtime):** [Laravel Reverb](https://reverb.laravel.com/) (WebSocket server tích hợp native tốc độ cao).
- **Cơ sở dữ liệu:** MySQL 8.0+ / SQLite (Hỗ trợ Full-text Search, Partitioning cho bảng logs lượt xem).
- **Bộ nhớ đệm & Hàng đợi:** Redis (Cache Swr/Flexible, Session, Queue worker).

### 🚢 DevOps & Deployment
- **Docker & Docker Compose:** Cấu hình multi-stage build siêu nhẹ cho cả Backend PHP-FPM, Queue Worker, Reverb WebSocket, Frontend Next.js Standalone và Nginx reverse proxy.

---

## 🌟 Tính năng nổi bật

- 🎥 **Trình phát video chuyên nghiệp:** Hỗ trợ m3u8 HLS, tua nhanh, chỉnh âm lượng, tốc độ phát, chế độ rạp chiếu, tự động lưu lịch sử và thời gian đang xem.
- 💬 **Bình luận thời gian thực:** Bình luận và nhận phản hồi trực tiếp không cần tải lại trang nhờ Laravel Reverb WebSocket.
- ⭐ **Bộ sưu tập & Đánh dấu:** Quản lý danh sách phim yêu thích (Bookmark), tạo bộ sưu tập phim cá nhân hoặc chia sẻ công khai cho cộng đồng qua link rút gọn.
- 🔍 **Tìm kiếm & Lọc nâng cao:** Tìm kiếm nhanh theo từ khóa, lọc đa điều kiện (thể loại, quốc gia, năm phát hành, sắp xếp theo lượt xem, điểm đánh giá).
- 🛡️ **Bảng điều khiển quản trị (Admin Dashboard):**
  - Quản lý phim, danh sách tập phim, danh mục thể loại, quốc gia.
  - Quản lý báo cáo lỗi từ người xem (Report episode).
  - Quản lý và phân quyền người dùng (User, Moderator, Admin).
  - Gửi thông báo hệ thống hàng loạt qua WebSocket.

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

Bạn có thể lựa chọn 1 trong 2 cách cài đặt dưới đây:

---

### Cách 1: Triển khai nhanh với Docker (Khuyên dùng ⭐)

Phương pháp nhanh nhất, tự động thiết lập đầy đủ Backend, Frontend, Nginx, MySQL, Redis, Reverb và Queue Worker mà không cần cài môi trường PHP/Node trên máy.

#### 1. Clone repository
```bash
git clone https://github.com/phidoivox/webphim.git
cd webphim
```

#### 2. Cấu hình file môi trường Docker
```bash
# Copy file cấu hình mẫu
cp .env.docker.example .env.docker
```

Mở file `.env.docker` và điền các thông tin quan trọng:
```dotenv
# Sinh APP_KEY ngẫu nhiên (hoặc chạy: echo "base64:$(openssl rand -base64 32)")
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=

# Mật khẩu database
DB_PASSWORD=your_secure_password

# Khóa kết nối Reverb WebSocket
REVERB_APP_ID=123456
REVERB_APP_KEY=your-reverb-app-key
REVERB_APP_SECRET=your-reverb-app-secret

# Secret key cho Next.js revalidation
REVALIDATION_SECRET=random_secret_string_here
```

#### 3. Khởi chạy với Docker Compose
```bash
# Build và chạy các container ở chế độ nền
docker compose build
docker compose up -d

# Xem log khởi động backend
docker compose logs -f backend
```

> **Lưu ý:** Lần chạy đầu tiên sẽ mất khoảng 2 - 5 phút để tải Docker image và tự động chạy migration.

#### 4. Khởi tạo dữ liệu mẫu (Seed) & Tài khoản Admin
```bash
# Seed thể loại và quốc gia mẫu
docker compose exec backend php artisan db:seed

# (Tùy chọn) Seed phim mẫu để test giao diện
docker compose exec backend php artisan db:seed --class=MovieTestSeeder

# Tạo tài khoản Admin
docker compose exec backend php artisan tinker --execute="App\Models\User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('password123'), 'role' => 'admin', 'is_active' => true]);"
```

#### 5. Truy cập ứng dụng
- **Giao diện người dùng (Frontend):** [http://localhost](http://localhost)
- **API Backend:** [http://localhost/api](http://localhost/api)
- **Đăng nhập quản trị:** Truy cập `http://localhost` đăng nhập với tài khoản `admin@example.com` / `password123`, sau đó vào `/admin`.

> 💡 *Xem chi tiết các lệnh quản lý container, backup database, cấu hình HTTPS trong file [DOCKER.md](DOCKER.md).*

---

### Cách 2: Cài đặt thủ công (Local / Laragon / XAMPP)

Phù hợp cho quá trình phát triển (development) trực tiếp trên máy cục bộ.

#### Yêu cầu môi trường:
- **PHP** ≥ 8.2 (Cần bật extensions: `pdo_mysql` hoặc `pdo_sqlite`, `redis`, `mbstring`, `curl`, `bcmath`, `fileinfo`, `gd`)
- **Composer** ≥ 2.x
- **Node.js** ≥ 20.x và **pnpm** (hoặc npm)
- **MySQL** ≥ 8.0 (hoặc SQLite)
- **Redis Server** (khuyến nghị cho cache & session)

---

#### 1. Cài đặt Backend (Laravel)

```bash
# 1. Di chuyển vào thư mục gốc dự án
cd webphim

# 2. Cài đặt các gói phụ thuộc PHP
composer install

# 3. Tạo file cấu hình môi trường
cp .env.example .env

# 4. Tạo khóa ứng dụng
php artisan key:generate

# 5. Tạo liên kết lưu trữ công khai
php artisan storage:link
```

Mở file `.env` và thiết lập kết nối cơ sở dữ liệu và cấu hình cần thiết:
```dotenv
APP_NAME="WebPhim"
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Cơ sở dữ liệu (Ví dụ MySQL trên Laragon)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=webphim
DB_USERNAME=root
DB_PASSWORD=

# Cấu hình Cache & Queue
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Reverb WebSocket
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=100001
REVERB_APP_KEY=webphim-key
REVERB_APP_SECRET=webphim-secret
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http

# Next.js Revalidation Secret
REVALIDATION_SECRET=my_revalidation_secret_key
```

Chạy migration và seed dữ liệu:
```bash
# Chạy migration và nạp thể loại, quốc gia
php artisan migrate --seed

# (Tùy chọn) Nạp dữ liệu phim mẫu
php artisan db:seed --class=MovieTestSeeder

# Tạo tài khoản Admin
php artisan tinker --execute="App\Models\User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('password123'), 'role' => 'admin', 'is_active' => true]);"
```

Khởi chạy các dịch vụ Backend (Mở các tab terminal riêng):
```bash
# Terminal 1: Chạy API server
php artisan serve --port=8000

# Terminal 2: Chạy Queue worker (xử lý gửi thông báo, đếm view)
php artisan queue:work

# Terminal 3: Chạy WebSocket Server (cho tính năng realtime comment/thông báo)
php artisan reverb:start --port=8080
```

---

#### 2. Cài đặt Frontend (Next.js)

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói phụ thuộc
pnpm install
# (hoặc: npm install)

# 3. Tạo file môi trường cho frontend
```

Tạo file `frontend/.env.local` với nội dung sau:
```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Kết nối WebSocket Reverb
NEXT_PUBLIC_REVERB_APP_KEY=webphim-key
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http

# Khóa xác thực On-demand Revalidation (khớp với REVALIDATION_SECRET ở backend)
REVALIDATION_SECRET=my_revalidation_secret_key
```

Khởi chạy máy chủ phát triển Frontend:
```bash
pnpm dev
# (hoặc: npm run dev)
```

Truy cập trang web tại: **[http://localhost:3000](http://localhost:3000)**.

---

## 📁 Cấu trúc thư mục dự án

```
webphim/
├── app/                        # Mã nguồn backend Laravel
│   ├── Enums/                  # Enums định danh kiểu phim, quyền người dùng
│   ├── Http/Controllers/Api/  # RESTful API Controllers (V1 & Admin)
│   ├── Http/Requests/          # Form Request Validation
│   ├── Http/Resources/Api/     # Eloquent API Resources chuyển đổi JSON
│   ├── Jobs/                   # Asynchronous Queue Jobs
│   ├── Models/                 # Eloquent Data Models
│   ├── Observers/              # Model Event Observers (Cache Invalidation, Auto Notify)
│   └── Services/               # Business Logic Layer
├── bootstrap/                  # Khởi động ứng dụng Laravel 12
├── config/                     # Cấu hình framework và dịch vụ
├── database/
│   ├── migrations/             # Database Schema Migrations
│   └── seeders/                # Seeders cho dữ liệu khởi tạo
├── docker/                     # Nginx config & Entrypoint scripts cho Docker
├── docs/                       # Tài liệu đặc tả hệ thống và kế hoạch nâng cấp
├── frontend/                   # Ứng dụng Next.js 16 (App Router)
│   ├── public/                 # Static assets (icons, logo, robots.txt)
│   └── src/
│       ├── app/                # Next.js App Router (trang chủ, phim, xem phim, admin...)
│       ├── components/         # React UI Components (Player, Layout, Skeletons...)
│       ├── context/            # React Contexts (Auth, Bookmark, Notification)
│       ├── hooks/              # Custom React Hooks
│       ├── lib/                # Thư viện tiện ích (api client, echo, auth)
│       └── types/              # TypeScript Types & Interfaces
├── routes/
│   ├── api.php                 # Tuyến đường API v1 và Admin
│   └── console.php             # Lệnh Artisan tùy biến
├── compose.yaml                # Docker Compose 6 services
├── Dockerfile.backend          # Dockerfile cho PHP-FPM Laravel
├── DOCKER.md                   # Hướng dẫn chuyên sâu về triển khai Docker
└── README.md                   # Hướng dẫn tổng quan và cài đặt
```

---

## 🧪 Kiểm thử (Testing) & Kiểm tra mã nguồn (Linting)

```bash
# Chạy toàn bộ test case backend (PHPUnit)
php artisan test

# Kiểm tra định dạng chuẩn Laravel Pint
./vendor/bin/pint --test

# Kiểm tra lỗi TypeScript & ESLint ở Frontend
cd frontend
pnpm lint
pnpm type-check
```

---

## 📄 Bản quyền (License)

Dự án được phát hành theo giấy phép [MIT License](LICENSE).

