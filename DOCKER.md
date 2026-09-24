# 🐳 Hướng dẫn Deploy WebPhim trên Docker

## Yêu cầu

- Docker Engine ≥ 24 + Docker Compose V2
- RAM ≥ 2 GB (MySQL + Redis + PHP-FPM + Next.js)
- Port 80 trống (hoặc đổi trong `compose.yaml`)

---

## Kiến trúc

```
                    ┌──────────┐
        :80         │  nginx   │
       ─────────────┤  proxy   │
                    └────┬─────┘
              ┌──────────┼──────────┬──────────────┐
              ▼          ▼          ▼              ▼
        ┌──────────┐ ┌────────┐ ┌────────┐  ┌──────────┐
        │ backend  │ │frontend│ │ reverb │  │  queue   │
        │ php-fpm  │ │Next.js │ │  WS    │  │ worker   │
        │  :9000   │ │ :3000  │ │ :8080  │  │          │
        └────┬─────┘ └────────┘ └───┬────┘  └────┬─────┘
             │                      │             │
        ┌────┴──────────────────────┴─────────────┘
        ▼                           ▼
   ┌──────────┐              ┌──────────┐
   │  mysql   │              │  redis   │
   │  :3306   │              │  :6379   │
   └──────────┘              └──────────┘
```

**6 service:**

| Service | Image | Vai trò |
|---------|-------|---------|
| `nginx` | nginx:alpine | Reverse proxy — route `/api` → fpm, `/app` → reverb WS, `/` → Next.js |
| `backend` | Dockerfile.backend | Laravel API (php-fpm), chạy migrate lúc boot |
| `queue` | Dockerfile.backend | Queue worker (`queue:work`) |
| `reverb` | Dockerfile.backend | Laravel Reverb WebSocket server |
| `frontend` | frontend/Dockerfile | Next.js standalone, SSR |
| `db` | mysql:8.4 | MySQL — fulltext search + partitioned view logs |
| `redis` | redis:7-alpine | Session, cache, queue broker |

---

## Bước 1 — Chuẩn bị environment

```bash
# Copy file env mẫu
cp .env.docker.example .env.docker
```

Mở `.env.docker` và điền các giá trị bắt buộc:

```dotenv
# 1. APP_KEY — sinh bằng lệnh:
#    php artisan key:generate --show
#    hoặc: echo "base64:$(openssl rand -base64 32)"
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=

# 2. Database password (đổi khác "secret")
DB_PASSWORD=mat_khau_manh_cua_ban

# 3. Reverb credentials (sinh mới, KHÔNG dùng key cũ trong .env.example)
REVERB_APP_ID=123456
REVERB_APP_KEY=your-new-reverb-key
REVERB_APP_SECRET=your-new-reverb-secret

# 4. Revalidation secret cho Next.js ISR
REVALIDATION_SECRET=mot_chuoi_ngau_nhien_dai
```

> ⚠️ **Bảo mật:** Các key `REVERB_APP_KEY`/`REVERB_APP_SECRET` và `REVALIDATION_SECRET` cũ đã nằm trong git history qua `.env.example`. Phải sinh key hoàn toàn mới, không tái sử dụng.

Cập nhật password DB root trong `compose.yaml` nếu cần (biến `DB_ROOT_PASSWORD`).

---

## Bước 2 — Build và chạy

```bash
# Build tất cả image
docker compose build

# Chạy nền
docker compose up -d

# Xem log khởi động (backend migrate, seed, v.v.)
docker compose logs -f backend
```

Lần đầu mất ~2–5 phút (tải image, composer install, pnpm install, build). Backend entrypoint tự động:

1. Chờ MySQL sẵn sàng
2. `php artisan migrate --force`
3. `php artisan storage:link`
4. Cache config / route / view
5. Khởi động php-fpm

---

## Bước 3 — Kiểm tra

```bash
# API health
curl http://localhost/api/status
# → {"status":"success","message":"Backend Laravel kết nối thành công..."}

# Laravel internal health
curl http://localhost/up
# → 200 OK

# Frontend
# Mở trình duyệt: http://localhost
```

Kiểm tra trạng thái service:

```bash
docker compose ps
# Tất cả phải hiện "healthy" hoặc "running"

docker compose logs frontend   # log Next.js
docker compose logs reverb     # log WebSocket
docker compose logs queue      # log queue worker
```

---

## Bước 4 — Seed dữ liệu (tuỳ chọn)

```bash
# Seed genres + countries cơ bản
docker compose exec backend php artisan db:seed

# Seed phim test (nếu cần)
docker compose exec backend php artisan db:seed --class=MovieTestSeeder
```

---

## Các lệnh thường dùng

### Quản lý container

```bash
docker compose up -d          # Khởi động
docker compose down            # Dừng (giữ data)
docker compose down -v         # Dừng + XOÁ data (DB, Redis, storage)
docker compose restart backend # Restart 1 service
docker compose logs -f --tail=50 backend  # Tail log
```

### Artisan trong container

```bash
docker compose exec backend php artisan migrate:status
docker compose exec backend php artisan tinker
docker compose exec backend php artisan queue:retry all
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear  # sau khi đổi .env.docker
```

### Rebuild sau khi sửa code

```bash
# Backend (sửa PHP / migration)
docker compose up -d --build backend queue reverb

# Frontend (sửa React / component)
docker compose up -d --build frontend

# Tất cả
docker compose up -d --build
```

### Database

```bash
# Truy cập MySQL CLI
docker compose exec db mysql -u webphim -p webphim

# Backup
docker compose exec db mysqldump -u root -p webphim > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db mysql -u root -p webphim < backup.sql
```

---

## Cấu hình domain / HTTPS (production)

### Đổi domain

Sửa trong `.env.docker`:

```dotenv
APP_URL=https://phimhay.vn
FRONTEND_URL=https://phimhay.vn
CORS_ALLOWED_ORIGINS=https://phimhay.vn
```

Rebuild frontend với domain mới (vì `NEXT_PUBLIC_*` bake lúc build):

```bash
# Sửa args trong compose.yaml hoặc dùng --build-arg
docker compose build frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://phimhay.vn/api \
  --build-arg NEXT_PUBLIC_REVERB_HOST=phimhay.vn \
  --build-arg NEXT_PUBLIC_REVERB_PORT=443 \
  --build-arg NEXT_PUBLIC_REVERB_SCHEME=https \
  --build-arg NEXT_PUBLIC_SITE_URL=https://phimhay.vn

docker compose up -d frontend
```

### HTTPS với Certbot

Thêm vào `compose.yaml`:

```yaml
services:
  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - certbot-etc:/etc/letsencrypt:ro
      - certbot-var:/var/lib/letsencrypt

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
    command: certonly --webroot --webroot-path=/var/lib/letsencrypt -d phimhay.vn --agree-tos -m admin@phimhay.vn

volumes:
  certbot-etc:
  certbot-var:
```

Sau đó cập nhật `docker/nginx.conf` thêm block `listen 443 ssl` + đường dẫn cert.

---

## Cấu trúc file Docker

```
webphim/
├── .dockerignore              # Loại trừ file không cần trong build context
├── .env.docker                # Env runtime (KHÔNG commit, chứa secret)
├── .env.docker.example        # Mẫu env (commit được, không secret)
├── Dockerfile.backend         # Multi-stage PHP 8.3 FPM
├── compose.yaml               # Docker Compose — 6 service
├── docker/
│   ├── backend-entrypoint.sh  # Wait-for-db → migrate → cache → fpm
│   └── nginx.conf             # Reverse proxy config
└── frontend/
    ├── .dockerignore           # Loại trừ node_modules, .next, .env
    └── Dockerfile             # Multi-stage Node 24 + pnpm standalone
```

---

## Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `backend` restart loop | MySQL chưa sẵn sàng hoặc APP_KEY trống | `docker compose logs backend` — kiểm tra `.env.docker` APP_KEY |
| `SQLSTATE[HY000] [2002]` | DB chưa healthy | `docker compose ps db` — chờ healthy, kiểm tra DB_HOST=db |
| Frontend trắng | `NEXT_PUBLIC_API_URL` sai | Rebuild frontend với đúng URL |
| CORS error trên browser | `CORS_ALLOWED_ORIGINS` thiếu domain | Thêm domain vào `.env.docker`, restart backend |
| WebSocket không kết nối | Reverb chưa chạy hoặc port sai | `docker compose logs reverb`, kiểm tra `NEXT_PUBLIC_REVERB_*` |
| Permission denied storage | Volume chưa chown | `docker compose exec backend chown -R www-data:www-data storage` |
| Queue job không chạy | Queue container die | `docker compose logs queue`, restart: `docker compose restart queue` |

---

## Lưu ý quan trọng

1. **Không commit `.env.docker`** — file này chứa secret thật, đã được `.gitignore` bảo vệ.
2. **`NEXT_PUBLIC_*` bake lúc build** — mỗi khi đổi API URL / Reverb host phải rebuild frontend image.
3. **`INTERNAL_API_URL`** là biến runtime (không bake) — frontend server component dùng URL này gọi backend qua Docker network nội bộ.
4. **MySQL partitioned table** (`movie_view_logs`) — partition `p_future MAXVALUE` bắt tất cả, nhưng nên thêm cron tạo partition tháng mới để tối ưu query.
5. **Volume `db-data`** giữ data MySQL qua restart. `docker compose down -v` sẽ **XOÁ TOÀN BỘ** database.
6. **Test trước khi build image:**
   ```bash
   php artisan test          # 98 tests pass
   pnpm --prefix frontend lint  # 0 errors
   ```
