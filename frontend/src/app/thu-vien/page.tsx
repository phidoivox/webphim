import type { Metadata } from "next";
import BookmarkView from "@/components/bookmark/BookmarkView";

export const metadata: Metadata = {
  title: "Tủ Phim Đã Lưu - WebPhim",
  description: "Tủ phim đã lưu và phim yêu thích trên WebPhim.",
};

export default function ThuVienPage() {
  return <BookmarkView />;
}
