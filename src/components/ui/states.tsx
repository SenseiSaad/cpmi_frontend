import { AlertCircle, Sparkles } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

interface EmptyProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Sparkles, title, description, action, className }: EmptyProps) {
  return (
    <div className={cn("grid place-items-center px-6 py-14 text-center", className)}>
      <span className="grid size-14 place-items-center rounded-2xl bg-navy-900/[0.06] text-navy-700">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink-900">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="grid place-items-center px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-bad-bg text-bad">
        <AlertCircle className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink-900">We couldn&apos;t load this</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-600">{message ?? "Something went wrong. Please try again."}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
