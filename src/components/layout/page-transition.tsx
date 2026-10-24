"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Used from each portal's template.tsx. A template remounts on every navigation, so the page
 * eases in (fade + rise) with a thin progress sweep along the top — the sidebar, which lives in
 * the layout, stays put and its active pill glides between items.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <>
      <motion.div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[95] h-[3px] origin-left bg-gradient-to-r from-brand-500 via-brand-600 to-navy-600" initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: 1, opacity: 0 }} transition={{ scaleX: { duration: 0.55, ease: "easeOut" }, opacity: { duration: 0.3, delay: 0.5 } }} />
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.div>
    </>
  );
}
