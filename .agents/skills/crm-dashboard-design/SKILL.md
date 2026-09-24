---
name: crm-dashboard-design
description: How to design and build modern, professional CRM / admin / SaaS dashboard interfaces — sidebar+topbar shells, KPI/stat cards, data tables, charts, filter toolbars, status badges, pipeline/kanban boards, and record-detail pages. Use this whenever the user asks to design, build, mock up, restyle, or improve a dashboard, admin panel, back-office tool, analytics console, internal tool, control panel, or CRM screen — including Vietnamese phrasing like 'trang quản trị', 'bảng điều khiển', or 'dashboard quản lý khách hàng' — even if they only describe the data or features and never say the word 'dashboard'. Provides a dashboard-specific design token system (color, type, spacing, elevation, dark mode), ready component and page patterns with React + Tailwind code, and a copy-paste starter shell — and explains how this differs from bold, one-of-a-kind marketing-page design, since dashboards prioritize familiarity, density, and scannability over novelty.
---

# CRM / Admin Dashboard Design

Dashboards are read, not browsed. The same person opens this screen many times a day, already knows the product, and needs the current state of something — pipeline, revenue, bookings, tickets — as fast as possible. That reframes what "good design" means here: familiarity and legibility are the win condition, not novelty. If general instinct (or the frontend-design skill's push toward a bold, one-of-a-kind visual identity for marketing pages) is pulling toward something more expressive, dial it back for this kind of screen. The underlying craft discipline still applies — spacing rigor, real contrast, restraint, an accessibility floor — but the mandate to take "one aesthetic risk" does not. The bar to hit is Linear, Stripe's dashboard, Vercel, Attio, Notion: restrained, consistent, information-dense without feeling cluttered. Not a marketing page.

## The shell

Nearly every modern dashboard — CRM or otherwise — is built from the same three regions, and reusing that shape is a feature, not laziness: a returning user's spatial memory of "nav is on the left, actions are top-right" is exactly what makes a product feel fast.

```
┌────────────┬───────────────────────────────────────────┐
│  Logo      │  Page title                 [Search] [+New]│
│            ├───────────────────────────────────────────┤
│  ● Overview│   KPI    KPI    KPI    KPI                 │
│  Contacts  │  ─────────────────────────────────────────  │
│  Deals     │   Chart / trend        │  Activity feed     │
│  Reports   │                        │  or recent records │
│  Settings  │  ─────────────────────────────────────────  │
│            │   Filter bar                                │
│  Account ▾ │   Data table (sort, status, pagination)     │
└────────────┴───────────────────────────────────────────┘
```

A fixed left sidebar for primary navigation (icon + label, active state highlighted), a slim top bar for page context and global actions (search, notifications, the primary "+ New" action, account menu), and a content column beneath that composes from a small set of repeating blocks: KPI rows, chart/feed panels, filter bars, data tables. Almost every CRM screen turns out to be a different arrangement of those same blocks — see "Page patterns" below.

## Calibration: generated vs. professional

The fastest self-check before showing a dashboard to the user. AI-generated dashboards tend to over-decorate; the real professional ones are quieter than instinct suggests.

| Instinct to resist | What professional dashboards do instead |
|---|---|
| A different gradient background on every KPI card | Neutral cards, one accent color for the whole product, color reserved for meaning (status, delta direction) |
| Heavy drop shadows, glassmorphism, glow | A 1px low-contrast border does the separating; shadow is saved for real elevation — dropdowns, modals, a header stuck on scroll |
| Purple-to-blue gradient buttons and headers | One confident, flat accent color — often blue/indigo/emerald, or the product's actual brand color |
| Emoji standing in for icons | One consistent icon set (lucide-react, Heroicons), 16-20px, stroke-based |
| A centered marketing-style hero on an internal page | Left-aligned page title, one line of context, the primary action — no hero |
| Cards and gaps that are all slightly different sizes | Everything on a 4px/8px grid — see tokens below |
| Numbers that don't line up down a table column | `tabular-nums`, numeric columns right-aligned |

## Design tokens (quick reference)

Full system with light/dark values lives in `references/design-tokens.md` — read it before hand-building any color or spacing decision from scratch. Summary:

- **Neutral base**: one gray family (slate, zinc, or gray) for backgrounds, borders, and body text — pick one and use it everywhere, never mix families within a product.
- **Accent**: exactly one, used sparingly — primary buttons, the active nav item, links, focus rings. Use the product's real brand color if it has one.
- **Semantic**: success (emerald/green), warning (amber), danger (red), info (blue) — reserved for status, deltas, and alerts, never used decoratively.
- **Type**: a plain grotesque (Inter, or `system-ui`). 14px is the dominant UI size here, not 16px — dashboards run denser than marketing copy. Save large sizes (28px+) for KPI numbers only.
- **Spacing**: 4px base unit; card padding 20-24px; a "compact" density mode (tighter row height) is a common expectation in table-heavy CRMs.
- **Radius**: 8-12px for cards and inputs, full-round reserved for badges and avatars.

## Components

`references/components.md` has working React + Tailwind code — using only Tailwind's default utility classes, so it also runs inside a Claude artifact preview — for the pieces every CRM dashboard assembles from:

- Sidebar nav and top bar
- KPI / stat card, with a trend delta
- Status badge (a semantic-colored pill)
- Data table (sortable header, status column, right-aligned numbers, row hover, pagination)
- Filter toolbar (search, filter, date range)
- Chart wrapper (recharts, styled to match the token system: muted gridlines, a tooltip, one accent line or area)
- Empty state, loading skeleton, and a record drawer/modal

Read it whenever you're building any of these rather than improvising the styling fresh — the values there are chosen to stay consistent with each other and with the token system above.

## Page patterns

CRMs repeat four page archetypes far more than they invent new ones. `references/page-patterns.md` lays out the composition for each:

1. **Overview** — a KPI row, then a chart-plus-activity-feed split, then a recent-records table.
2. **List / table** (Contacts, Deals, Orders, Bookings) — title and primary action, a filter bar, the table, pagination. Saved-view tabs ("All / Mine / Won this month") are the one CRM-specific addition worth including.
3. **Record detail** (one Contact, Deal, Booking) — a header with key facts and actions, a tab bar (Activity / Notes / Files / Related), a two-column body: main content plus a summary sidebar.
4. **Pipeline / kanban** (deals by stage) — horizontally scrolling stage columns, each with a count and a total value in its header, and compact record cards.

## Building it

Default to React + Tailwind CSS, `lucide-react` for icons, and `recharts` for charts unless the user's project already uses something else — a common real-world stack for this category, and directly usable in a Claude artifact preview. If they're on Vue, plain HTML, Flutter web, or anything else, the anatomy, tokens, and patterns above still apply; only the implementation syntax changes.

If the target project already has shadcn/ui installed, prefer its `Table`, `Badge`, `Card`, `DropdownMenu`, and `Dialog` primitives over hand-rolled markup — a large share of the dashboards this skill is modeled on are built on exactly that foundation. Otherwise the plain-Tailwind patterns in `references/components.md` degrade gracefully with no extra dependency.

Keep example and placeholder code restricted to Tailwind's default classes (`w-64`, not an arbitrary `w-[262px]`; `bg-slate-50`, not a raw hex) so the same code works both in a real project and when prototyping inside a Claude artifact, which can't compile arbitrary-value classes.

## Dark mode and responsiveness

Dark mode is close to a baseline expectation for this category now, not a bonus feature — plan the neutral scale so it inverts cleanly (see `references/design-tokens.md`) instead of bolting it on afterward. Below roughly 1024px, collapse the sidebar to icons-only or an off-canvas drawer; below roughly 640px, let tables become a stacked card list or scroll horizontally rather than compressing columns until they're unreadable.

## Vietnamese-market details

Worth checking whenever the product targets Vietnamese users:

- Currency: `12.500.000 ₫` — a period as the thousands separator, the symbol after the amount, comma reserved for decimals (rarely used for VNĐ at all).
- Vietnamese labels run longer than their English equivalents ("Người phụ trách" vs. "Owner") — give table headers and nav labels room, or truncate with a tooltip, rather than letting them wrap and break row height.
- Inter and most `system-ui` stacks render Vietnamese diacritics cleanly. Be Vietnam Pro is a solid Vietnamese-designed alternative if the brief wants something more distinctive for a logo or wordmark.

## Before showing it to the user

Run down the calibration table once more against what actually got built. Check that every card, gap, and radius traces back to the token system rather than a one-off value, that the accent color shows up exactly once as "the" accent rather than competing with two or three others, and that a data-heavy screen still has generous whitespace around the dense parts even though it's tight within them — density in the table, room to breathe around it.
