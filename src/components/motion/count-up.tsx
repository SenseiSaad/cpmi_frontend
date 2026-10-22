"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}

/** Counts up when scrolled into view. The final value is always exposed to assistive tech. */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("en-US"), duration = 1.1 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(v) });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref}>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
