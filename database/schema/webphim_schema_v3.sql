-- ============================================================
-- WEBPHIM DATABASE SCHEMA v3.0.0
-- Website xem phim trực tuyến — MySQL 8.0+
-- Generated: 2026-08-11
-- ============================================================
-- Thứ tự: Bảng cha trước, bảng con sau (đảm bảo FK hợp lệ)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- NHÓM 1: USER & AUTH
-- ============================================================

-- Bảng users đã có sẵn từ Laravel, chỉ ALTER thêm cột
-- Laravel mặc định tạo: id, name, email, email_verified_at, password, remember_token, timestamps

ALTER TABLE `users`
    ADD COLUMN `avatar_url` VARCHAR(1000) NULL DEFAULT NULL COMMENT 'URL ảnh đại diện' AFTER `remember_token`,
    ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT 'Vai trò: admin / moderator / user' AFTER `avatar_url`,
    ADD COLUMN `subscription_type` VARCHAR(20) NOT NULL DEFAULT 'free' COMMENT 'Gói dịch vụ: free / vip / premium' AFTER `role`,
    ADD COLUMN `subscription_expires_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm hết hạn VIP/Premium' AFTER `subscription_type`,
    ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Trạng thái tài khoản (0=banned, 1=active)' AFTER `subscription_expires_at`,
    ADD INDEX `users_role_index` (`role`),
    ADD INDEX `users_subscription_type_index` (`subscription_type`);


-- ============================================================
-- NHÓM 2: CORE — PHIM
-- ============================================================

CREATE TABLE `movies` (
    `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_id`           BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID phim gốc (phim nhiều season)',

    -- Thông tin cơ bản
    `name`                VARCHAR(500)    NOT NULL COMMENT 'Tên phim tiếng Việt',
    `origin_name`         VARCHAR(500)    NULL DEFAULT NULL COMMENT 'Tên gốc (tiếng Anh / bản địa)',
    `slug`                VARCHAR(500)    NOT NULL COMMENT 'URL slug SEO friendly',
    `content`             TEXT            NULL DEFAULT NULL COMMENT 'Mô tả / tóm tắt nội dung phim',

    -- Phân loại
    `type`                VARCHAR(20)     NOT NULL COMMENT 'single = phim lẻ, series = phim bộ',
    `status`              VARCHAR(20)     NOT NULL DEFAULT 'ongoing' COMMENT 'ongoing / completed / trailer',
    `quality`             VARCHAR(20)     NULL DEFAULT 'HD' COMMENT 'CAM, SD, HD, FHD, 4K',
    `lang`                VARCHAR(50)     NULL DEFAULT NULL COMMENT 'Ngôn ngữ gốc: Tiếng Anh, Tiếng Nhật...',
    `age_rating`          VARCHAR(10)     NULL DEFAULT 'P' COMMENT 'P, K, 13+, 16+, 18+',
    `is_cinema`           TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Phim chiếu rạp',

    -- Media
    `thumb_url`           VARCHAR(1000)   NULL DEFAULT NULL COMMENT 'URL ảnh thumbnail (ngang)',
    `poster_url`          VARCHAR(1000)   NULL DEFAULT NULL COMMENT 'URL poster (dọc)',
    `trailer_url`         VARCHAR(1000)   NULL DEFAULT NULL COMMENT 'URL trailer',

    -- Thông tin tập phim
    `duration`            VARCHAR(50)     NULL DEFAULT NULL COMMENT 'Thời lượng hiển thị: 120 phút, 45 phút/tập',
    `duration_minutes`    SMALLINT UNSIGNED NULL DEFAULT NULL COMMENT 'Thời lượng (phút) — sort/filter',
    `episode_current`     VARCHAR(50)     NULL DEFAULT NULL COMMENT 'Tập hiện tại (text): Tập 12, Hoàn tất 24/24',
    `episode_total`       VARCHAR(50)     NULL DEFAULT NULL COMMENT 'Tổng số tập (text): 24 Tập, Đang cập nhật',
    `episode_current_num` SMALLINT UNSIGNED NULL DEFAULT NULL COMMENT 'Số tập hiện tại (số) — sort/filter',
    `episode_total_num`   SMALLINT UNSIGNED NULL DEFAULT NULL COMMENT 'Tổng số tập (số) — sort/filter',
    `notify_schedule`     VARCHAR(255)    NULL DEFAULT NULL COMMENT 'Lịch phát sóng: Thứ 7 hàng tuần',

    -- Điểm đánh giá
    `year`                SMALLINT UNSIGNED NULL DEFAULT NULL COMMENT 'Năm phát hành',
    `imdb_rating`         DECIMAL(3,1)    NULL DEFAULT 0.0 COMMENT 'Điểm IMDb gốc (0.0-10.0)',
    `tmdb_rating`         DECIMAL(3,1)    NULL DEFAULT 0.0 COMMENT 'Điểm TMDb gốc (0.0-10.0)',
    `rating_avg`          DECIMAL(3,1)    NOT NULL DEFAULT 0.0 COMMENT 'Điểm đánh giá TB nội bộ (denormalized)',
    `rating_count`        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Tổng lượt đánh giá nội bộ (denormalized)',

    -- Thống kê
    `view_count`          BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Tổng lượt xem (denormalized)',
    `comment_count`       INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Tổng bình luận (denormalized)',

    -- Cờ trạng thái
    `is_featured`         TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Phim nổi bật — banner trang chủ',
    `is_active`           TINYINT(1)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái hiển thị',

    -- Đồng bộ dữ liệu
    `tmdb_id`             VARCHAR(50)     NULL DEFAULT NULL COMMENT 'TMDb ID — đồng bộ, tránh trùng',
    `imdb_id`             VARCHAR(50)     NULL DEFAULT NULL COMMENT 'IMDb ID — đồng bộ, tránh trùng',
    `source_url`          VARCHAR(1000)   NULL DEFAULT NULL COMMENT 'URL nguồn crawl (OPhim, KKPhim...)',
    `last_synced_at`      TIMESTAMP       NULL DEFAULT NULL COMMENT 'Lần đồng bộ cuối',

    -- SEO Metadata
    `meta_title`          VARCHAR(255)    NULL DEFAULT NULL COMMENT 'Custom SEO title',
    `meta_description`    VARCHAR(500)    NULL DEFAULT NULL COMMENT 'Custom meta description',
    `meta_keywords`       VARCHAR(500)    NULL DEFAULT NULL COMMENT 'SEO keywords (comma-separated)',

    -- Timestamps
    `created_at`          TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`          TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`          TIMESTAMP       NULL DEFAULT NULL COMMENT 'Soft delete',

    PRIMARY KEY (`id`),
    UNIQUE  KEY `movies_slug_unique` (`slug`),
    UNIQUE  KEY `movies_tmdb_id_unique` (`tmdb_id`),
    UNIQUE  KEY `movies_imdb_id_unique` (`imdb_id`),
    KEY         `movies_type_index` (`type`),
    KEY         `movies_status_index` (`status`),
    KEY         `movies_year_index` (`year`),
    KEY         `movies_view_count_index` (`view_count`),
    KEY         `movies_is_featured_index` (`is_featured`),
    KEY         `movies_created_at_index` (`created_at`),
    KEY         `movies_is_cinema_index` (`is_cinema`),
    KEY         `movies_active_type_status_index` (`is_active`, `type`, `status`),
    KEY         `movies_active_featured_index` (`is_active`, `is_featured`),
    FULLTEXT    `movies_fulltext_search` (`name`, `origin_name`),
    CONSTRAINT  `movies_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `movies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng phim — trung tâm hệ thống';


-- ============================================================
-- NHÓM 3: PHÂN LOẠI — THỂ LOẠI, QUỐC GIA, TAGS
-- ============================================================

CREATE TABLE `genres` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`             VARCHAR(100)    NOT NULL COMMENT 'Tên thể loại',
    `slug`             VARCHAR(100)    NOT NULL COMMENT 'URL slug',
    `meta_title`       VARCHAR(255)    NULL DEFAULT NULL COMMENT 'SEO title trang thể loại',
    `meta_description` VARCHAR(500)    NULL DEFAULT NULL COMMENT 'SEO description trang thể loại',
    `created_at`       TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`       TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `genres_name_unique` (`name`),
    UNIQUE KEY `genres_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thể loại phim';


CREATE TABLE `movie_genre` (
    `movie_id` BIGINT UNSIGNED NOT NULL,
    `genre_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`movie_id`, `genre_id`),
    KEY         `movie_genre_genre_id_index` (`genre_id`),
    CONSTRAINT  `movie_genre_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `movie_genre_genre_id_foreign` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pivot: Phim ↔ Thể loại (N-N)';


CREATE TABLE `countries` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`             VARCHAR(100)    NOT NULL COMMENT 'Tên quốc gia',
    `slug`             VARCHAR(100)    NOT NULL COMMENT 'URL slug',
    `meta_title`       VARCHAR(255)    NULL DEFAULT NULL COMMENT 'SEO title trang quốc gia',
    `meta_description` VARCHAR(500)    NULL DEFAULT NULL COMMENT 'SEO description trang quốc gia',
    `created_at`       TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`       TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `countries_name_unique` (`name`),
    UNIQUE KEY `countries_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quốc gia sản xuất phim';


CREATE TABLE `movie_country` (
    `movie_id`   BIGINT UNSIGNED NOT NULL,
    `country_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`movie_id`, `country_id`),
    KEY         `movie_country_country_id_index` (`country_id`),
    CONSTRAINT  `movie_country_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `movie_country_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pivot: Phim ↔ Quốc gia (N-N)';


CREATE TABLE `tags` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`             VARCHAR(100)    NOT NULL COMMENT 'Tên tag',
    `slug`             VARCHAR(100)    NOT NULL COMMENT 'URL slug',
    `description`      TEXT            NULL DEFAULT NULL COMMENT 'Mô tả tag — hiển thị trên trang tag',
    `meta_title`       VARCHAR(255)    NULL DEFAULT NULL COMMENT 'SEO title',
    `meta_description` VARCHAR(500)    NULL DEFAULT NULL COMMENT 'SEO description',
    `created_at`       TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`       TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `tags_name_unique` (`name`),
    UNIQUE KEY `tags_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tags SEO — nhóm phim linh hoạt';


CREATE TABLE `movie_tag` (
    `movie_id` BIGINT UNSIGNED NOT NULL,
    `tag_id`   BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`movie_id`, `tag_id`),
    KEY         `movie_tag_tag_id_index` (`tag_id`),
    CONSTRAINT  `movie_tag_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `movie_tag_tag_id_foreign` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pivot: Phim ↔ Tag (N-N)';


-- ============================================================
-- NHÓM 4: PEOPLE — DIỄN VIÊN, ĐẠO DIỄN, EKIP
-- ============================================================

CREATE TABLE `people` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`           VARCHAR(255)    NOT NULL COMMENT 'Tên chính hiển thị',
    `slug`           VARCHAR(255)    NOT NULL COMMENT 'URL slug',
    `other_names`    VARCHAR(500)    NULL DEFAULT NULL COMMENT 'Tên khác (biệt danh, Hán Việt...)',
    `avatar_url`     VARCHAR(1000)   NULL DEFAULT NULL COMMENT 'Ảnh đại diện',
    `gender`         VARCHAR(10)     NULL DEFAULT NULL COMMENT 'male / female / other',
    `birthday`       DATE            NULL DEFAULT NULL COMMENT 'Ngày sinh (YYYY-MM-DD)',
    `place_of_birth` VARCHAR(255)    NULL DEFAULT NULL COMMENT 'Nơi sinh',
    `biography`      TEXT            NULL DEFAULT NULL COMMENT 'Tiểu sử ngắn',
    `tmdb_id`        VARCHAR(50)     NULL DEFAULT NULL COMMENT 'TMDb Person ID — đồng bộ',
    `created_at`     TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`     TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY  `people_slug_unique` (`slug`),
    KEY         `people_tmdb_id_index` (`tmdb_id`),
    FULLTEXT    `people_fulltext_search` (`name`, `other_names`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Diễn viên, đạo diễn, ekip — gộp 1 bảng';


CREATE TABLE `movie_person` (
    `movie_id`       BIGINT UNSIGNED NOT NULL,
    `person_id`      BIGINT UNSIGNED NOT NULL,
    `role`           VARCHAR(20)     NOT NULL COMMENT 'actor / director / writer / producer',
    `character_name` VARCHAR(255)    NULL DEFAULT NULL COMMENT 'Tên nhân vật (chỉ dùng cho actor)',
    `sort_order`     SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị',

    PRIMARY KEY (`movie_id`, `person_id`, `role`),
    KEY         `movie_person_person_id_index` (`person_id`),
    KEY         `movie_person_role_index` (`role`),
    CONSTRAINT  `movie_person_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `movie_person_person_id_foreign` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pivot: Phim ↔ Người — role linh hoạt (N-N)';


-- ============================================================
-- NHÓM 5: CORE — TẬP PHIM & SERVER
-- ============================================================

CREATE TABLE `episodes` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `movie_id`   BIGINT UNSIGNED NOT NULL,
    `name`       VARCHAR(255)    NOT NULL COMMENT 'Tên tập: Tập 1, Full',
    `slug`       VARCHAR(255)    NOT NULL COMMENT 'Slug: tap-1, full',
    `sort_order` INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Thứ tự sắp xếp',
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    `updated_at` TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY  `episodes_movie_slug_unique` (`movie_id`, `slug`),
    KEY         `episodes_movie_id_index` (`movie_id`),
    KEY         `episodes_sort_order_index` (`movie_id`, `sort_order`),
    CONSTRAINT  `episodes_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tập phim';


CREATE TABLE `episode_servers` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `episode_id`  BIGINT UNSIGNED NOT NULL,
    `server_name` VARCHAR(100)    NOT NULL COMMENT 'Tên server: Server VIP 1, Server #2',
    `lang_type`   VARCHAR(20)     NOT NULL DEFAULT 'vietsub' COMMENT 'vietsub / thuyetminh / longtieng / engsub / raw',
    `link_embed`  TEXT            NULL DEFAULT NULL COMMENT 'Link nhúng iframe player',
    `link_m3u8`   TEXT            NULL DEFAULT NULL COMMENT 'Link stream HLS trực tiếp',
    `subtitles`   JSON            NULL DEFAULT NULL COMMENT 'Phụ đề rời: [{lang, url, label}]',
    `sort_order`  SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Thứ tự ưu tiên server',
    `is_active`   TINYINT(1)      NOT NULL DEFAULT 1 COMMENT 'Server còn hoạt động',
    `created_at`  TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`  TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY         `episode_servers_episode_id_index` (`episode_id`),
    KEY         `episode_servers_episode_lang_index` (`episode_id`, `lang_type`),
    CONSTRAINT  `episode_servers_episode_id_foreign` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Server phát video cho mỗi tập';


-- ============================================================
-- NHÓM 6: TƯƠNG TÁC USER
-- ============================================================

CREATE TABLE `comments` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`       BIGINT UNSIGNED NOT NULL,
    `movie_id`      BIGINT UNSIGNED NOT NULL,
    `parent_id`     BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Reply comment (Adjacency List)',
    `content`       TEXT            NOT NULL COMMENT 'Nội dung bình luận',
    `likes_count`   INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Số lượt thích (denormalized)',
    `replies_count` INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Số reply trực tiếp (denormalized)',
    `is_pinned`     TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Ghim comment lên đầu',
    `is_spoiler`    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Đánh dấu spoiler',
    `status`        VARCHAR(20)     NOT NULL DEFAULT 'active' COMMENT 'active / hidden / spam',
    `created_at`    TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`    TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`    TIMESTAMP       NULL DEFAULT NULL COMMENT 'Soft delete',

    PRIMARY KEY (`id`),
    KEY         `comments_movie_id_index` (`movie_id`),
    KEY         `comments_user_id_index` (`user_id`),
    KEY         `comments_parent_id_index` (`parent_id`),
    KEY         `comments_movie_status_created_index` (`movie_id`, `status`, `created_at`),
    CONSTRAINT  `comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `comments_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `comments_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bình luận phim — nested, spoiler, moderation';


CREATE TABLE `comment_likes` (
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `comment_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`user_id`, `comment_id`),
    KEY         `comment_likes_comment_id_index` (`comment_id`),
    CONSTRAINT  `comment_likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `comment_likes_comment_id_foreign` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Like bình luận — 1 user / 1 like / 1 comment';


CREATE TABLE `ratings` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `movie_id`   BIGINT UNSIGNED NOT NULL,
    `score`      TINYINT UNSIGNED NOT NULL COMMENT 'Điểm 1-10',
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    `updated_at` TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY  `ratings_user_movie_unique` (`user_id`, `movie_id`),
    KEY         `ratings_movie_id_index` (`movie_id`),
    CONSTRAINT  `ratings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `ratings_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `ratings_score_check` CHECK (`score` >= 1 AND `score` <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đánh giá phim nội bộ (1-10 điểm)';


CREATE TABLE `bookmarks` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    BIGINT UNSIGNED NOT NULL,
    `movie_id`   BIGINT UNSIGNED NOT NULL,
    `type`       VARCHAR(20)     NOT NULL DEFAULT 'favorite' COMMENT 'favorite / watchlater / following',
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    `updated_at` TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY  `bookmarks_user_movie_type_unique` (`user_id`, `movie_id`, `type`),
    KEY         `bookmarks_user_type_index` (`user_id`, `type`),
    KEY         `bookmarks_movie_id_index` (`movie_id`),
    CONSTRAINT  `bookmarks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `bookmarks_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Yêu thích, Xem sau & Theo dõi phim bộ';


CREATE TABLE `watch_histories` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`          BIGINT UNSIGNED NOT NULL,
    `movie_id`         BIGINT UNSIGNED NOT NULL,
    `episode_id`       BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Tập đang xem',
    `server_id`        BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Server đang dùng',
    `progress_seconds` INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Đã xem đến giây thứ mấy',
    `duration_seconds` INT UNSIGNED    NULL DEFAULT NULL COMMENT 'Tổng thời lượng tập (giây)',
    `is_completed`     TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Đã xem hết chưa',
    `watched_at`       TIMESTAMP       NOT NULL COMMENT 'Thời điểm xem gần nhất',
    `created_at`       TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`       TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY  `watch_histories_user_movie_episode_unique` (`user_id`, `movie_id`, `episode_id`),
    KEY         `watch_histories_user_watched_index` (`user_id`, `watched_at`),
    KEY         `watch_histories_movie_id_index` (`movie_id`),
    CONSTRAINT  `watch_histories_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `watch_histories_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `watch_histories_episode_id_foreign` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE SET NULL,
    CONSTRAINT  `watch_histories_server_id_foreign` FOREIGN KEY (`server_id`) REFERENCES `episode_servers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử xem — resume watching';


-- ============================================================
-- NHÓM 7: CONTENT CURATION — BỘ SƯU TẬP
-- ============================================================

CREATE TABLE `collections` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`             VARCHAR(255)    NOT NULL COMMENT 'Tên bộ sưu tập',
    `slug`             VARCHAR(255)    NOT NULL COMMENT 'URL slug',
    `description`      TEXT            NULL DEFAULT NULL COMMENT 'Mô tả',
    `thumb_url`        VARCHAR(1000)   NULL DEFAULT NULL COMMENT 'Ảnh đại diện bộ sưu tập',
    `meta_title`       VARCHAR(255)    NULL DEFAULT NULL COMMENT 'SEO title',
    `meta_description` VARCHAR(500)    NULL DEFAULT NULL COMMENT 'SEO description',
    `is_active`        TINYINT(1)      NOT NULL DEFAULT 1 COMMENT 'Trạng thái hiển thị',
    `sort_order`       INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    `created_by`       BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Admin tạo',
    `created_at`       TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`       TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY  `collections_slug_unique` (`slug`),
    KEY         `collections_active_sort_index` (`is_active`, `sort_order`),
    CONSTRAINT  `collections_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bộ sưu tập phim do admin quản lý';


CREATE TABLE `collection_movie` (
    `collection_id` BIGINT UNSIGNED NOT NULL,
    `movie_id`      BIGINT UNSIGNED NOT NULL,
    `sort_order`    INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Thứ tự phim trong collection',

    PRIMARY KEY (`collection_id`, `movie_id`),
    KEY         `collection_movie_movie_id_index` (`movie_id`),
    CONSTRAINT  `collection_movie_collection_id_foreign` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `collection_movie_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pivot: Bộ sưu tập ↔ Phim (N-N)';


-- ============================================================
-- NHÓM 8: VẬN HÀNH — BÁO LỖI, ANALYTICS, AUDIT
-- ============================================================

CREATE TABLE `episode_reports` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`     BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'User báo lỗi (null = guest)',
    `episode_id`  BIGINT UNSIGNED NOT NULL,
    `server_id`   BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Server bị lỗi',
    `report_type` VARCHAR(50)     NOT NULL COMMENT 'dead_link / no_sound / wrong_sub / wrong_episode / low_quality / other',
    `description` TEXT            NULL DEFAULT NULL COMMENT 'Mô tả chi tiết từ user',
    `status`      VARCHAR(20)     NOT NULL DEFAULT 'pending' COMMENT 'pending / resolved / dismissed',
    `resolved_by` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Admin xử lý',
    `resolved_at` TIMESTAMP       NULL DEFAULT NULL COMMENT 'Thời điểm xử lý',
    `admin_note`  TEXT            NULL DEFAULT NULL COMMENT 'Ghi chú admin',
    `created_at`  TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`  TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY         `episode_reports_episode_id_index` (`episode_id`),
    KEY         `episode_reports_status_index` (`status`),
    KEY         `episode_reports_status_created_index` (`status`, `created_at`),
    CONSTRAINT  `episode_reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT  `episode_reports_episode_id_foreign` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE CASCADE,
    CONSTRAINT  `episode_reports_server_id_foreign` FOREIGN KEY (`server_id`) REFERENCES `episode_servers` (`id`) ON DELETE SET NULL,
    CONSTRAINT  `episode_reports_resolved_by_foreign` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Báo lỗi phim — link chết, sai phụ đề...';


CREATE TABLE `movie_view_logs` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `movie_id`   BIGINT UNSIGNED NOT NULL,
    `episode_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `user_id`    BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Null nếu guest',
    `ip_address` VARCHAR(45)     NOT NULL COMMENT 'IPv4 hoặc IPv6',
    `user_agent` VARCHAR(500)    NULL DEFAULT NULL COMMENT 'Browser / device info',
    `viewed_at`  TIMESTAMP       NOT NULL,

    PRIMARY KEY (`id`),
    KEY         `movie_view_logs_movie_id_index` (`movie_id`),
    KEY         `movie_view_logs_viewed_at_index` (`viewed_at`),
    KEY         `movie_view_logs_movie_date_index` (`movie_id`, `viewed_at`),
    KEY         `movie_view_logs_dedup_index` (`movie_id`, `ip_address`, `viewed_at`),
    CONSTRAINT  `movie_view_logs_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log xem phim — analytics, chống bot';


CREATE TABLE `audit_logs` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Admin thực hiện',
    `action`     VARCHAR(50)     NOT NULL COMMENT 'create / update / delete / restore / login / logout / export',
    `model_type` VARCHAR(100)    NOT NULL COMMENT 'Eloquent model: movie, episode...',
    `model_id`   BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID record bị tác động',
    `changes`    JSON            NULL DEFAULT NULL COMMENT '{old: {...}, new: {...}}',
    `ip_address` VARCHAR(45)     NULL DEFAULT NULL,
    `user_agent` VARCHAR(500)    NULL DEFAULT NULL,
    `created_at` TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY         `audit_logs_user_id_index` (`user_id`),
    KEY         `audit_logs_model_index` (`model_type`, `model_id`),
    KEY         `audit_logs_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký hành động admin';


-- ============================================================
-- NHÓM 9: LARAVEL BUILT-IN — NOTIFICATIONS
-- ============================================================

CREATE TABLE `notifications` (
    `id`              CHAR(36)        NOT NULL COMMENT 'UUID',
    `type`            VARCHAR(255)    NOT NULL COMMENT 'Notification class: new_episode, comment_reply',
    `notifiable_type` VARCHAR(255)    NOT NULL COMMENT 'Polymorphic type: App\\Models\\User',
    `notifiable_id`   BIGINT UNSIGNED NOT NULL COMMENT 'User ID nhận thông báo',
    `data`            JSON            NOT NULL COMMENT 'Payload: {movie_id, episode_name, message, url...}',
    `read_at`         TIMESTAMP       NULL DEFAULT NULL COMMENT 'Null = chưa đọc',
    `created_at`      TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP       NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY         `notifications_notifiable_index` (`notifiable_type`, `notifiable_id`),
    KEY         `notifications_read_at_index` (`read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông báo — Laravel Notification system';


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TỔNG KẾT
-- ============================================================
-- Tổng: 22 bảng (1 ALTER + 21 CREATE)
--
-- Nhóm 1 - User & Auth:       users (ALTER)
-- Nhóm 2 - Core:              movies
-- Nhóm 3 - Phân loại:         genres, movie_genre, countries, movie_country, tags, movie_tag
-- Nhóm 4 - People:            people, movie_person
-- Nhóm 5 - Tập phim:          episodes, episode_servers
-- Nhóm 6 - Tương tác:         comments, comment_likes, ratings, bookmarks, watch_histories
-- Nhóm 7 - Curation:          collections, collection_movie
-- Nhóm 8 - Vận hành:          episode_reports, movie_view_logs, audit_logs
-- Nhóm 9 - Laravel:           notifications
-- ============================================================
