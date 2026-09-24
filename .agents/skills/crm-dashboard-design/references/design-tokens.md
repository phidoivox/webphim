# Design Tokens — CRM / Admin Dashboard

Concrete values to build from. Pick one neutral family and stick to it across the whole product — mixing `slate` in one screen and `zinc` in another is a common tell that a dashboard was assembled from disconnected pieces rather than designed as one system.

## Color

### Neutral

Using `slate` as the default family below — `zinc` or `gray` are equally valid swaps, just be consistent.

| Role | Light mode | Dark mode |
|---|---|---|
| App background | `slate-50` `#f8fafc` | `slate-950` `#020617` |
| Card / surface | `white` `#ffffff` | `slate-900` `#0f172a` |
| Elevated surface (dropdown, modal) | `white` + `shadow-md` | `slate-800` `#1e293b` |
| Border, default | `slate-200` `#e2e8f0` | `slate-800` `#1e293b` |
| Border, needs real contrast (card on card) | `slate-300` `#cbd5e1` | `slate-700` `#334155` |
| Text, primary | `slate-900` `#0f172a` | `slate-50` `#f8fafc` |
| Text, secondary / muted | `slate-500` `#64748b` | `slate-400` `#94a3b8` |
| Text, placeholder / disabled | `slate-400` `#94a3b8` | `slate-600` `#475569` |

Dark mode is not a straight inversion — check contrast per token rather than flipping the scale mechanically. A border at `slate-800` on a `slate-950` background is nearly invisible; that pairing needs to move a step lighter than the light-mode border does.

### Accent

Pick exactly one. `indigo-600` (`#4f46e5`) or `blue-600` (`#2563eb`) are safe, extremely common defaults for this genre when the product has no brand color of its own. Use it for: primary buttons, the active nav item, links, focus rings, and the one data series in a chart that matters most. Everything else stays neutral — an accent used everywhere isn't an accent.

### Semantic

Reserved for status, deltas, and alerts — never decorative.

| Meaning | Text / icon | Background tint |
|---|---|---|
| Success / positive | `emerald-600` `#059669` (dark: `emerald-400`) | `emerald-50` (dark: `emerald-500/10`) |
| Warning / attention | `amber-600` `#d97706` (dark: `amber-400`) | `amber-50` (dark: `amber-500/10`) |
| Danger / negative | `red-600` `#dc2626` (dark: `red-400`) | `red-50` (dark: `red-500/10`) |
| Info / neutral status | `blue-600` `#2563eb` (dark: `blue-400`) | `blue-50` (dark: `blue-500/10`) |

If a dashboard's status badges, KPI arrows, and alerts are the only colorful things on the page, the eye finds them instantly. Tint a card background for decoration and that signal gets buried.

## Typography

Font: Inter or the platform's `system-ui` stack. Both cover Vietnamese diacritics cleanly.

| Role | Size | Weight | Tailwind |
|---|---|---|---|
| Caption / column label | 12px | Medium, often uppercase + tracked | `text-xs font-medium` |
| Body / default UI text | 14px | Regular | `text-sm` |
| Body, emphasized | 14px | Medium / Semibold | `text-sm font-medium` |
| Section heading | 18px | Semibold | `text-lg font-semibold` |
| Page title | 20–24px | Semibold | `text-xl font-semibold` / `text-2xl font-semibold` |
| KPI number | 28–36px | Semibold / Bold | `text-3xl font-semibold` |

14px, not 16px, is the workhorse size — this is one of the biggest tells separating a dense professional dashboard from a marketing page wearing dashboard clothes. Add `tabular-nums` to anything showing numbers that appear in a column (table cells, KPI values) so the digits line up as they change.

## Spacing

4px base unit: 4, 8, 12, 16, 20, 24, 32, 48.

- Card padding: 20–24px (`p-5` / `p-6`)
- Gap between KPI cards: 16–24px (`gap-4` / `gap-6`)
- Table cell padding: 12–16px vertical for "comfortable" density, 8–10px for "compact". A density toggle is a nice touch in any table-heavy CRM screen, not a requirement for a first pass.
- Sidebar width: `w-64` / `w-72` expanded (256–288px), `w-16` collapsed to icons only

## Radius and elevation

- Cards, inputs, buttons: `rounded-lg` to `rounded-xl` (8–12px) — modern dashboards run slightly rounder than older enterprise software's sharp corners, but stop short of pill-shaped.
- Badges, avatars, pills: `rounded-full`
- Shadow: mostly absent. Cards separate from the page with a border, not a shadow. Reserve `shadow-sm` / `shadow-md` for things genuinely floating above the page — dropdown menus, modals or drawers, a table header that's gone sticky on scroll. A shadow under every card is the single fastest way to make a dashboard look like a template.
