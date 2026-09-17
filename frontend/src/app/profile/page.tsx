import type { Metadata } from "next";
import AccountClient from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Hồ sơ & Bộ sưu tập — WebPhim",
  description: "Quản lý thông tin tài khoản, avatar, mật khẩu và các bộ sưu tập phim của bạn.",
};

export default function ProfilePage() {
  return <AccountClient />;
}
