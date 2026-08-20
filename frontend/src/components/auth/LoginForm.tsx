"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { setFormApiErrors } from "@/lib/form-utils";
import { AlertCircleIcon, LoaderIcon, MailIcon } from "@/components/ui/icons";
import PasswordInput from "./PasswordInput";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { login } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setGeneralError(null);

    try {
      await login({
        email: data.email.trim(),
        password: data.password,
      });
      toast.success("Đăng nhập thành công!");
      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      const errMsg = setFormApiErrors(
        err,
        setError,
        setGeneralError,
        "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin."
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
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-white/60">
            Mật khẩu
          </label>
          <Link
            href="/quen-mat-khau"
            className="text-xs font-medium text-white/45 transition hover:text-accent hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <PasswordInput
          id="password"
          placeholder="Nhập mật khẩu..."
          disabled={isSubmitting}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center pt-1">
        <label className="flex items-center gap-2 text-xs text-white/65 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent focus:ring-offset-0 focus:ring-1 accent-[#ff5c1a] cursor-pointer"
          />
          <span>Ghi nhớ đăng nhập trên thiết bị này</span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <span>Đang đăng nhập...</span>
          </>
        ) : (
          <span>Đăng nhập vào tài khoản</span>
        )}
      </button>

      {/* Footer link to register */}
      <div className="pt-3 text-center text-xs text-white/60">
        Bạn là người mới?{" "}
        <Link
          href={`/dang-ky${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
          className="font-bold text-accent hover:underline ml-1"
        >
          Tạo tài khoản ngay &rarr;
        </Link>
      </div>
    </form>
  );
}

