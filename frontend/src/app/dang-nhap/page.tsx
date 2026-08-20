import { Suspense } from "react";
import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập — PHIM HAY",
  description: "Đăng nhập tài khoản WebPhim để lưu danh sách xem, đánh giá và theo dõi phim yêu thích.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <AuthCard
        mode="login"
        title="Chào mừng trở lại"
        subtitle="Đăng nhập để tiếp tục trải nghiệm kho phim HD không giới hạn"
      >
        <Suspense fallback={<div className="py-8 text-center text-xs text-white/50">Đang tải form đăng nhập...</div>}>
          <LoginForm />
        </Suspense>
      </AuthCard>
    </div>
  );
}
