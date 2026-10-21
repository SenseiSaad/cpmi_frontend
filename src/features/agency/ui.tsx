"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { AgencySidebar } from "@/components/layout/SidebarNav";
import { useAgency } from "@/features/auth/agency-context";
import { EmptyState } from "@/components/shared/QueryState";

/** Agency-area page frame in the CPMI style: shell + sidebar + title header. */
export function AgencyPage({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  const { activeAgency, activeAgencyPublicId } = useAgency();
  return (
    <DashboardShell
      sidebar={<AgencySidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">{title}</h1>
          <p className="text-xs text-gray-500 font-medium">{subtitle ?? activeAgency?.name ?? ""}</p>
        </div>
      }
    >
      {activeAgencyPublicId ? (
        children
      ) : (
        <EmptyState title="No agency selected" description="Your account is not linked to an agency workspace yet." />
      )}
    </DashboardShell>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          {title && <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">{label}</span>
      <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

const GOOD = new Set(["active", "paid", "completed", "accepted", "assigned", "fulfilled", "passed"]);
const WARN = new Set(["pending", "invited", "processing", "queued", "in_progress", "awaiting_payment", "open"]);

export function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone = GOOD.has(s)
    ? "bg-emerald-50 text-highlight-600"
    : WARN.has(s)
      ? "bg-amber-50 text-amber-700"
      : "bg-gray-100 text-gray-600";
  const dot = GOOD.has(s) ? "bg-highlight-500" : WARN.has(s) ? "bg-amber-500" : "bg-gray-400";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {s.replace(/_/g, " ")}
    </span>
  );
}

export function Banner({ tone, children, onClose }: { tone: "success" | "error" | "info"; children: ReactNode; onClose?: () => void }) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-secondary-200 bg-secondary-50 text-secondary-800";
  const Icon = tone === "error" ? AlertCircle : CheckCircle;
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${cls}`} role={tone === "error" ? "alert" : "status"}>
      <Icon size={15} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function Modal({ open, onClose, children, size = "md" }: { open: boolean; onClose: () => void; children: ReactNode; size?: "sm" | "md" }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-3xl w-full p-6 sm:p-8 shadow-2xl relative ${size === "sm" ? "max-w-sm" : "max-w-md"}`}
          >
            <button type="button" onClick={onClose} aria-label="Close" className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 bg-[#152A13] hover:bg-primary-800 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-500";
export const outlineBtn =
  "inline-flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all focus:outline-none";
export const inputCls =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 bg-white";
export const thCls = "pb-3.5 text-gray-400 uppercase tracking-wider font-bold";

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${pct === 100 ? "bg-highlight-500" : "bg-secondary-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-bold text-gray-800 text-[11px] w-8 text-right">{pct}%</span>
    </div>
  );
}
