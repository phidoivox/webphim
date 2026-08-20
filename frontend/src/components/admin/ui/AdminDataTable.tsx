"use client";

import React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  FilmIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface AdminTableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  headerClassName?: string;
}

export interface AdminDataTableProps<T extends { id?: string | number; [key: string]: any }> {
  columns: AdminTableColumn<T>[];
  data: T[];
  keyExtractor?: (row: T) => string | number;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectRow?: (id: string | number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    perPage?: number;
    onPageChange: (page: number) => void;
  };
  batchActions?: React.ReactNode;
  density?: "comfortable" | "compact";
  className?: string;
}

export default function AdminDataTable<T extends { id?: string | number; [key: string]: any }>({
  columns,
  data,
  keyExtractor = (row) => row.id ?? "",
  sortColumn,
  sortDirection = "asc",
  onSort,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  loading = false,
  emptyMessage = "Không có dữ liệu hiển thị.",
  emptyIcon: EmptyIcon = FilmIcon,
  pagination,
  batchActions,
  density = "comfortable",
  className = "",
}: AdminDataTableProps<T>) {
  const rowIds = data.map((r) => keyExtractor(r));
  const isAllSelected =
    rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));
  const isSomeSelected =
    rowIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

  const handleSort = (columnId: string, sortable?: boolean) => {
    if (!sortable || !onSort) return;
    if (sortColumn === columnId) {
      onSort(columnId, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSort(columnId, "asc");
    }
  };

  const padY = density === "compact" ? "py-2.5" : "py-3.5";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-white/10 bg-[#0f121a]/85 backdrop-blur-md shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Batch Actions Bar (Revealed when items are selected) */}
      {selectable && selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-accent/15 border-b border-accent/30 px-5 py-2.5 transition-all">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white tabular-nums">
              {selectedIds.length}
            </span>
            <span>mục đã được chọn</span>
          </div>
          <div className="flex items-center gap-2">{batchActions}</div>
        </div>
      )}

      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
              {selectable && (
                <th className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả các dòng"
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/40 focus:ring-offset-0 transition cursor-pointer"
                  />
                </th>
              )}

              {columns.map((col) => {
                const isCurrentSorted = sortColumn === col.id;
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return (
                  <th
                    key={col.id}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => handleSort(col.id, col.sortable)}
                    className={`px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px] select-none ${alignClass} ${
                      col.sortable
                        ? "cursor-pointer hover:text-white transition-colors group"
                        : ""
                    } ${col.headerClassName || ""}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === "right" ? "justify-end" : ""
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-500 group-hover:text-slate-300">
                          {isCurrentSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUpIcon className="h-3.5 w-3.5 text-accent" />
                            ) : (
                              <ChevronDownIcon className="h-3.5 w-3.5 text-accent" />
                            )
                          ) : (
                            <ChevronDownIcon className="h-3.5 w-3.5 opacity-30 group-hover:opacity-70" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/5">
            {loading ? (
              // Skeleton loading state (5 placeholder rows)
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-4 w-4 mx-auto rounded bg-white/10" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-14 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
                      <EmptyIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-400">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, rowIndex) => {
                const id = keyExtractor(row);
                const isSelected = selectedIds.includes(id);

                return (
                  <tr
                    key={id ?? rowIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors duration-150 ${
                      isSelected
                        ? "bg-accent/10 hover:bg-accent/15"
                        : "hover:bg-white/[0.03]"
                    } ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {selectable && (
                      <td
                        className="w-12 px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            onSelectRow && onSelectRow(id, e.target.checked)
                          }
                          aria-label={`Chọn mục ${id}`}
                          className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/40 focus:ring-offset-0 transition cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const alignClass =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";

                      let cellValue: React.ReactNode = null;
                      if (typeof col.accessor === "function") {
                        cellValue = col.accessor(row);
                      } else if (col.accessor) {
                        cellValue = row[col.accessor];
                      }

                      return (
                        <td
                          key={col.id}
                          className={`px-4 ${padY} text-xs ${alignClass} ${
                            col.className || ""
                          }`}
                        >
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 px-5 py-3.5 text-xs text-slate-400 bg-white/[0.01]">
          <div className="tabular-nums">
            {pagination.totalItems !== undefined ? (
              <span>
                Hiển thị{" "}
                <strong className="text-white">
                  {Math.min(
                    (pagination.currentPage - 1) * (pagination.perPage || 20) + 1,
                    pagination.totalItems
                  )}
                </strong>
                -
                <strong className="text-white">
                  {Math.min(
                    pagination.currentPage * (pagination.perPage || 20),
                    pagination.totalItems
                  )}
                </strong>{" "}
                trong tổng số <strong className="text-white">{pagination.totalItems}</strong> mục
              </span>
            ) : (
              <span>
                Trang <strong className="text-white">{pagination.currentPage}</strong> /{" "}
                <strong className="text-white">{pagination.totalPages}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Trước</span>
            </button>

            {/* Page number indicators */}
            <div className="hidden sm:flex items-center gap-1 px-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (
                    pagination.currentPage >=
                    pagination.totalPages - 2
                  ) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }

                  const isActive = pagination.currentPage === pageNum;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => pagination.onPageChange(pageNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition tabular-nums ${
                        isActive
                          ? "bg-accent text-white shadow-sm shadow-accent/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span>Sau</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
