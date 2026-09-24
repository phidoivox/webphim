import { z } from "zod";

/**
 * Validation schema cho quản trị viên chỉnh sửa người dùng
 */
export const adminUserEditSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên người dùng.")
    .min(2, "Tên người dùng phải có tối thiểu 2 ký tự.")
    .max(100, "Tên người dùng không được vượt quá 100 ký tự."),
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập địa chỉ email.")
    .email("Địa chỉ email không đúng định dạng."),
  role: z.enum(["admin", "moderator", "user"], {
    message: "Vai trò không hợp lệ.",
  }),
  is_active: z.boolean(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Mật khẩu mới phải có ít nhất 6 ký tự nếu bạn muốn đổi.",
    }),
});

export type AdminUserEditInput = z.infer<typeof adminUserEditSchema>;
