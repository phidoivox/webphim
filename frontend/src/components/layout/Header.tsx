import Link from "next/link";
import { PlayIcon, SearchIcon } from "@/components/ui/icons";
import GenreDropdown from "./GenreDropdown";
import UserMenu from "./UserMenu";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/quoc-gia", label: "Quốc gia" },
  { href: "/phim-bo", label: "Phim bộ" },
  { href: "/phim-le", label: "Phim lẻ" },
  { href: "/sap-chieu", label: "Sắp chiếu" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-elevated bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-5 px-4 lg:h-16 lg:px-10">
        <Link href="/" className="flex items-center gap-1.5 font-display text-lg font-extrabold tracking-tight text-ink lg:text-xl">
          <PlayIcon className="h-5 w-5 text-accent" />
          PHIM HAY
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <GenreDropdown />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/tim-kiem"
            aria-label="Tìm kiếm"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-ink"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/vip"
            className="hidden rounded-lg border border-accent px-3 py-1.5 text-xs font-bold text-(--color-base) transition-colors hover:bg-accent lg:inline-block"
          >
            NÂNG CẤP VIP
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
