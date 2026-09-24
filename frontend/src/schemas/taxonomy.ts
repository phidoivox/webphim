import { z } from "zod";

/**
 * Validation schema cho thể loại phim (Genres)
 */
export const genreSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên thể loại.")
    .max(100, "Tên thể loại không được vượt quá 100 ký tự."),
  slug: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập đường dẫn tĩnh (slug).")
    .max(100, "Đường dẫn tĩnh không được vượt quá 100 ký tự."),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả không được vượt quá 500 ký tự.")
    .optional()
    .or(z.literal("")),
});

export type GenreInput = z.infer<typeof genreSchema>;

/**
 * Validation schema cho quốc gia (Countries)
 */
export const countrySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên quốc gia.")
    .max(100, "Tên quốc gia không được vượt quá 100 ký tự."),
  slug: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập mã/slug quốc gia.")
    .max(100, "Mã/slug quốc gia không được vượt quá 100 ký tự."),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả không được vượt quá 500 ký tự.")
    .optional()
    .or(z.literal("")),
});

export type CountryInput = z.infer<typeof countrySchema>;
