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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-elevated bg-surface lg:hidden" aria-label="Điều hướng mobile">
      <ul className="flex">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
