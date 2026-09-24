import { z } from "zod";

/** Form tạo / sửa bộ sưu tập */
export const collectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên bộ sưu tập.")
    .max(100, "Tên bộ sưu tập không được vượt quá 100 ký tự."),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả không được vượt quá 500 ký tự.")
    .optional()
    .or(z.literal("")),
  is_public: z.boolean(),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

/** Form cập nhật thông tin tài khoản */
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có tối thiểu 2 ký tự.")
    .max(50, "Họ và tên không được vượt quá 50 ký tự."),
  avatar_url: z
    .string()
    .trim()
    .max(1000, "Link avatar quá dài.")
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: "Link avatar phải bắt đầu bằng http:// hoặc https://.",
    }),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** Form đổi mật khẩu */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    password: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự.")
      .max(100, "Mật khẩu không được vượt quá 100 ký tự."),
    password_confirmation: z.string().min(1, "Vui lòng xác nhận mật khẩu mới."),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["password_confirmation"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
