"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { AdminSidebar } from "@/components/layout/SidebarNav";
import { cn } from "@/lib/utils";

/** Shared CPMI-styled building blocks for the platform admin area. */

export const btnDark =
  "inline-flex items-center justify-center gap-1.5 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed";
export const btnLight =
  "inline-flex items-center justify-center gap-1.5 border border-gray-200 bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 border border-red-200 bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const thClass = "pb-3 pr-3 text-left";
export const tdClass = "py-3 pr-3";

export function AdminPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <DashboardShell
      sidebar={<AdminSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      }
    >
      <div className="space-y-6">{children}</div>
    </DashboardShell>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs", className)}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            {title && <h2 className="text-base font-black text-gray-900">{title}</h2>}
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <p className="mt-2 text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  published: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  accepted: "bg-emerald-50 text-emerald-700",
  draft: "bg-secondary-100 text-secondary-800",
  pending: "bg-secondary-100 text-secondary-800",
  suspended: "bg-amber-50 text-amber-700",
  retired: "bg-gray-100 text-gray-600",
  expired: "bg-gray-100 text-gray-600",
  revoked: "bg-red-50 text-red-700",
  closed: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700"
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize",
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-gray-200 p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-black text-gray-900">{title}</h2>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl px-3 py-2 text-xs font-semibold",
        tone === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
      )}
    >
      {children}
    </p>
  );
}

/** A transient success / error message for mutations. */
export function useFlash() {
  const [flash, setFlash] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  useEffect(() => {
    if (!flash || flash.tone === "error") return;
    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);
  return {
    flash,
    success: (text: string) => setFlash({ tone: "success", text }),
    error: (text: string) => setFlash({ tone: "error", text }),
    clear: () => setFlash(null),
    node: flash ? <Notice tone={flash.tone}>{flash.text}</Notice> : null
  };
}

export function Pager({ page, pages, total, onChange }: { page: number; pages: number; total: number; onChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs text-gray-500">
      <span>
        {total.toLocaleString()} total · page {page} of {Math.max(1, pages)}
      </span>
      <div className="flex gap-2">
        <button type="button" className={btnLight} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button type="button" className={btnLight} disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function money(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-US");
}

export function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${value}%`;
}

/** Dollar input → integer cents, or null when invalid. */
export function dollarsToCents(input: string): number | null {
  const dollars = Number(input);
  if (!input.trim() || !Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}
