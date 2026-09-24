# Page Patterns — CRM Dashboard

Four archetypes cover nearly everything a CRM asks for. Compose each from the pieces in `components.md`.

## 1. Overview / Home

```
Page title "Overview"                          [This month ▾]
┌─────────┬─────────┬─────────┬─────────┐
│  KPI    │  KPI    │  KPI    │  KPI    │
└─────────┴─────────┴─────────┴─────────┘
┌───────────────────────────┬───────────┐
│  Revenue chart             │ Activity  │
│                             │ feed      │
│                             │ (list)    │
└───────────────────────────┴───────────┘
Recent deals / recent bookings (table, 5-10 rows, "View all" link)
```

Three or four KPI cards is the right count — more than that and none of them reads as the headline number. The chart-plus-feed split (roughly 65/35) earns its place over one wide chart: the feed gives the page something that updates in near-real-time (new leads, recent activity), so the screen doesn't feel static between visits.

## 2. List / table page

```
Page title "Deals"                              [+ New deal]
[All] [My deals] [Won this month]           ← saved-view tabs
[Search...] [Filter ▾] [Date range ▾]
┌─────────────────────────────────────────────┐
│ Name          Status      Value      Owner   │
│ ...           ...         ...        ...     │
└─────────────────────────────────────────────┘
Page 1 of 12                    [Previous] [Next]
```

This is the page a CRM user lives in. Saved-view tabs are the one addition worth the effort over a generic data table — "My deals" and a couple of the most common filtered views, surfaced as tabs rather than buried in a filter dropdown, save the user from rebuilding the same filter every visit. Keep the primary action ("+ New") top-right, consistently, across every list page in the product — that consistency is part of what makes navigation feel automatic after the first few uses.

## 3. Record detail

```
← Deals
┌─────────────────────────────────────────────┐
│ Acme Corp — 42.000.000 ₫           [Edit][⋯] │
│ Status: Negotiation  Owner: Hoàng  Close: Oct 3│
├─────────────────────────────────────────────┤
│ [Activity] [Notes] [Files] [Related]          │
├───────────────────────────────┬─────────────┤
│  Timeline / activity feed      │ Summary      │
│  (main content, ~65%)          │ sidebar      │
│                                 │ (~35%)       │
│                                 │ key facts,   │
│                                 │ related      │
│                                 │ records      │
└───────────────────────────────┴─────────────┘
```

The header carries everything someone glances at before reading further: name, the one number that matters (deal value, order total, booking dates), status, owner. Tabs split content that would otherwise force a long scroll — Activity is usually the default tab, since "what happened here" is the most common question when someone opens a record. The summary sidebar holds structured key-value fields and links to related records (the contact behind this deal, the property behind this booking) rather than duplicating them in the main column.

## 4. Pipeline / kanban

```
┌ New (12) ┬ Contacted (8) ┬ Negotiation (5) ┬ Won (3) ┐
│ 45.0tr   │ 38.0tr        │ 92.0tr          │ 61.0tr  │
│ ┌──────┐ │ ┌──────┐      │ ┌──────┐        │┌──────┐ │
│ │ card │ │ │ card │      │ │ card │        ││ card │ │
│ └──────┘ │ └──────┘      │ └──────┘        │└──────┘ │
│   +      │   +           │   +             │  +      │
└──────────┴───────────────┴─────────────────┴─────────┘
```

Each column header carries a count and a total value — that total is often the single most-checked number on the page, so don't bury it inside the cards. Cards themselves stay compact: name, value, an avatar for the owner, maybe one status chip. A kanban card is a summary that opens the record-detail page on click, not a place to repeat everything from that page. Horizontal scroll for the column row is normal and expected once there are more than four or five stages; don't compress columns to force-fit them before that becomes necessary.
