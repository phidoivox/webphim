# Kế hoạch Triển khai: Video Trailer Hero Banner Chuẩn Netflix (Tối ưu Hiệu năng & Công nghệ Hiện đại)

**Goal:** Tích hợp tính năng tự động phát video trailer sau 2 giây ở Hero Banner giống Netflix với hiệu năng tối ưu nhất.

**Architecture:** Next.js 16 (App Router), React 19 Client Component, IntersectionObserver API, Page Visibility API, YouTube Iframe postMessage Audio Control, GPU-accelerated CSS Transitions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4.

---

## Các Hạng Mục Thực Hiện

- [ ] **Task 1: Xây dựng Utility Helpers** (`extractYouTubeId`, `isDirectVideoUrl`)
- [ ] **Task 2: Tích hợp IntersectionObserver & Page Visibility API trong `HeroBanner.tsx`**
- [ ] **Task 3: Triển khai 2-Second Deferred Timer & Vòng đời Playback**
- [ ] **Task 4: Xây dựng Video Background Layer với GPU Crossfade & Tỉ lệ Netflix Cover**
- [ ] **Task 5: Triển khai Zero-Reload Audio Control (Mute/UnMute via postMessage)**
- [ ] **Task 6: Thiết kế Glassmorphic Mute/Unmute Control Pill**
- [ ] **Task 7: Kiểm thử Toàn diện & Tối ưu Responsive**
