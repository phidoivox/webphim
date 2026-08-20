"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AdminContextType {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCollapsed: () => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  pendingReportsCount: number;
  setPendingReportsCount: React.Dispatch<React.SetStateAction<number>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);

  // Load sidebar collapsed state from localStorage after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wp_admin_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  // Save sidebar collapsed state to localStorage
  const handleSetIsCollapsed: React.Dispatch<React.SetStateAction<boolean>> = (
    value
  ) => {
    setIsCollapsed((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem("wp_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleCollapsed = () => {
    handleSetIsCollapsed((prev) => !prev);
  };

  const openCommandPalette = () => setIsCommandPaletteOpen(true);
  const closeCommandPalette = () => setIsCommandPaletteOpen(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed: handleSetIsCollapsed,
        toggleCollapsed,
        isMobileNavOpen,
        setIsMobileNavOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        pendingReportsCount,
        setPendingReportsCount,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
