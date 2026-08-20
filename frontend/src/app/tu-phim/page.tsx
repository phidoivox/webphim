import type { Metadata } from "next";
import BookmarkView from "@/components/bookmark/BookmarkView";

export const metadata: Metadata = {
  title: "Tủ Phim Của Bạn - WebPhim",
  description: "Danh sách phim yêu thích và phim xem sau của bạn trên WebPhim.",
};

export default function TuPhimPage() {
  return <BookmarkView />;
}
