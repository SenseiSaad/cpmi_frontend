"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  y?: number;
  /** Animate on mount instead of when scrolled into view (for above-the-fold content). */
  immediate?: boolean;
}

/** Fade + rise on enter. Honors prefers-reduced-motion via the global MotionConfig. */
export function Reveal({ children, delay = 0, y = 18, immediate, ...rest }: RevealProps) {
  const target = { opacity: 1, y: 0 };
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      {...(immediate ? { animate: target } : { whileInView: target, viewport: { once: true, margin: "-60px" } })}
      transition={{ duration: 0.6, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Staggered group: children wrap themselves in <StaggerItem>. */
export function Stagger({ children, className, gap = 0.07, immediate = true }: { children: ReactNode; className?: string; gap?: number; immediate?: boolean }) {
  const variants = { hidden: {}, show: { transition: { staggerChildren: gap } } };
  return (
    <motion.div className={className} variants={variants} initial="hidden" {...(immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "-60px" } })}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }}>
      {children}
    </motion.div>
  );
}
