import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@/components/ui/icons";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { getCachedWeeklySchedule } from "@/lib/cached-content";
import { getSiteUrl } from "@/lib/env";
import type { WeeklyScheduleData } from "@/types/schedule";

export const metadata: Metadata = {
  title: "Lịch Chiếu Phim - Lịch Phát Sóng Phim Mới Trong Tuần | WebPhim",
  description:
    "Theo dõi lịch chiếu phim bộ, anime, truyền hình hot nhất theo từng ngày trong tuần trên WebPhim. Cập nhật tập mới liên tục và chính xác.",
  openGraph: {
    title: "Lịch Chiếu Phim - WebPhim",
    description:
      "Theo dõi lịch chiếu phim bộ, anime, truyền hình hot nhất theo từng ngày trong tuần trên WebPhim.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lịch Chiếu Phim - WebPhim",
    description: "Theo dõi lịch chiếu phim bộ, anime hot nhất trong tuần.",
  },
};

const DEFAULT_SCHEDULE: WeeklyScheduleData = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
};

export default async function SchedulePage() {
  let scheduleData = DEFAULT_SCHEDULE;

  try {
    const res = await getCachedWeeklySchedule();
    if (res && res.status === "success" && res.data) {
      scheduleData = {
        ...DEFAULT_SCHEDULE,
        ...res.data,
      };
    }
  } catch (error) {
    console.error("Lỗi khi fetch lịch chiếu:", error);
  }

  // Schema Structured Data
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Lịch Chiếu Phim - WebPhim",
    description: "Lịch phát sóng phim bộ, anime mới nhất hàng tuần",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Trang chủ",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Lịch chiếu",
          item: `${siteUrl}/lich-chieu`,
        },
      ],
    },
  };

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-white/50">
          <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
            <HomeIcon className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRightIcon className="h-3 w-3 text-white/30" />
          <span className="text-white font-medium">Lịch chiếu</span>
        </nav>

        {/* Schedule Component */}
        <ScheduleGrid initialSchedule={scheduleData} />
      </div>
    </main>
  );
}
