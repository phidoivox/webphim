---
name: laravel-database-expert
description: Use when creating or altering database migrations, writing Eloquent/QueryBuilder queries, optimizing indexes, seeders, or factories
---

# Laravel Database Expert

## Overview
Guidelines for designing robust database schemas, efficient indexing, safe migrations, and optimal Eloquent queries.

## Migration & Schema Rules
1. **Safe Migrations**:
   - Always provide an explicit `down()` method that safely reverses the `up()` method.
   - For foreign keys, use `$table->foreignId('user_id')->constrained()->cascadeOnDelete()`.
2. **Indexing Strategy**:
   - Add indexes on columns frequently used in `WHERE`, `ORDER BY`, and foreign keys (e.g., `slug`, `status`, `published_at`).
   - Use composite indexes for queries filtering across multiple columns simultaneously.
3. **Database Transactions**:
   - Always wrap multi-step writes/updates in `DB::transaction(function () { ... });` to ensure data integrity.
4. **Chunking & Cursor**:
   - For processing large datasets, avoid `get()`/`all()`. Use `chunk()`, `chunkById()`, or `cursor()` to prevent memory exhaustion.
