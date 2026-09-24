"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, HomeIcon, LibraryIcon, SearchIcon, UserIcon } from "@/components/ui/icons";

const TABS = [
  { href: "/", label: "Trang chủ", icon: HomeIcon },
  { href: "/the-loai", label: "Thể loại", icon: CompassIcon },
  { href: "/tim-kiem", label: "Tìm kiếm", icon: SearchIcon },
  { href: "/thu-vien", label: "Thư viện", icon: LibraryIcon },
  { href: "/ho-so", label: "Cá nhân", icon: UserIcon },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-elevated/80 bg-surface/95 backdrop-blur-lg pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden shadow-lg shadow-black/40"
      aria-label="Điều hướng mobile"
    >
      <ul className="flex items-center">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-all active:scale-95 select-none ${
                  active ? "text-accent font-bold" : "text-muted hover:text-white/80"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
