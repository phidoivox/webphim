"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FilmIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TvIcon,
} from "@/components/ui/icons";

interface AuthCardProps {
  mode: "login" | "register";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({
  mode,
  title,
  subtitle,
  children,
}: AuthCardProps) {
  const pathname = usePathname();

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-full -translate-x-1/2 bg-gradient-to-b from-accent/15 via-accent/5 to-transparent blur-3xl" />

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#121216]/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl grid lg:grid-cols-12 min-h-[640px]">
        {/* LEFT COLUMN: Cinematic Showcase (Visible on Large Screens) */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-[#18181f] via-[#131317] to-[#0c0c0e] border-r border-white/10 overflow-hidden">
          {/* Subtle background decorative shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-2xl font-black tracking-tight text-ink transition hover:opacity-90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/30">
                <PlayIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-none font-bold">PHIM HAY</span>
                <span className="text-[10px] font-medium text-white/40 tracking-widest uppercase mt-0.5">
                  Cinema Streaming
                </span>
              </div>
            </Link>

            <div className="mt-12 space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                <SparklesIcon className="h-3.5 w-3.5" />
                <span>Trải nghiệm điện ảnh đỉnh cao</span>
              </div>
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white font-display leading-snug">
                Kho Phim Không Giới Hạn Chuẩn 4K & Dolby Atmos
              </h2>
              <p className="text-xs xl:text-sm text-white/60 leading-relaxed">
                Đăng nhập để đồng bộ tiến trình xem, lưu tủ phim yêu thích và mở khóa các đặc quyền giải trí không giới hạn.
              </p>
            </div>
          </div>

          {/* Center Features List */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 transition hover:bg-white/[0.06]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
                <FilmIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">10,000+ Phim bom tấn</div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Phim chiếu rạp, phim bộ hot, Anime cập nhật mỗi ngày.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 transition hover:bg-white/[0.06]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
                <TvIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Đồng bộ đa nền tảng</div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Xem mượt mà trên TV, Điện thoại, Máy tính không ngắt quãng.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Guarantee */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-white/40 border-t border-white/10 pt-4">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
            <span>Mã hóa bảo mật tài khoản chuẩn SHA-256</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Auth Terminal */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          <div>
            {/* Mobile Header Logo */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-display text-xl font-bold text-ink"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
                  <PlayIcon className="h-4 w-4" />
                </div>
                <span>PHIM HAY</span>
              </Link>
            </div>

            {/* Segment Tab Controller (Đăng nhập / Đăng ký) */}
            <div className="mb-8 flex rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-md">
              <Link
                href="/dang-nhap"
                className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-accent text-white shadow-lg shadow-accent/25"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Đăng nhập
              </Link>
              <Link
                href="/dang-ky"
                className={`flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-accent text-white shadow-lg shadow-accent/25"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Tạo tài khoản
              </Link>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-xs sm:text-sm text-white/55">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Slot */}
            <div>{children}</div>
          </div>

          {/* Policy & Terms Footer */}
          <div className="mt-8 border-t border-white/10 pt-4 text-center text-[11px] text-white/40">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <Link href="/dieu-khoan" className="text-white/60 hover:underline">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="/quyen-rieng-tu" className="text-white/60 hover:underline">
              Chính sách bảo mật
            </Link>{" "}
            của WebPhim.
          </div>
        </div>
      </div>
    </div>
  );
}
