import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { BookmarkProvider } from "@/context/BookmarkContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { QueryProvider } from "@/context/QueryProvider";
import { getSiteUrl } from "@/lib/env";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "vietnamese"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0e10",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "PHIM HAY — Xem phim online mới nhất",
  description:
    "Xem phim bộ, phim lẻ chất lượng cao miễn phí — cập nhật phim mới mỗi ngày.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-base font-sans text-ink">
        <QueryProvider>
          <AuthProvider>
            <NotificationProvider>
              <BookmarkProvider>
                <Suspense>
                  <AppShell>{children}</AppShell>
                </Suspense>
              </BookmarkProvider>
            </NotificationProvider>
          </AuthProvider>
          <Toaster richColors position="top-right" theme="dark" />
        </QueryProvider>
      </body>
    </html>
  );
}

