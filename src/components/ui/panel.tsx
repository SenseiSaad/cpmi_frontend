import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Standard white surface used across the portal pages. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04] sm:p-6", className)}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-ink-900">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-600">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
