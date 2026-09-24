---
name: responsive-web-design
description: Use when designing or styling responsive layouts, mobile-first CSS, Tailwind breakpoints, grid/flex layouts, or touch interfaces
---

# Responsive Web Design

## Overview
Standards for building responsive, adaptive, mobile-first web layouts with Tailwind CSS.

## Breakpoint Hierarchy (Mobile-First)
* Default (`<640px`): Mobile devices (single column, touch-friendly touch targets min 44x44px).
* `sm:` (`>=640px`): Large phones / small tablets.
* `md:` (`>=768px`): Tablets / portrait view.
* `lg:` (`>=1024px`): Laptops / desktop layouts (multi-column grids, sidebar navigation).
* `xl:` (`>=1280px`) / `2xl:` (`>=1536px`): Wide desktop screens (max container width bounds).

## Video & Media Rules
* Maintain aspect ratio for movie posters (`aspect-[2/3]`) and video player containers (`aspect-video`).
* Ensure text legibility with adequate padding, readable line lengths, and avoid horizontal overflow/scrolling.
