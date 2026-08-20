"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TabBar from "@/components/layout/TabBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense
        fallback={
          <header className="fixed top-0 inset-x-0 z-50 h-14 lg:h-16 bg-base/90 backdrop-blur-md border-b border-white/5" />
        }
      >
        <Header />
      </Suspense>
      <main className="flex-1 pb-14 lg:pb-0">{children}</main>
      <Footer />
      <TabBar />
    </>
  );
}
