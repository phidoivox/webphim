"use client";

import React, { useEffect } from "react";
import { XIcon } from "@/components/ui/icons";

export interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeClassMap = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export default function AdminDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
  className = "",
}: AdminDrawerProps) {
  // Prevent body scroll when open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = sizeClassMap[size] || sizeClassMap.lg;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div
          className={`w-screen ${maxWidthClass} max-w-full sm:max-w-md transform bg-[#0f121a] border-l border-white/10 shadow-2xl flex flex-col transition ease-in-out duration-300 animate-in slide-in-from-right ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4.5 bg-white/[0.02]">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
              {subtitle && (
                <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              title="Đóng ngăn trượt (ESC)"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="border-t border-white/10 bg-white/[0.02] px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
