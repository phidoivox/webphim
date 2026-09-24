---
name: frontend-state-and-component
description: Use when creating or refactoring frontend components, UI building blocks, component state, or custom hooks
---

# Frontend State & Component Architecture

## Overview
Guidelines for building modular, reusable, accessible, and performant UI components.

## Core Rules
1. **Component Modularity**:
   - Follow Single Responsibility Principle. Decompose large components (>150 lines) into smaller sub-components.
2. **Explicit Props & TypeScript Interfaces**:
   - Define clear interfaces for all component props. Avoid `any`.
3. **State Colocation**:
   - Keep state as close to where it is used as possible. Lift state up only when necessary.
4. **Controlled vs Uncontrolled**:
   - Prefer controlled components for form inputs and modals with explicit `onChange` / `onOpenChange` handlers.
