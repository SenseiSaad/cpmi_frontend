"use client";

import { AnimatePresence, motion } from "motion/react";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  hint?: string;
}

interface MenuProps {
  items: MenuItem[];
  label: string;
  trigger?: ReactNode;
  align?: "left" | "right";
  triggerClassName?: string;
}

/** Dropdown menu: click-outside, Escape, arrow-key navigation, focus restore. */
export function Menu({ items, label, trigger, align = "right", triggerClassName }: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const nodes = [...(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
        if (nodes.length === 0) return;
        const idx = nodes.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "ArrowDown" ? (idx + 1) % nodes.length : (idx - 1 + nodes.length) % nodes.length;
        nodes[next]?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => root.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus(), 30);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={cn("grid size-9 place-items-center rounded-xl text-ink-600 transition-colors hover:bg-navy-900/5 hover:text-ink-900", triggerClassName)}
      >
        {trigger ?? <MoreHorizontal className="size-5" aria-hidden />}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            style={{ transformOrigin: align === "right" ? "top right" : "top left" }}
            className={cn("absolute z-40 mt-2 min-w-52 rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-line", align === "right" ? "right-0" : "left-0")}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:bg-canvas-soft disabled:cursor-not-allowed disabled:opacity-45",
                  item.tone === "danger" ? "text-bad hover:bg-bad-bg" : "text-ink-900 hover:bg-canvas-soft",
                )}
              >
                {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
                <span className="flex-1">{item.label}</span>
                {item.hint ? <span className="text-xs text-ink-500">{item.hint}</span> : null}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
