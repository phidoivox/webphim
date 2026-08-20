import { z } from "zod";

/**
 * Validation schema cho biểu mẫu đăng nhập
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ email.")
    .email("Địa chỉ email không đúng định dạng."),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu."),
  rememberMe: z.boolean(),
});


export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validation schema cho biểu mẫu đăng ký
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập họ và tên của bạn.")
      .min(2, "Họ và tên phải có tối thiểu 2 ký tự.")
      .max(100, "Họ và tên không được vượt quá 100 ký tự."),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập địa chỉ email.")
      .email("Địa chỉ email không đúng định dạng."),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu.")
      .min(6, "Mật khẩu bảo mật phải có ít nhất 6 ký tự.")
      .max(100, "Mật khẩu không được vượt quá 100 ký tự."),
    passwordConfirmation: z
      .string()
      .min(1, "Vui lòng xác nhận lại mật khẩu."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["passwordConfirmation"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validation schema cho quên mật khẩu
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ email.")
    .email("Địa chỉ email không đúng định dạng."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
