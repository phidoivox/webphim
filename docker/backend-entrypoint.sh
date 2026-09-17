#!/bin/sh
set -e

# Fix quyền volume (root-owned lúc tạo) trước khi hạ quyền www-data
mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions \
  storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache public

# Wait for MySQL
echo "⏳ Waiting for database..."
until su-exec www-data php artisan db:monitor --databases=mysql 2>/dev/null; do
  sleep 2
done
echo "✅ Database ready"

# Run migrations
su-exec www-data php artisan migrate --force --no-interaction

# Create storage symlink
su-exec www-data php artisan storage:link --force 2>/dev/null || true

# Cache config/routes/views for production
su-exec www-data php artisan config:cache
su-exec www-data php artisan route:cache
su-exec www-data php artisan view:cache

echo "🚀 Backend ready"
exec su-exec www-data "$@"
