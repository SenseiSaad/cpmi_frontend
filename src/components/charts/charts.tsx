"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

interface Point {
  label: string;
  value: number;
}

interface AreaProps {
  data: Point[];
  height?: number;
  format?: (n: number) => string;
  ariaLabel: string;
}

/** Smooth area/line chart with a hover tooltip. Pure SVG, scales to its container. */
export function AreaChart({ data, height = 240, format = (n) => String(n), ariaLabel }: AreaProps) {
  const gradient = useId();
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) {
    return <p className="grid h-40 place-items-center text-sm text-ink-600">No revenue recorded yet.</p>;
  }
  const W = 600;
  const pad = { l: 8, r: 8, t: 16, b: 28 };
  const max = Math.max(...data.map((d) => d.value), 1) * 1.12;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (height - pad.t - pad.b);

  const pts = data.map((d, i) => [x(i), y(d.value)] as const);
  let line = `M ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [px, py] = pts[i - 1]!;
    const [cx, cy] = pts[i]!;
    const mx = (px + cx) / 2;
    line += ` C ${mx} ${py}, ${mx} ${cy}, ${cx} ${cy}`;
  }
  const area = `${line} L ${pts[pts.length - 1]![0]} ${height - pad.b} L ${pts[0]![0]} ${height - pad.b} Z`;
  const active = hover !== null ? data[hover]! : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={ariaLabel} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c2410c" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={pad.l} x2={W - pad.r} y1={pad.t + (1 - t) * (height - pad.t - pad.b)} y2={pad.t + (1 - t) * (height - pad.t - pad.b)} className="stroke-navy-900/[0.07]" strokeDasharray="4 6" />
        ))}
        <motion.path d={area} fill={`url(#${gradient})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }} />
        <motion.path d={line} fill="none" className="stroke-brand-700" strokeWidth={3} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
        {data.map((d, i) => (
          <g key={d.label}>
            <rect x={x(i) - (W / data.length) / 2} y={0} width={W / data.length} height={height} fill="transparent" onPointerEnter={() => setHover(i)} onPointerMove={() => setHover(i)} />
            <text x={x(i)} y={height - 8} textAnchor="middle" className="fill-ink-600 text-[11px]">
              {d.label}
            </text>
          </g>
        ))}
        {hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={height - pad.b} className="stroke-brand-700/40" />
            <circle cx={x(hover)} cy={y(data[hover]!.value)} r={6} className="fill-white stroke-brand-700" strokeWidth={3} />
          </g>
        ) : null}
      </svg>
      <div aria-live="polite" className={cn("pointer-events-none absolute right-2 top-0 rounded-xl bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lift transition-opacity", active ? "opacity-100" : "opacity-0")}>
        {active ? `${active.label}: ${format(active.value)}` : ""}
      </div>
    </div>
  );
}

interface BarProps {
  data: Point[];
  height?: number;
  ariaLabel: string;
  suffix?: string;
}

export function BarChart({ data, height = 220, ariaLabel, suffix = "%" }: BarProps) {
  const max = 100;
  return (
    <div role="img" aria-label={ariaLabel} className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <span className="tnum text-[11px] font-semibold text-ink-700 opacity-0 transition-opacity group-hover:opacity-100">
            {d.value}
            {suffix}
          </span>
          <motion.div
            className="w-full rounded-t-xl bg-gradient-to-t from-navy-800 to-navy-600 transition-colors group-hover:from-brand-700 group-hover:to-brand-500"
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 82}%` }}
            transition={{ duration: 0.9, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="text-[11px] font-medium text-ink-600">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ pass, size = 150, label }: { pass: number; size?: number; label: string }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${pass}% pass, ${100 - pass}% fail`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-bad/25" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" className="stroke-emerald-600" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pass / 100) }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute text-center">
        <p className="tnum text-3xl font-extrabold text-ink-900">{pass}%</p>
        <p className="text-xs font-medium text-ink-600">pass rate</p>
      </div>
    </div>
  );
}
