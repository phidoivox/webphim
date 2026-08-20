import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Bảng Điều Khiển Quản Trị | WebPhim Admin Portal",
  description: "Trang quản trị nội dung phim, tập phim, thể loại và người dùng hệ thống WebPhim.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
