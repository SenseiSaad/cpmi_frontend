import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "brand" | "navy";

const TONE: Record<Tone, string> = {
  neutral: "bg-slate-100 text-ink-700",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  brand: "bg-brand-50 text-brand-800",
  navy: "bg-navy-100 text-navy-800",
};

export function Badge({ tone = "neutral", className, children, dot }: { tone?: Tone; className?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", TONE[tone], className)}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

const STATUS: Record<string, { tone: Tone; label?: string }> = {
  active: { tone: "ok" },
  paid: { tone: "ok" },
  published: { tone: "ok" },
  valid: { tone: "ok" },
  completed: { tone: "ok" },
  done: { tone: "ok" },
  pending: { tone: "warn" },
  invited: { tone: "info" },
  draft: { tone: "neutral" },
  suspended: { tone: "warn" },
  expired: { tone: "neutral" },
  left: { tone: "neutral", label: "removed" },
  retired: { tone: "neutral" },
  revoked: { tone: "bad" },
  void: { tone: "neutral" },
  failed: { tone: "bad" },
  closed: { tone: "neutral" },
  refunded: { tone: "info" },
  partially_refunded: { tone: "info", label: "partially refunded" },
};

/** Maps backend status strings onto a consistent colour + label (colour is never the only signal). */
export function StatusPill({ status }: { status: string }) {
  const entry = STATUS[status] ?? { tone: "neutral" as Tone };
  return (
    <Badge tone={entry.tone} dot>
      <span className="capitalize">{entry.label ?? status.replace(/_/g, " ")}</span>
    </Badge>
  );
}
