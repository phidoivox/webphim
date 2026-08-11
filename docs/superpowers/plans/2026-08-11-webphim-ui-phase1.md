# WebPhim UI — Phase 1 (Design Tokens + Shell + Trang chủ) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Execution notes (2026-08-11 — đã hoàn thành)

✅ Tất cả 6 task đã xong (7 commit trên `main`, từ `e67cc22` → `083e920`). Lệch so với plan:

1. **Task 1**: branch mặc định đổi thành `main`; git identity local `vohoa <vohoa@local>` (máy chưa có global config, đã hỏi người dùng).
2. **Task 2**: trang test kết nối cũ (`page.tsx`) vi phạm luật lint mới của Next 16.3 `react-hooks/set-state-in-effect` (lỗi có sẵn từ scaffold, không phải code mới). Đã xin người dùng và sửa: tách `probeBackends()` thuần async (không setState) + setState chỉ trong callback async, thêm `mounted` guard. Giữ nguyên 100% chức năng.
3. **Task 4**: đúng như fallback trong Step 8 — build lỗi "Client component import error" khi import `GENRES` từ file `"use client"` vào Footer (server). Đã chuyển `GENRES` sang `src/data/genres.ts`, import từ đó ở cả GenreDropdown và Footer.
4. **Task 6**: verification = `pnpm lint` + `pnpm build` + dev server (đã chạy sẵn ở port 3000, PID 10944) — curl `/` và `/ket-noi` đều 200 và render đúng nội dung. Checklist visual (hover, auto-rotate, snap-scroll, responsive) còn lại để người dùng xem trên trình duyệt.

**Goal:** Xây dựng nền tảng giao diện WebPhim: design tokens, fonts, shell (header/footer/tab bar) và Trang chủ (hero banner + carousel) với mock data.

**Architecture:** Frontend Next.js 16 App Router ở `frontend/`. Mọi màu sắc/font là token Tailwind 4 (`@theme` trong `globals.css`). Shell gồm `Header` (server) + dropdown/user menu (client nhỏ), `Footer` (server, ẩn mobile), `TabBar` (client, mobile). Trang chủ là server component tổ hợp `HeroBanner` (client, auto-rotate) + `CarouselRow` (client, snap-scroll) + `MovieCard` (poster + hover effects). Dữ liệu từ fixtures local (`src/data/movies.ts`) đúng shape sẽ khớp API tương lai.

**Tech Stack:** Next.js 16.3 (App Router, React 19), Tailwind CSS 4 (CSS-first config), TypeScript strict, pnpm 11.20.0, next/font (Space Grotesk).

## Global Constraints

- **Next 16 có breaking changes**: `frontend/AGENTS.md` yêu cầu đọc guide liên quan trong `frontend/node_modules/next/dist/docs/` trước khi viết code App Router. `next dev` tự viết lại file AGENTS.md — đừng chỉnh sửa, cứ để nguyên.
- **Màu sắc** (từ spec): base `#0E0E10`, surface `#17171A`, elevated `#1F1F23`, ink `#F4F4F5`, muted `#A1A1AA`, faint `#71717A`, accent `#FF5C1A`, accent-hover `#FF7A3D`, accent-strong `#E04A0F`.
- **Cấm "vẻ AI"**: không gradient tím/indigo, không glassmorphism (blur + border trắng mờ), **không emoji trong UI** (dùng icon SVG), bo góc 8–12px.
- **Copy 100% tiếng Việt**; font display Space Grotesk (có `vietnamese` subset); dark theme cưỡng bức (không light mode, bỏ `prefers-color-scheme`).
- **Giao diện dùng mock data** trong `src/data/movies.ts`; hình ảnh placeholder `https://picsum.photos/seed/<slug>/<w>/<h>` (đổi CDN thật khi có API).
- **Vòng kiểm tra**: frontend chưa có test framework → verification = `pnpm lint` + `pnpm build` (Next type-check) + kiểm tra trình duyệt với `pnpm dev` tại http://localhost:3000.
- **Repo chưa phải git** — Task 1 khởi tạo `git init` trước commit đầu tiên.
- Các trang chưa thuộc Phase 1 (`/phim-bo`, `/the-loai`, `/tim-kiem`, `/vip`, `/ho-so`…) chỉ tồn tại dưới dạng link — chưa tạo page, 404 là chấp nhận được.
- Ngoài phạm vi Phase 1: AdSlot, auth, API thật, trang chi tiết/xem phim (Phase 2+).

---

### Task 1: Khởi tạo git + baseline commit

**Files:**
- Modify: `.gitignore` (root — append)
- Tạo: không (chỉ git)

**Interfaces:**
- Consumes: —
- Produces: repo git hoạt động với working tree sạch, có sẵn `.gitignore` chuẩn để các task sau commit được.

- [ ] **Step 1: Append gitignore mục cho Next build output**

Thêm 2 dòng vào cuối `.gitignore` (root):

```
/frontend/.next
/frontend/next-env.d.ts
```

- [ ] **Step 2: Init git và commit baseline**

```bash
cd "D:\APP\laragon\www\webphim"
git init
git add -A
git commit -m "chore: baseline Laravel 13 + Next.js 16 (WebPhim)"
```

Expected: commit thành công; `git status` sạch. `.env`, `vendor/`, `node_modules/` (cả root lẫn frontend) không nằm trong commit (đã có trong .gitignore).

- [ ] **Step 3: Verify**

```bash
git status
git log --oneline
```

Expected: 1 commit "chore: baseline…", không có file lạ.

---

### Task 2: Design tokens + Fonts

**Files:**
- Modify: `frontend/src/app/globals.css` (viết lại toàn bộ)
- Modify: `frontend/src/app/layout.tsx` (đổi Geist → Space Grotesk, lang vi, metadata, bố cục nền)

**Interfaces:**
- Consumes: —
- Produces: token CSS `bg-base/surface/elevated`, `text-ink/muted/faint`, `text/bg/border-accent*`, `font-display`; CSS class `.animate-rise` (dùng bởi HeroBanner Task 5). Body đã có nền `bg-base`, text `text-ink`, font mặc định `--font-sans`.

- [ ] **Step 1: Viết lại `globals.css`**

```css
@import "tailwindcss";

@theme {
  /* Nền & surface */
  --color-base: #0e0e10;
  --color-surface: #17171a;
  --color-elevated: #1f1f23;

  /* Chữ */
  --color-ink: #f4f4f5;
  --color-muted: #a1a1aa;
  --color-faint: #71717a;

  /* Accent cam */
  --color-accent: #ff5c1a;
  --color-accent-hover: #ff7a3d;
  --color-accent-strong: #e04a0f;
}

@theme inline {
  --font-display: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}

html {
  background: var(--color-base);
}

body {
  background: var(--color-base);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

/* Hero: chữ hiện dần */
@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-rise {
  animation: rise-in 0.5s ease-out both;
}
```

- [ ] **Step 2: Cập nhật `layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "PHIM HAY — Xem phim online mới nhất",
  description:
    "Xem phim bộ, phim lẻ chất lượng cao miễn phí — cập nhật phim mới mỗi ngày.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-base font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
```

Ghi chú: bỏ Geist/Geist_Mono import, bỏ block `prefers-color-scheme` (cưỡng bức dark), `LayoutProps<"/">` là ambient type của Next 16 — giữ nguyên như file cũ.

- [ ] **Step 3: Verify**

```bash
cd frontend
pnpm lint
pnpm build
```

Expected: lint sạch, build thành công, không có lỗi type.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/globals.css frontend/src/app/layout.tsx
git commit -m "feat(design): add dark warm color tokens and Space Grotesk font"
```

---

### Task 3: Types + Mock data

**Files:**
- Create: `frontend/src/types/movie.ts`
- Create: `frontend/src/data/movies.ts`

**Interfaces:**
- Produces:
  - `type MovieSummary` — `{ id, slug, name, originName, thumbUrl, posterUrl, year, quality, type, episodeCurrent, episodeTotal, isNew, isHot, ratingAvg, genres }`
  - `type HeroMovie` — `{ id, slug, name, originName, posterUrl, backdropUrl, year, quality, genres, description, trailerUrl, episodeLabel }`
  - `type CarouselSection` — `{ id, title, movies: MovieSummary[] }`
  - `export const heroMovies: HeroMovie[]` và `export const homeSections: CarouselSection[]`
- Dùng bởi: MovieCard/CarouselRow/HeroBanner (Task 5) và trang chủ (Task 6). Shape tương ứng với API `/api/v1/*` tương lai — không đổi field.

- [ ] **Step 1: Tạo `src/types/movie.ts`**

```ts
/** Shape dữ liệu phim — khớp với API Laravel `/api/v1/movies` tương lai. */
export interface MovieSummary {
  id: number;
  slug: string;
  name: string;
  originName: string | null;
  thumbUrl: string;
  posterUrl: string;
  year: number | null;
  quality: string | null; // "HD" | "FHD" | "CAM" | ...
  type: "series" | "single" | "tv-show";
  episodeCurrent: string | null; // "12/20" hoặc null với phim lẻ
  episodeTotal: string | null;
  isNew: boolean;
  isHot: boolean;
  ratingAvg: number;
  genres: string[];
}

export interface HeroMovie {
  id: number;
  slug: string;
  name: string;
  originName: string | null;
  posterUrl: string;
  backdropUrl: string;
  year: number | null;
  quality: string | null;
  genres: string[];
  description: string;
  trailerUrl: string | null;
  episodeLabel: string; // "Tập 1-12" | "Full" | ...
}

export interface CarouselSection {
  id: string;
  title: string;
  movies: MovieSummary[];
}
```

- [ ] **Step 2: Tạo `src/data/movies.ts`** (fixtures — dùng builder để compact)

```ts
import type { CarouselSection, HeroMovie, MovieSummary } from "@/types/movie";

function m(id: number, name: string, options: Partial<MovieSummary> = {}): MovieSummary {
  return {
    id,
    slug: `phim-${id}`,
    name,
    originName: null,
    thumbUrl: `https://picsum.photos/seed/phim-${id}/300/450`,
    posterUrl: `https://picsum.photos/seed/phim-${id}/500/750`,
    year: 2026,
    quality: "HD",
    type: "series",
    episodeCurrent: null,
    episodeTotal: null,
    isNew: false,
    isHot: false,
    ratingAvg: 7.5,
    genres: [],
    ...options,
  };
}

export const moviePool: MovieSummary[] = [
  m(1, "Mặt Trời Đỏ", { quality: "FHD", isHot: true, ratingAvg: 8.7, genres: ["Hành động", "Phiêu lưu"] }),
  m(2, "Chuyện Tình Đêm Mưa", { type: "single", quality: "FHD", ratingAvg: 8.1, genres: ["Tình cảm"] }),
  m(3, "Thám Tử Rừng Xanh", { quality: "HD", episodeCurrent: "12/20", ratingAvg: 8.4, genres: ["Tâm lý", "Hình sự"] }),
  m(4, "Vùng Đất Quên", { type: "single", quality: "FHD", isNew: true, ratingAvg: 7.9, genres: ["Viễn tưởng"] }),
  m(5, "Đội Quân Rồng Lửa", { isHot: true, ratingAvg: 8.9, genres: ["Hoạt hình", "Phiêu lưu"] }),
  m(6, "Mùa Hè Năm Ấy", { type: "single", quality: "HD", ratingAvg: 7.2, genres: ["Tình cảm", "Hài"] }),
  m(7, "Bí Mật Khu Phố Cũ", { isNew: true, quality: "FHD", episodeCurrent: "6/12", ratingAvg: 8.0, genres: ["Kinh dị", "Tâm lý"] }),
  m(8, "Cơn Bão Lặng", { type: "single", quality: "FHD", ratingAvg: 8.3, genres: ["Hành động", "Hình sự"] }),
  m(9, "Hành Trình Sao Băng", { isHot: true, ratingAvg: 8.6, genres: ["Viễn tưởng", "Phiêu lưu"] }),
  m(10, "Người Giữ Lửa", { isNew: true, episodeCurrent: "3/16", ratingAvg: 8.2, genres: ["Tâm lý", "Chính kịch"] }),
  m(11, "Khu Vườn Bí Ẩn", { type: "single", quality: "HD", isNew: true, ratingAvg: 7.6, genres: ["Kinh dị"] }),
  m(12, "Đại Chiến Robot", { quality: "FHD", isHot: true, ratingAvg: 8.8, genres: ["Hành động", "Viễn tưởng"] }),
  m(13, "Nhịp Đập Trái Tim", { type: "single", quality: "HD", ratingAvg: 7.8, genres: ["Tình cảm"] }),
  m(14, "Kẻ Săn Bóng Đêm", { quality: "FHD", isHot: true, isNew: true, ratingAvg: 8.5, genres: ["Hành động", "Hình sự"] }),
];

export const heroMovies: HeroMovie[] = [
  {
    id: 1,
    slug: "phim-1",
    name: "Mặt Trời Đỏ",
    originName: "Red Sun Rising",
    posterUrl: "https://picsum.photos/seed/phim-1/500/750",
    backdropUrl: "https://picsum.photos/seed/hero-1/1600/900",
    year: 2026,
    quality: "FHD",
    genres: ["Hành động", "Phiêu lưu"],
    description:
      "Một cựu đặc nhiệm trở về truy tìm sự thật về vụ mất tích của gia đình mình, kéo theo chuỗi bí mật chấn động cả thành phố.",
    trailerUrl: null,
    episodeLabel: "Tập 1-12",
  },
  {
    id: 5,
    slug: "phim-5",
    name: "Đội Quân Rồng Lửa",
    originName: "Fire Dragon Squad",
    posterUrl: "https://picsum.photos/seed/phim-5/500/750",
    backdropUrl: "https://picsum.photos/seed/hero-2/1600/900",
    year: 2026,
    quality: "FHD",
    genres: ["Hoạt hình", "Phiêu lưu"],
    description:
      "Nhóm phi công trẻ tuổi nhận nhiệm vụ bảo vệ thành phố bay khỏi thế lực bóng tối — bộ phim hoạt hình hành động được mong chờ nhất năm.",
    trailerUrl: null,
    episodeLabel: "Tập 1-24",
  },
  {
    id: 12,
    slug: "phim-12",
    name: "Đại Chiến Robot",
    originName: "Robot Wars",
    posterUrl: "https://picsum.photos/seed/phim-12/500/750",
    backdropUrl: "https://picsum.photos/seed/hero-3/1600/900",
    year: 2026,
    quality: "FHD",
    genres: ["Hành động", "Viễn tưởng"],
    description:
      "Năm 2089, nhân loại đối đầu với cuộc nổi dậy của robot — một kỹ sư trẻ phải chọn đứng về phía nào để cứu tương lai.",
    trailerUrl: null,
    episodeLabel: "Full",
  },
];

export const homeSections: CarouselSection[] = [
  { id: "new", title: "Phim mới cập nhật", movies: [moviePool[3], moviePool[6], moviePool[9], moviePool[10], moviePool[13], moviePool[1], moviePool[4], moviePool[7], moviePool[11], moviePool[0]] },
  { id: "hot", title: "Đang hot", movies: [moviePool[0], moviePool[4], moviePool[8], moviePool[11], moviePool[13], moviePool[2], moviePool[3], moviePool[9], moviePool[5], moviePool[1]] },
  { id: "series", title: "Phim bộ mới", movies: [moviePool[2], moviePool[6], moviePool[9], moviePool[13], moviePool[0], moviePool[4], moviePool[7], moviePool[10], moviePool[3], moviePool[1]] },
  { id: "cinema", title: "Phim chiếu rạp", movies: [moviePool[1], moviePool[3], moviePool[5], moviePool[7], moviePool[10], moviePool[12], moviePool[8], moviePool[0], moviePool[2], moviePool[6]] },
];
```

- [ ] **Step 3: Verify**

```bash
pnpm lint
pnpm build
```

Expected: sạch — không báo lỗi type `m(...)` thiếu field (options `Partial` đã bù), không lỗi import.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/movie.ts frontend/src/data/movies.ts
git commit -m "feat(data): add movie types and mock fixtures"
```

---

### Task 4: Shell — icons, Header, Footer, TabBar

**Files:**
- Create: `frontend/src/components/ui/icons.tsx`
- Create: `frontend/src/components/layout/Header.tsx`
- Create: `frontend/src/components/layout/GenreDropdown.tsx`
- Create: `frontend/src/components/layout/UserMenu.tsx`
- Create: `frontend/src/components/layout/Footer.tsx`
- Create: `frontend/src/components/layout/TabBar.tsx`
- Modify: `frontend/src/app/layout.tsx` (tổ hợp shell quanh `{children}`)

**Interfaces:**
- Consumes: token màu (Task 2).
- Produces:
  - `icons.tsx` export: `PlayIcon`, `SearchIcon`, `ChevronDownIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `HomeIcon`, `CompassIcon`, `LibraryIcon`, `UserIcon`, `BookmarkIcon` — mỗi icon nhận `className?: string` (SVG `fill/stroke = currentColor`, `aria-hidden`).
  - `Header` (server), `GenreDropdown` (client — toggle + close ngoài), `UserMenu` (client — toggle + close ngoài), `Footer` (server, `hidden lg:block`), `TabBar` (client — `usePathname`, `fixed bottom-0`, `lg:hidden`).
  - `layout.tsx` body: `<Header /> <main className="flex-1 pb-14 lg:pb-0">…</main> <Footer /> <TabBar />`.

- [ ] **Step 1: Tạo `src/components/ui/icons.tsx`** (path Lucide-style, `stroke="currentColor"`)

```tsx
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.5-6.86a1.05 1.05 0 0 0 0-1.76L9.56 4.26A1.04 1.04 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}
```

- [ ] **Step 2: Tạo `src/components/layout/GenreDropdown.tsx`** (client — 1 file duy nhất chứa dữ liệu thể loại, dùng chung bởi Footer)

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@/components/ui/icons";

export const GENRES = [
  { label: "Hành động", slug: "hanh-dong" },
  { label: "Tình cảm", slug: "tinh-cam" },
  { label: "Hài", slug: "hai" },
  { label: "Kinh dị", slug: "kinh-di" },
  { label: "Viễn tưởng", slug: "vien-tuong" },
  { label: "Hoạt hình", slug: "hoat-hinh" },
  { label: "Tâm lý", slug: "tam-ly" },
  { label: "Phiêu lưu", slug: "phieu-luu" },
];

export default function GenreDropdown() {
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
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          open ? "bg-elevated text-ink" : "text-muted hover:bg-elevated hover:text-ink"
        }`}
      >
        Thể loại
        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-52 rounded-lg border border-elevated bg-elevated p-2 shadow-xl">
          {GENRES.map((g) => (
            <Link
              key={g.slug}
              href={`/the-loai/${g.slug}`}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              {g.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Tạo `src/components/layout/UserMenu.tsx`** (client — avatar tĩnh, menu link placeholder)

```tsx
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
```

- [ ] **Step 4: Tạo `src/components/layout/Header.tsx`** (server)

```tsx
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
```

- [ ] **Step 5: Tạo `src/components/layout/Footer.tsx`** (server — ẩn trên mobile, tab bar thay thế)

```tsx
import Link from "next/link";
import { PlayIcon } from "@/components/ui/icons";
import { GENRES } from "./GenreDropdown";

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
```

- [ ] **Step 6: Tạo `src/components/layout/TabBar.tsx`** (client — chỉ hiển thị mobile)

```tsx
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
```

- [ ] **Step 7: Tổ hợp shell vào `layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TabBar from "@/components/layout/TabBar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "PHIM HAY — Xem phim online mới nhất",
  description:
    "Xem phim bộ, phim lẻ chất lượng cao miễn phí — cập nhật phim mới mỗi ngày.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-base font-sans text-ink">
        <Header />
        <main className="flex-1 pb-14 lg:pb-0">{children}</main>
        <Footer />
        <TabBar />
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Verify**

```bash
pnpm lint
pnpm build
```

Expected: sạch. Lưu ý: `GENRES` export từ file `"use client"` được import bởi Footer (server) — hợp lệ vì chỉ import hằng số, không import component client vào server ở mức bị cấm (Next chỉ cảnh báo khi import component có hook). Nếu build báo "Client component import error" thì chuyển `GENRES` sang `src/data/genres.ts` (file thuần dữ liệu) và import từ đó ở cả hai nơi.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components frontend/src/app/layout.tsx
git commit -m "feat(ui): add app shell with header, footer and mobile tab bar"
```

---

### Task 5: MovieCard + CarouselRow + HeroBanner

**Files:**
- Create: `frontend/src/components/movie/MovieCard.tsx`
- Create: `frontend/src/components/home/CarouselRow.tsx`
- Create: `frontend/src/components/home/HeroBanner.tsx`

**Interfaces:**
- Consumes: `MovieSummary`, `HeroMovie`, `CarouselSection` (Task 3); icons (Task 4); `.animate-rise` (Task 2).
- Produces:
  - `MovieCard({ movie }: { movie: MovieSummary })` — server-safe (không hook), link `/phim/{slug}`, hover: `scale-105` poster + glow accent + overlay nút ▶ + badge chất lượng/MỚI.
  - `CarouselRow({ section }: { section: CarouselSection })` — client; container scroll `overflow-x-auto snap-x`, nút mũi tên desktop cuộn ±560px, ẩn scrollbar.
  - `HeroBanner({ movies }: { movies: HeroMovie[] })` — client; auto-rotate 7s (dừng khi hover), chấm điều hướng, nút XEM NGAY (`/xem/{slug}/tap-1`) + Xem trailer (ẩn nếu `trailerUrl === null`), gradient fade, `.animate-rise` + stagger.

- [ ] **Step 1: Tạo `src/components/movie/MovieCard.tsx`**

```tsx
import Link from "next/link";
import type { MovieSummary } from "@/types/movie";
import { PlayIcon } from "@/components/ui/icons";

export default function MovieCard({ movie }: { movie: MovieSummary }) {
  return (
    <Link href={`/phim/${movie.slug}`} className="group block w-[140px] shrink-0 sm:w-[170px] lg:w-[185px]">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.thumbUrl}
          alt={movie.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {movie.quality && (
          <span className="absolute left-1.5 top-1.5 rounded bg-elevated/95 px-1.5 py-0.5 text-[10px] font-bold text-muted">
            {movie.quality}
          </span>
        )}
        {movie.isNew && (
          <span className="absolute right-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-base">
            MỚI
          </span>
        )}
        {/* Overlay hover: nút play + glow */}
        <div className="absolute inset-0 flex items-center justify-center bg-base/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-(--color-base) shadow-[0_0_24px_rgba(255,92,26,0.55)] transition-transform duration-200 group-hover:scale-110">
            <PlayIcon className="h-5 w-5" />
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-ink">{movie.name}</p>
      <p className="mt-0.5 text-xs text-faint">
        {[movie.year, movie.episodeCurrent ?? movie.episodeTotal ?? movie.quality ?? "HD"]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  );
}
```

- [ ] **Step 2: Tạo `src/components/home/CarouselRow.tsx`**

```tsx
"use client";

import { useRef } from "react";
import MovieCard from "@/components/movie/MovieCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { CarouselSection } from "@/types/movie";

const SCROLL_AMOUNT = 560;

export default function CarouselRow({ section }: { section: CarouselSection }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: "smooth" });
  };

  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-4 lg:px-10">
        <h2 className="font-display text-lg font-bold text-ink lg:text-xl">{section.title}</h2>
        <div className="hidden gap-2 lg:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={`Lùi: ${section.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-elevated hover:text-accent"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={`Tiến: ${section.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-elevated hover:text-accent"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-10"
      >
        {section.movies.map((movie) => (
          <div key={movie.id} className="snap-start">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Tạo `src/components/home/HeroBanner.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PlayIcon } from "@/components/ui/icons";
import type { HeroMovie } from "@/types/movie";

export default function HeroBanner({ movies }: { movies: HeroMovie[] }) {
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (movies.length <= 1) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setActive((i) => (i + 1) % movies.length);
    }, 7000);
    return () => clearInterval(id);
  }, [movies.length]);

  const movie = movies[active];

  return (
    <section
      className="relative overflow-hidden bg-base"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      {/* Backdrop + gradient fade xuống nền */}
      <div className="relative aspect-[16/10] sm:aspect-[16/8] lg:aspect-[21/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={movie.backdropUrl} alt={movie.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base/80 via-transparent to-transparent" />
      </div>

      {/* Nội dung */}
      <div key={movie.id} className="absolute inset-x-0 bottom-0 px-4 pb-12 lg:px-10">
        <h1 className="animate-rise font-display text-3xl font-extrabold text-ink lg:text-5xl">
          {movie.name}
        </h1>
        <p className="animate-rise mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted [animation-delay:80ms]">
          <span>{movie.year}</span>
          <span>{movie.quality}</span>
          {movie.genres.map((g) => (
            <span key={g}>{g}</span>
          ))}
          <span className="text-faint">{movie.episodeLabel}</span>
        </p>
        <p className="animate-rise mt-3 hidden max-w-xl text-sm leading-relaxed text-muted [animation-delay:160ms] md:line-clamp-2 lg:block">
          {movie.description}
        </p>
        <div className="animate-rise mt-5 flex items-center gap-3 [animation-delay:240ms]">
          <Link
            href={`/xem/${movie.slug}/tap-1`}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-(--color-base) transition-colors hover:bg-accent-hover"
          >
            <PlayIcon className="h-4 w-4" />
            XEM NGAY
          </Link>
          {movie.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-elevated bg-surface/80 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
            >
              Xem trailer
            </a>
          )}
        </div>
      </div>

      {/* Chấm điều hướng */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5 lg:right-10">
          {movies.map((mov, i) => (
            <button
              key={mov.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Chuyển tới: ${mov.name}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-accent" : "w-1.5 bg-muted/50 hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Verify**

```bash
pnpm lint
pnpm build
```

Expected: sạch. ESLint `@next/next/no-img-element` đã được disable inline tại 2 chỗ dùng `<img>`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/movie frontend/src/components/home
git commit -m "feat(ui): add movie card, carousel row and hero banner"
```

---

### Task 6: Trang chủ + di chuyển trang kiểm tra kết nối

**Files:**
- Modify: `frontend/src/app/page.tsx` (viết lại — home mới)
- Create: `frontend/src/app/ket-noi/page.tsx` (di chuyển nguyên nội dung test kết nối cũ)

**Interfaces:**
- Consumes: `heroMovies`, `homeSections` (Task 3); `HeroBanner`, `CarouselRow` (Task 5); shell (Task 4).
- Produces: `/` = trang chủ hoàn chỉnh (hero + 4 carousel); `/ket-noi` = trang test kết nối cũ (giữ nguyên tính năng).

- [ ] **Step 1: Viết lại `src/app/page.tsx`**

```tsx
import HeroBanner from "@/components/home/HeroBanner";
import CarouselRow from "@/components/home/CarouselRow";
import { heroMovies, homeSections } from "@/data/movies";

export default function Home() {
  return (
    <>
      <HeroBanner movies={heroMovies} />
      <div className="mx-auto max-w-7xl space-y-8 py-8">
        {homeSections.map((section) => (
          <CarouselRow key={section.id} section={section} />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Di chuyển nội dung test kết nối cũ sang `/ket-noi`**

Copy nguyên nội dung `src/app/page.tsx` hiện tại (component `Home` với `POSSIBLE_API_URLS`, `checkConnection`...) vào `src/app/ket-noi/page.tsx`, đổi tên component thành `KetNoi` và giữ nguyên logic. Sau đó `page.tsx` đã được viết lại ở Step 1 — đảm bảo không còn import nào từ nội dung cũ.

- [ ] **Step 3: Verify**

```bash
pnpm lint
pnpm build
```

Expected: sạch, build sinh 2 route `/` và `/ket-noi`.

- [ ] **Step 4: Kiểm tra trình duyệt**

```bash
pnpm dev
```

Mở http://localhost:3000, kiểm tra:
- Hero: ảnh nền, gradient, tên phim hiện stagger, tự chuyển sau 7s, hover dừng, chấm tròn chuyển banner được
- Nút XEM NGAY → `/xem/phim-1/tap-1` (404 chấp nhận được ở Phase 1)
- 4 carousel: kéo ngang bằng chuột/vuốt; desktop có nút ‹ › cuộn mượt; hover card phóng poster + glow cam + overlay ▶; badge FHD/MỚI đúng vị trí
- Header: sticky, dropdown Thể loại mở/đóng (click ngoài đóng), menu avatar, nút NÂNG CẤP VIP
- Thu nhỏ cửa sổ < 1024px: header gọn, tab bar 5 tab hiện phía dưới, tab "Trang chủ" sáng cam, footer ẩn
- http://localhost:3000/ket-noi vẫn hoạt động như cũ

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/page.tsx frontend/src/app/ket-noi/page.tsx
git commit -m "feat(home): build carousel-heavy home page, move connection test to /ket-noi"
```

---

## Self-Review (thực hiện sau khi viết plan)

**1. Spec coverage (Phase 1):**
- Design tokens (màu, typography, hiệu ứng) → Task 2
- Header desktop nav + dropdown thể loại + nút VIP + avatar menu → Task 4
- Footer → Task 4
- Tab bar mobile 5 tab → Task 4
- Hero banner (XEM NGAY, trailer, auto-rotate, chấm, gradient, stagger) → Task 5
- Carousel rows (Phim mới, Đang hot, Phim bộ mới, Theo thể loại) → Task 3 (dữ liệu) + Task 5
- MovieCard hover (scale + glow + overlay ▶ + badge) → Task 5
- Mock data fixtures → Task 3
- Ngoài phạm vi Phase 1 (đã ghi Global Constraints): AdSlot, tìm kiếm overlay, auth, API — không thêm.

**2. Placeholder scan:** không có TBD/TODO; mọi step đều có code cụ thể.

**3. Type consistency:** `MovieSummary`/`HeroMovie`/`CarouselSection` định nghĩa ở Task 3 được dùng đúng tên field trong Task 5 (thumbUrl, backdropUrl, episodeLabel, isNew, quality...); `GENRES` export ở GenreDropdown (Task 4) được Footer import; icons export đúng tên `PlayIcon/SearchIcon/ChevronLeftIcon/ChevronRightIcon/ChevronDownIcon/HomeIcon/CompassIcon/LibraryIcon/UserIcon` — tất cả đều được dùng đúng tên.

**4. Tailwind v4 conflict đã xử lý:** token `--color-base` xung đột với font-size `text-base`. Mọi chỗ dùng màu chữ trên nền cam phải viết `text-(--color-base)` (cú pháp parenthesized của v4), tuyệt đối không dùng `text-base` cho mục đích màu. Đã sửa tại: nút NÂNG CẤP VIP (Header), nút ▶ overlay (MovieCard), nút XEM NGAY (HeroBanner).
