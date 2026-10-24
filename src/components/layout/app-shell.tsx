"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useLenis } from "lenis/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PORTALS, isActive, type Portal } from "./nav";
import { SidebarContent } from "./sidebar";
import { Topbar } from "./topbar";

function BottomBar({ portal, onMore }: { portal: Portal; onMore: () => void }) {
  const pathname = usePathname();
  const config = PORTALS[portal];
  const items = config.nav.slice(0, 4);
  return (
    <nav aria-label="Primary" className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-1 rounded-3xl bg-navy-900/95 p-1.5 shadow-lift backdrop-blur-xl lg:hidden no-print">
      {items.map((item) => {
        const active = item.children ? item.children.some((c) => isActive(pathname, c.href, [config.home])) : isActive(pathname, item.href, [config.home]);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold transition-colors", active ? "bg-white/10 text-white" : "text-navy-300")}>
            <Icon className={cn("size-5", active && "text-brand-400")} />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        );
      })}
      <button type="button" onClick={onMore} className="flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold text-navy-300">
        <span className="grid size-5 place-items-center text-lg leading-none" aria-hidden>
          ⋯
        </span>
        More
      </button>
    </nav>
  );
}

export function AppShell({ portal, children }: { portal: Portal; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const lenis = useLenis();

  // Close the drawer on navigation; keep page scroll locked while it is open.
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.removeEventListener("keydown", onKey);
    };
  }, [drawer, lenis]);

  // New page => start at the top (Lenis owns scrolling).
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, lenis]);

  return (
    <div className="min-h-dvh lg:pl-[17.5rem] print:pl-0">
      <aside className="fixed inset-y-3 left-3 z-40 hidden w-64 overflow-hidden rounded-[2rem] bg-navy-900 shadow-lift lg:block no-print">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-brand-600/25 blur-3xl" aria-hidden />
        <div className="relative h-full">
          <SidebarContent portal={portal} />
        </div>
      </aside>

      <AnimatePresence>
        {drawer ? (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} aria-hidden />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              data-lenis-prevent
              initial={{ x: "-105%" }}
              animate={{ x: 0 }}
              exit={{ x: "-105%" }}
              transition={{ type: "spring", stiffness: 340, damping: 38 }}
              className="absolute inset-y-3 left-3 w-[19rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[2rem] bg-navy-900 shadow-lift"
            >
              <button type="button" onClick={() => setDrawer(false)} className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/10 text-white" aria-label="Close navigation menu">
                <X className="size-5" aria-hidden />
              </button>
              <SidebarContent portal={portal} onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="px-4 pb-28 sm:px-6 lg:px-8 lg:pb-12 print:p-0">
        <Topbar portal={portal} onOpenMenu={() => setDrawer(true)} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[88rem] outline-none">
          {children}
        </main>
      </div>
      <BottomBar portal={portal} onMore={() => setDrawer(true)} />
    </div>
  );
}
