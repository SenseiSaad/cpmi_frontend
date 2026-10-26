"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** CSS grid track, e.g. "minmax(0,1.6fr)" or "90px". */
  width?: string;
  cell: (row: T) => ReactNode;
  /**
   * Kept so existing column definitions keep compiling. It has no effect: every column, header and cell
   * is left-aligned across the platform (numbers included), by design.
   */
  align?: "left" | "right" | "center";
  /** Hide the label in the stacked mobile layout (e.g. for the primary/title cell and actions). */
  hideLabelOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  empty?: { title: string; description?: string; action?: ReactNode };
  caption: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

/**
 * Pill-row table inspired by the reference design. Becomes stacked cards on small screens
 * (each cell shows its column label above its value), so no horizontal scrolling is ever needed.
 * Everything is left-aligned.
 */
export function DataTable<T>({ columns, rows, rowKey, loading, error, onRetry, empty, caption, onRowClick, className }: DataTableProps<T>) {
  const template = columns.map((c) => c.width ?? "minmax(0,1fr)").join(" ");
  const style = { "--cols": template } as CSSProperties;

  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading || !rows) return <SkeletonRows rows={6} />;
  if (rows.length === 0) return <EmptyState title={empty?.title ?? "Nothing here yet"} description={empty?.description} action={empty?.action} />;

  return (
    <div role="table" aria-label={caption} className={cn("w-full text-left", className)} style={style}>
      <div role="rowgroup" className="hidden md:block">
        <div role="row" className="grid items-center gap-4 px-4 pb-2 text-left text-xs font-semibold uppercase tracking-wider text-ink-600 md:[grid-template-columns:var(--cols)]">
          {columns.map((c) => (
            <div key={c.key} role="columnheader" className="text-left">
              {c.header}
            </div>
          ))}
        </div>
      </div>
      <div role="rowgroup" className="space-y-2">
        {rows.map((row, index) => {
          const clickable = !!onRowClick;
          return (
            <motion.div
              key={rowKey(row)}
              role="row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: Math.min(index * 0.035, 0.28), ease: [0.22, 1, 0.36, 1] }}
              onClick={clickable ? () => onRowClick(row) : undefined}
              onKeyDown={clickable ? (e) => (e.key === "Enter" ? onRowClick(row) : undefined) : undefined}
              tabIndex={clickable ? 0 : undefined}
              className={cn(
                "grid gap-x-4 gap-y-3 rounded-2xl bg-canvas-soft px-4 py-3.5 text-left ring-1 ring-transparent transition-all duration-200 md:items-center md:[grid-template-columns:var(--cols)]",
                clickable && "cursor-pointer hover:bg-white hover:shadow-card hover:ring-line focus-visible:bg-white",
              )}
            >
              {columns.map((c) => (
                <div key={c.key} role="cell" className="flex min-w-0 flex-col items-start gap-0.5 text-left text-sm text-ink-900 md:block">
                  <span className={cn("shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-600 md:hidden", c.hideLabelOnMobile && "hidden")}>{c.header}</span>
                  <div className="min-w-0 text-left">{c.cell(row)}</div>
                </div>
              ))}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
