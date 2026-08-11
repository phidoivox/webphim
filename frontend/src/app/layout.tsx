import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "PHIM HAY — Xem phim online mới nhất",
  description:
    "Xem phim bộ, phim lẻ chất lượng cao miễn phí — cập nhật phim mới mỗi ngày.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-base font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
