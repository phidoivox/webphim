import type { Metadata } from "next";
import HistoryView from "@/components/history/HistoryView";

export const metadata: Metadata = {
  title: "Lịch Sử Xem Phim - Phim Hay",
  description:
    "Xem lại danh sách phim đã xem, tiếp tục theo dõi tiến trình phim đang xem dở trên mọi thiết bị.",
};

export default function HistoryPage() {
  return <HistoryView />;
}
