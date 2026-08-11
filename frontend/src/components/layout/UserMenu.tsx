"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserIcon } from "@/components/ui/icons";

const LINKS = [
  { href: "/ho-so", label: "Hồ sơ" },
  { href: "/thu-vien", label: "Thư viện" },
  { href: "/lich-su", label: "Lịch sử xem" },
  { href: "/vip", label: "Nâng cấp VIP" },
  { href: "/dang-xuat", label: "Đăng xuất" },
];

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu người dùng"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-muted transition-colors hover:text-ink"
      >
        <UserIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-elevated bg-elevated p-2 shadow-xl">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
