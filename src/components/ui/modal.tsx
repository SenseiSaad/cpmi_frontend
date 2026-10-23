"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useLenis } from "lenis/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input:not([disabled]),select,[tabindex]:not([tabindex="-1"])';

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Shared dialog behaviour: scroll lock, Escape, focus trap + restore (WCAG 2.1.2 / 2.4.3). */
function useDialog(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  // Callers pass inline handlers (new identity every render). Keep them in refs so the
  // effect below runs only when the dialog opens/closes - re-running it on every keystroke
  // re-focused the first field and stole the user's typing.
  const onCloseRef = useRef(onClose);
  const lenisRef = useRef(lenis);
  onCloseRef.current = onClose;
  lenisRef.current = lenis;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lenisRef.current?.stop();
    const timer = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 30);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      lenisRef.current?.start();
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return panel;
}

function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function Modal({ open, onClose, title, description, children, footer, className }: BaseProps) {
  const panel = useDialog(open, onClose);
  const titleId = useId();
  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[80] grid place-items-end sm:place-items-center">
            <motion.div className="absolute inset-0 bg-navy-950/55 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-lenis-prevent
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className={cn("relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-lift sm:max-w-lg sm:rounded-3xl", className)}
            >
              <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
                <div>
                  <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink-900">
                    {title}
                  </h2>
                  {description ? <p className="mt-1 text-sm text-ink-600">{description}</p> : null}
                </div>
                <button type="button" onClick={onClose} className="-mr-2 -mt-1 grid size-9 place-items-center rounded-xl text-ink-600 hover:bg-canvas-soft" aria-label="Close dialog">
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <div className="thin-scroll overflow-y-auto px-6 py-3">{children}</div>
              {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div> : null}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </Portal>
  );
}

export function Drawer({ open, onClose, title, description, children, footer, className }: BaseProps) {
  const panel = useDialog(open, onClose);
  const titleId = useId();
  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[80]">
            <motion.div className="absolute inset-0 bg-navy-950/55 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-lenis-prevent
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 38 }}
              className={cn("absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-lift", className)}
            >
              <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                <div>
                  <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink-900">
                    {title}
                  </h2>
                  {description ? <p className="mt-1 text-sm text-ink-600">{description}</p> : null}
                </div>
                <button type="button" onClick={onClose} className="-mr-2 grid size-9 place-items-center rounded-xl text-ink-600 hover:bg-canvas-soft" aria-label="Close panel">
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>
              {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div> : null}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </Portal>
  );
}
