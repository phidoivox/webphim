"use client";

import React from "react";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminCommandPalette } from "@/components/admin/ui";
import { AdminProvider, useAdmin } from "@/context/AdminContext";

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const { isCommandPaletteOpen, closeCommandPalette } = useAdmin();

  return (
    <div className="flex min-h-screen bg-[#090b10] text-[#e2e8f0] font-sans antialiased">
      {/* Navigation Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <AdminHeader />
        <AdminAuthGuard>{children}</AdminAuthGuard>
      </div>

      {/* Global Command Palette Modal (Cmd+K / Ctrl+K) */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
      />
    </div>
  );
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </AdminProvider>
  );
}
