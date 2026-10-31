"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn, clamp } from "@/lib/utils";

interface BarProps {
  value: number;
  label: string;
  tone?: "brand" | "ok" | "navy" | "warn";
  className?: string;
  showValue?: boolean;
}

const BAR = { brand: "bg-brand-600", ok: "bg-emerald-600", navy: "bg-navy-700", warn: "bg-amber-500" } as const;

export function ProgressBar({ value, label, tone = "brand", className, showValue }: BarProps) {
  const pct = clamp(Math.round(value), 0, 100);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-900/[0.07]" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <motion.div className={cn("h-full rounded-full", BAR[tone])} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      {showValue ? <span className="tnum w-10 text-left text-xs font-semibold text-ink-700">{pct}%</span> : null}
    </div>
  );
}

interface RingProps {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  tone?: "brand" | "ok" | "navy";
  children?: ReactNode;
  trackClassName?: string;
}

const RING = { brand: "stroke-brand-600", ok: "stroke-emerald-600", navy: "stroke-navy-700" } as const;

export function ProgressRing({ value, size = 120, stroke = 10, label, tone = "brand", children, trackClassName = "stroke-navy-900/[0.08]" }: RingProps) {
  const pct = clamp(value, 0, 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(pct)}%`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClassName} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={RING[tone]}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
