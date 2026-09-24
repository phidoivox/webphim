---
name: backend-caching-redis
description: Use when implementing cache layers, Redis keys, cache invalidation, cache tagging, or session/queue optimization
---

# Backend Caching & Redis

## Overview
Patterns for caching database queries, API responses, rate limits, and handling cache invalidation safely.

## Key Patterns
1. **Cache Remember Pattern**:
   ```php
   Cache::remember("movie:slug:{$slug}", now()->addHours(6), function () use ($slug) {
       return Movie::with(['episodes', 'categories'])->where('slug', $slug)->firstOrFail();
   });
   ```
2. **Cache Key Naming Convention**:
   - Format: `<entity>:<identifier>:<variant>` (e.g., `movies:list:page:1`, `movie:id:42:details`).
3. **Cache Invalidation (Observer / Events)**:
   - Invalidate or flush corresponding cache keys upon `saved()`, `updated()`, or `deleted()` model events.
4. **Cache Tags (Redis/Memcached)**:
   - Group related caches with tags for batch invalidation: `Cache::tags(['movies', 'categories'])->flush();`.
