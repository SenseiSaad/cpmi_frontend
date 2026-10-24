import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONES = {
  brand: "bg-brand-50 text-brand-700",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  info: "bg-info-bg text-info",
  navy: "bg-navy-900/[0.06] text-navy-800",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04]", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">{label}</p>
        {Icon ? (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", TONES[tone])} aria-hidden>
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="tnum mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-600">{hint}</p> : null}
    </div>
  );
}
