# Components — CRM / Admin Dashboard

React + Tailwind, using only Tailwind's default utility classes (no arbitrary `[value]` classes) so every snippet below also runs unmodified inside a Claude artifact preview. Treat these as starting points to adapt, not code to paste blindly — real data shapes and interactions will differ per project. Colors and sizes follow `design-tokens.md`; swap `indigo` for the product's real accent if it has one.

## Sidebar nav

```jsx
import { LayoutDashboard, Users, Briefcase, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Users, label: 'Contacts' },
  { icon: Briefcase, label: 'Deals' },
  { icon: BarChart3, label: 'Reports' },
];

function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
        <div className="w-7 h-7 rounded-lg bg-indigo-600" />
        <span className="font-semibold text-slate-900">Acme CRM</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ icon: Icon, label, active }) => (
          <a
            key={label}
            href="#"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </a>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Hoàng Võ</p>
            <p className="text-xs text-slate-500 truncate">hoang@acme.vn</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

Collapse this to `w-16` with icons only (hide the `<span>`/text nodes) below roughly 1024px, or swap to an off-canvas drawer on mobile.

## Top bar

```jsx
import { Search, Bell, Plus } from 'lucide-react';

function Topbar({ title }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            placeholder="Search..."
          />
        </div>
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          <Bell className="w-5 h-5" />
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>
    </header>
  );
}
```

## KPI / stat card

```jsx
import { TrendingUp, TrendingDown } from 'lucide-react';

function KpiCard({ label, value, delta, trend = 'up' }) {
  const isUp = trend === 'up';
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-3xl font-semibold text-slate-900 tabular-nums">{value}</span>
        <span className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {delta}
        </span>
      </div>
    </div>
  );
}
```

Three or four of these in a row is the right count on an Overview page — more than that and none of them reads as the headline number.

## Status badge

```jsx
const statusStyles = {
  won: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  lost: 'bg-red-50 text-red-700',
  new: 'bg-blue-50 text-blue-700',
};

function StatusBadge({ status, children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {children}
    </span>
  );
}
```

## Data table

```jsx
function DataTable({ rows }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left font-medium text-slate-500 px-4 py-3">Customer</th>
            <th className="text-left font-medium text-slate-500 px-4 py-3">Status</th>
            <th className="text-right font-medium text-slate-500 px-4 py-3">Value</th>
            <th className="text-left font-medium text-slate-500 px-4 py-3">Owner</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
              <td className="px-4 py-3"><StatusBadge status={row.status}>{row.statusLabel}</StatusBadge></td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.value}</td>
              <td className="px-4 py-3 text-slate-600">{row.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Sort indicators go inline in the `<th>` (a small chevron, shown on hover or when active). Row actions (edit, delete, open) go in a trailing column, revealed on row hover rather than always visible, so the table stays quiet when the user is just scanning.

### Pagination footer

```jsx
function TablePagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
      <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## Filter toolbar

```jsx
import { Search, SlidersHorizontal, Calendar } from 'lucide-react';

function FilterToolbar() {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1 max-w-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200" placeholder="Search deals..." />
      </div>
      <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
        <SlidersHorizontal className="w-4 h-4" /> Filter
      </button>
      <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
        <Calendar className="w-4 h-4" /> This month
      </button>
    </div>
  );
}
```

## Chart wrapper (recharts)

```jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function RevenueChart({ data }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-sm font-medium text-slate-700 mb-4">Revenue</p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

Muted gridlines, no axis lines, one accent-colored series — a chart should look like it belongs to the same product as the KPI cards next to it, not like it was dropped in from a different library's default theme.

## Empty state

```jsx
import { Inbox } from 'lucide-react';

function EmptyState({ title, description, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Inbox className="w-5 h-5 text-slate-400" />
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {actionLabel && (
        <button className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
```

## Loading skeleton

```jsx
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/4" />
      <div className="h-4 bg-slate-100 rounded w-16" />
      <div className="h-4 bg-slate-100 rounded w-20 ml-auto" />
    </div>
  );
}
```

Match the skeleton's shape to the real layout underneath it (same column widths, same row height) rather than a generic shimmer block — that's what makes the loading state feel like part of the same page instead of a placeholder.

## Record drawer

```jsx
import { X } from 'lucide-react';

function RecordDrawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
```

Use a right-side drawer for quick edits or a record preview without leaving the list; reserve a centered modal for short confirmations (delete, discard changes) where the user's attention should be fully blocked rather than able to glance back at the list behind it.
