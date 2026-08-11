import Link from "next/link";
import { PlayIcon } from "@/components/ui/icons";
import { GENRES } from "@/data/genres";

export default function Footer() {
  return (
    <footer className="hidden border-t border-elevated bg-surface lg:block">
      <div className="mx-auto grid max-w-7xl gap-10 px-10 py-10 md:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-1.5 font-display text-lg font-extrabold text-ink">
            <PlayIcon className="h-5 w-5 text-accent" />
            PHIM HAY
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Trang xem phim online miễn phí, cập nhật phim bộ, phim lẻ mới nhất mỗi ngày — chất lượng HD, phụ đề tiếng Việt.
          </p>
        </div>
        <nav aria-label="Thể loại phổ biến">
          <h3 className="text-sm font-bold text-ink">Thể loại phổ biến</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted">
            {GENRES.map((g) => (
              <li key={g.slug}>
                <Link href={`/the-loai/${g.slug}`} className="transition-colors hover:text-accent">
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Liên kết">
          <h3 className="text-sm font-bold text-ink">Liên kết</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/vip" className="transition-colors hover:text-accent">Nâng cấp VIP</Link>
            </li>
            <li>
              <Link href="/ket-noi" className="transition-colors hover:text-accent">Kiểm tra kết nối</Link>
            </li>
            <li>
              <Link href="/chinh-sach" className="transition-colors hover:text-accent">Chính sách bảo mật</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-elevated py-4 text-center text-xs text-faint">
        © 2026 PHIM HAY. Mọi nội dung chỉ phục vụ mục đích giải trí.
      </div>
    </footer>
  );
}
