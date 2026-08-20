"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b10] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xs text-white/60">Đang xác thực quyền quản trị viên...</p>
        </div>
      </div>
    );
  }

  const isAdminOrMod = isAuthenticated && user && (user.role === "admin" || user.role === "moderator");

  if (!isAdminOrMod) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b10] px-4 text-white">
        <div className="max-w-md text-center rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30 text-2xl font-bold mb-4">
            !
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Quyền truy cập bị từ chối</h2>
          <p className="text-xs text-white/60 mb-6 leading-relaxed">
            Bạn cần đăng nhập bằng tài khoản Quản trị viên (Admin hoặc Moderator) để truy cập hệ thống quản lý WebPhim.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href="/dang-nhap?redirect=/admin"
              className="rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-accent/25 hover:bg-accent/90 transition cursor-pointer"
            >
              Đăng nhập tài khoản Admin
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
