import { z } from "zod";

/**
 * Schema cho diễn viên trong phim
 */
export const movieActorSchema = z.object({
  id: z.number().nullable().optional(),
  name: z.string().trim().min(1, "Tên diễn viên không được để trống."),
  character_name: z.string().trim().optional().or(z.literal("")),
  sort_order: z.number().optional(),
});

/**
 * Schema cho đạo diễn
 */
export const movieDirectorSchema = z.object({
  id: z.number().nullable().optional(),
  name: z.string().trim().min(1, "Tên đạo diễn không được để trống."),
  sort_order: z.number().optional(),
});

/**
 * Schema cho thư viện hình ảnh (Gallery)
 */
export const movieGalleryItemSchema = z.object({
  id: z.number().nullable().optional(),
  media_type: z.enum(["image", "video"]).default("image"),
  type: z.string().default("still"),
  url: z.string().trim().min(1, "URL ảnh không được để trống."),
  thumb_url: z.string().trim().optional().or(z.literal("")),
  caption: z.string().trim().optional().or(z.literal("")),
  sort_order: z.number().default(1),
});

/**
 * Schema cho Form tạo / chỉnh sửa phim (Movie Studio)
 */
export const movieFormSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên phim."),
  origin_name: z.string().trim().optional().or(z.literal("")),
  slug: z.string().trim().min(1, "Vui lòng nhập đường dẫn tĩnh (slug)."),
  content: z.string().trim().optional().or(z.literal("")),
  type: z.enum(["single", "series", "tv-show"]).default("single"),
  status: z.enum(["completed", "ongoing", "trailer"]).default("completed"),
  quality: z.string().default("HD"),
  lang: z.string().default("Vietsub"),
  thumb_url: z.string().trim().optional().or(z.literal("")),
  poster_url: z.string().trim().optional().or(z.literal("")),
  trailer_url: z.string().trim().optional().or(z.literal("")),
  duration: z.string().trim().optional().or(z.literal("")),
  episode_current: z.string().trim().optional().or(z.literal("")),
  episode_total: z.string().trim().optional().or(z.literal("")),
  notify_schedule: z.string().trim().max(255).optional().or(z.literal("")),
  schedule_days: z.array(z.number().int().min(0).max(6)).max(7).optional().default([]),
  year: z.coerce.number().int().min(1900).max(2100).default(() => new Date().getFullYear()),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_cinema: z.boolean().default(false),
  imdb_rating: z.string().optional().or(z.literal("")),
  tmdb_rating: z.string().optional().or(z.literal("")),
  tmdb_id: z.string().optional().or(z.literal("")),
  imdb_id: z.string().optional().or(z.literal("")),
  source_url: z.string().optional().or(z.literal("")),
  genre_ids: z.array(z.number()).default([]),
  country_ids: z.array(z.number()).default([]),
  tags: z.array(z.string()).default([]),
  actors: z.array(movieActorSchema).default([]),
  directors: z.array(movieDirectorSchema).default([]),
  galleries: z.array(movieGalleryItemSchema).default([]),
  episodes: z.array(z.any()).optional().default([]),
});

export type MovieFormInput = z.infer<typeof movieFormSchema>;

/**
 * Schema cho tập phim và server phát video
 */
export const episodeServerSchema = z.object({
  id: z.number().nullable().optional(),
  server_name: z.string().trim().min(1, "Vui lòng nhập tên server."),
  server_type: z.string().default("hls"),
  link_m3u8: z.string().trim().optional().or(z.literal("")),
  link_embed: z.string().trim().optional().or(z.literal("")),
  sort_order: z.number().default(1),
});

export const episodeFormSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên tập phim."),
  slug: z.string().trim().min(1, "Vui lòng nhập slug tập phim."),
  episode_order: z.coerce.number().int().min(1).default(1),
  is_active: z.boolean().default(true),
  servers: z.array(episodeServerSchema).default([]),
});

export type EpisodeFormInput = z.infer<typeof episodeFormSchema>;
