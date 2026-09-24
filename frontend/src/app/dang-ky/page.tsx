import { Suspense } from "react";
import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản — PHIM HAY",
  description: "Tạo tài khoản WebPhim miễn phí để lưu phim yêu thích, đánh giá và theo dõi tập mới.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <AuthCard
        mode="register"
        title="Tạo tài khoản mới"
        subtitle="Khám phá và tận hưởng kho phim 4K không giới hạn ngay hôm nay"
      >
        <Suspense fallback={<div className="py-8 text-center text-xs text-white/50">Đang tải form đăng ký...</div>}>
          <RegisterForm />
        </Suspense>
      </AuthCard>
    </div>
  );
}
