"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { registerSchema, type RegisterInput } from "@/schemas/auth";
import { setFormApiErrors } from "@/lib/form-utils";
import { AlertCircleIcon, LoaderIcon, MailIcon, UserIcon } from "@/components/ui/icons";
import PasswordInput from "./PasswordInput";
import { toast } from "sonner";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { register: registerAuth } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const passwordValue = watch("password") || "";

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!passwordValue) return 0;
    let score = 0;
    if (passwordValue.length >= 6) score += 1;
    if (passwordValue.length >= 10) score += 1;
    if (/[A-Z]/.test(passwordValue) || /[0-9]/.test(passwordValue)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score += 1;
    return score; // 0 to 4
  }, [passwordValue]);

  const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Rất mạnh"];
  const strengthColors = [
    "bg-neutral-600",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];

  const onSubmit = async (data: RegisterInput) => {
    setGeneralError(null);

    try {
      await registerAuth({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        password_confirmation: data.passwordConfirmation,
      });
      toast.success("Đăng ký tài khoản thành công!");
      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      const errMsg = setFormApiErrors(
        err,
        setError,
        setGeneralError,
        "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin."
      );
      toast.error(errMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {generalError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 animate-in fade-in duration-200">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span className="leading-relaxed font-medium">{generalError}</span>
        </div>
      )}

      {/* Name Input */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-wider text-white/60">
          Họ và tên
        </label>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3.5 flex items-center text-white/40">
            <UserIcon className="h-4 w-4" />
          </div>
          <input
            id="name"
            type="text"
            placeholder="Ví dụ: Nguyễn Văn A"
            disabled={isSubmitting}
            autoComplete="name"
            {...register("name")}
            className={`h-11 w-full rounded-xl border bg-white/[0.04] py-2 pl-10 pr-3.5 text-sm text-ink placeholder:text-muted/50 backdrop-blur-sm transition-all focus:bg-white/[0.08] focus:outline-none ${
              errors.name
                ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-white/10 focus:border-accent focus:ring-1 focus:ring-accent"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>
        {errors.name && (
          <p className="text-xs font-medium text-red-400 pl-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email Input */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-white/60">
          Địa chỉ Email
        </label>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3.5 flex items-center text-white/40">
            <MailIcon className="h-4 w-4" />
          </div>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={isSubmitting}
            autoComplete="email"
            {...register("email")}
            className={`h-11 w-full rounded-xl border bg-white/[0.04] py-2 pl-10 pr-3.5 text-sm text-ink placeholder:text-muted/50 backdrop-blur-sm transition-all focus:bg-white/[0.08] focus:outline-none ${
              errors.email
                ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-white/10 focus:border-accent focus:ring-1 focus:ring-accent"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>
        {errors.email && (
          <p className="text-xs font-medium text-red-400 pl-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-white/60">
          Mật khẩu (Tối thiểu 6 ký tự)
        </label>
        <PasswordInput
          id="password"
          placeholder="Tạo mật khẩu an toàn..."
          disabled={isSubmitting}
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Realtime Password Strength Meter */}
        {passwordValue.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
              <span>Độ an toàn:</span>
              <span className="font-semibold text-white/80">{strengthLabels[passwordStrength]}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full rounded-full transition-all duration-300 ${
                    passwordStrength >= step
                      ? strengthColors[passwordStrength]
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="passwordConfirmation" className="block text-[11px] font-bold uppercase tracking-wider text-white/60">
          Xác nhận lại mật khẩu
        </label>
        <PasswordInput
          id="passwordConfirmation"
          placeholder="Nhập lại mật khẩu..."
          disabled={isSubmitting}
          autoComplete="new-password"
          error={errors.passwordConfirmation?.message}
          {...register("passwordConfirmation")}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <span>Đang thiết lập tài khoản...</span>
          </>
        ) : (
          <span>Hoàn tất đăng ký</span>
        )}
      </button>

      {/* Footer link to login */}
      <div className="pt-3 text-center text-xs text-white/60">
        Đã có tài khoản?{" "}
        <Link
          href={`/dang-nhap${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
          className="font-bold text-accent hover:underline ml-1"
        >
          Đăng nhập ngay &rarr;
        </Link>
      </div>
    </form>
  );
}

