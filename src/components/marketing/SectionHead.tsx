import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadProps {
  index: string;
  label: string;
  title: ReactNode;
  children?: ReactNode;
  tone?: "light" | "dark";
  /** Stack the supporting copy under the headline (for narrow columns). */
  stacked?: boolean;
  className?: string;
}

/** Editorial section opener: numbered eyebrow, serif headline on the left, supporting copy on the right. */
export function SectionHead({ index, label, title, children, tone = "light", stacked = false, className }: SectionHeadProps) {
  const dark = tone === "dark";
  return (
    <header className={cn(stacked ? "grid gap-5" : "grid gap-6 lg:grid-cols-12 lg:gap-10", className)}>
      <div className={cn(!stacked && "lg:col-span-6")}>
        <p className={cn("eyebrow flex items-center gap-3", dark && "!text-secondary-400")}>
          <span className="num">{index}</span>
          <span aria-hidden className={cn("h-px w-8", dark ? "bg-secondary-400/60" : "bg-secondary-700/50")} />
          {label}
        </p>
        <h2 className={cn("t-h2 mt-5", dark ? "text-white" : "text-primary-900")}>{title}</h2>
      </div>
      {children ? (
        <div className={cn("t-lead", !stacked && "lg:col-span-5 lg:col-start-8 lg:pt-9", dark && "!text-white/75")}>
          {children}
        </div>
      ) : null}
    </header>
  );
}
