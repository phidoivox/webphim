# Nâng cấp Next.js Frontend lên phiên bản mới nhất an toàn

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp frontend Next.js từ v16.3.0 lên phiên bản v16.3.5 (bản phát hành ổn định `latest` mới nhất trên npm registry, an toàn, không dùng canary/preview).

**Architecture:** Giữ nguyên kiến trúc Next.js App Router hiện tại. Cập nhật `next` và `eslint-config-next` đồng bộ lên `16.3.5`, chạy `pnpm install` để khóa lockfile và xác thực bằng `pnpm build`.

**Tech Stack:** Next.js 16.3.5, React 19, TypeScript 5, pnpm 11.20.0.

**Spec:** Nâng cấp an toàn theo yêu cầu người dùng, giữ tương thích với toàn bộ hệ thống frontend hiện tại.

## Global Constraints

- Không dùng bản `canary` (v16.4.0-canary.28) hay `preview` để đảm bảo tính ổn định production.
- Đồng bộ phiên bản giữa `next` và `eslint-config-next`.
- Sử dụng đúng package manager `pnpm` trong thư mục `frontend`.

---

### Task 1: Cập nhật package.json và cài đặt dependencies mới

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/pnpm-lock.yaml`

**Interfaces:**
- Consumes: `next@16.3.5`, `eslint-config-next@16.3.5` từ npm registry.
- Produces: `frontend/pnpm-lock.yaml` đã cập nhật.

- [x] **Step 1: Cập nhật version trong frontend/package.json**

Thay đổi `"next": "16.3.0"` thành `"next": "16.3.5"`, và `"eslint-config-next": "16.3.0"` thành `"eslint-config-next": "16.3.5"`.

- [x] **Step 2: Chạy pnpm install**

Run: `pnpm --dir frontend install`
Expected: pnpm cài đặt thành công, cập nhật node_modules và pnpm-lock.yaml.

- [x] **Step 3: Kiểm tra phiên bản sau cài đặt**

Run: `pnpm --dir frontend exec next --version`
Expected: Output hiển thị `Next.js v16.3.5`.

---

### Task 2: Build verification

**Files:**
- Test: `frontend` build output

- [x] **Step 1: Xóa cache build cũ**

Run: `pnpm --dir frontend run clean`
Expected: Thư mục `.next` được xóa sạch.

- [x] **Step 2: Chạy build production để xác thực tương thích**

Run: `pnpm --dir frontend run build`
Expected: Build thành công (exit code 0), compile Turbopack và prerender static/dynamic pages không có lỗi cú pháp hay breaking changes.
