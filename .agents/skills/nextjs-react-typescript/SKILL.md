---
name: nextjs-react-typescript
description: Use when writing or modifying Next.js App Router pages, layouts, server components, client components, API routes, or TypeScript types
---

# Next.js, React & TypeScript Best Practices

## Overview
Standards for Next.js App Router applications with TypeScript and strict type safety.

## Server vs Client Components
* **Default to React Server Components (RSC)**: Keep components on the server for data fetching, SEO, and reduced client JavaScript bundle.
* **Use `'use client'` Directive Only When**:
  - Utilizing React hooks (`useState`, `useEffect`, `useCallback`, etc.).
  - Listening to DOM events (`onClick`, `onChange`, `onKeyDown`).
  - Accessing browser APIs (`window`, `localStorage`, `navigator`, HLS/Video player APIs).

## Data Fetching & Caching
* Use `fetch(url, { next: { revalidate: 3600 } })` for ISR or `{ cache: 'no-store' }` for dynamic server rendering.
* Implement error boundaries (`error.tsx`) and loading skeletons (`loading.tsx`) for route segments.

## TypeScript Standards
* Avoid `any` - define explicit types/interfaces.
* Use strict type checking for API response schemas and component props.
