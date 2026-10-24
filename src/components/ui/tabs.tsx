"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  const group = useId();
  return (
    <div role="tablist" aria-label={label} className={cn("thin-scroll inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-navy-900/[0.04]", className)}>
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            id={`${group}-tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`${group}-panel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              const next = items[(i + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length]!;
              onChange(next.value);
              document.getElementById(`${group}-tab-${next.value}`)?.focus();
            }}
            className={cn("relative whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors", selected ? "text-white" : "text-ink-600 hover:text-ink-900")}
          >
            {selected ? <motion.span layoutId={`${group}-pill`} className="absolute inset-0 rounded-xl bg-navy-900" transition={{ type: "spring", stiffness: 420, damping: 34 }} /> : null}
            <span className="relative z-10 inline-flex items-center gap-2">
              {item.icon}
              {item.label}
              {item.count !== undefined ? <span className={cn("tnum rounded-full px-1.5 text-xs", selected ? "bg-white/20" : "bg-navy-900/[0.07]")}>{item.count}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ group, value, active, children }: { group?: string; value: string; active: boolean; children: ReactNode }) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={group ? `${group}-panel-${value}` : undefined} tabIndex={0} className="outline-none">
      {children}
    </div>
  );
}
