"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number; // 1-based
  pageCount: number;
  onChange: (page: number) => void;
  total?: number;
  pageSize?: number;
}

function pagesToShow(page: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, 2, page - 1, page, page + 1, count - 1, count].filter((n) => n >= 1 && n <= count));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1]! > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

export function Pagination({ page, pageCount, onChange, total, pageSize }: PaginationProps) {
  if (pageCount <= 1 && !total) return null;
  const from = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : null;
  const to = total !== undefined && pageSize ? Math.min(page * pageSize, total) : null;
  return (
    <nav aria-label="Pagination" className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="tnum text-sm text-ink-600" aria-live="polite">
        {from !== null && to !== null && total !== undefined ? `Showing ${from}–${to} of ${total}` : `Page ${page} of ${pageCount}`}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-navy-900/[0.05] p-1">
          {pagesToShow(page, pageCount).map((p, i) =>
            p === "gap" ? (
              <span key={`g${i}`} className="px-1 text-ink-500" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn("tnum grid size-8 place-items-center rounded-full text-sm font-semibold transition-all", p === page ? "bg-white text-ink-900 shadow-card" : "text-ink-600 hover:text-ink-900")}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous page" className="grid size-10 place-items-center rounded-full bg-white text-ink-900 ring-1 ring-line transition hover:bg-canvas-soft disabled:opacity-40">
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={() => onChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount} aria-label="Next page" className="grid size-10 place-items-center rounded-full bg-navy-900 text-white transition hover:bg-navy-800 disabled:opacity-40">
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
