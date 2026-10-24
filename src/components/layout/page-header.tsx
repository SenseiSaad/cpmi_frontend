import type { ReactNode } from "react";

import { PreviewBadge } from "@/components/ui/preview-badge";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
  preview?: boolean;
}

export function PageHeader({ title, subtitle, actions, eyebrow, preview }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 pt-2">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-balance text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
          {preview ? <PreviewBadge /> : null}
        </div>
        {subtitle ? <p className="mt-1 max-w-2xl text-pretty text-sm text-ink-600 sm:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
