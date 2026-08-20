---
name: laravel-best-practices
description: Use when creating or modifying Laravel controllers, services, models, policies, form requests, or backend business logic
---

# Laravel Best Practices

## Overview
Standards and architectural guidelines for maintaining clean, testable, and scalable Laravel applications.

## Core Architectural Rules
1. **Thin Controllers, Fat Services / Actions**:
   - Controllers should only handle HTTP concerns: validate request, call service/action, return response or view.
   - Put business logic inside dedicated `app/Services` or Single-Action classes (`app/Actions`).
2. **Form Request Validation**:
   - Do not perform `$request->validate([...])` inside controllers for complex endpoints. Use dedicated `php artisan make:request <Name>Request`.
3. **API Resources (Transformers)**:
   - Always transform Model output using Eloquent API Resources (`app/Http/Resources`) instead of exposing raw models/arrays directly.
4. **Avoid N+1 Queries**:
   - Always eager-load relationships using `with(['relation'])` or `load(['relation'])`.
   - Prevent lazy loading in development: `Model::preventLazyLoading(!app()->isProduction())`.
5. **Type Hinting & Return Types**:
   - Strictly use PHP 8.2+ typed properties, parameter types, and explicit return types on methods.
