"use client";

import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/error";

/** Shared loading / error / empty states in the CPMI style, used by every data-driven page. */

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-gray-500" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-primary-500" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError ? error.message : "Something went wrong while loading this page. Please try again.";
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center" role="alert">
      <AlertCircle className="h-6 w-6 text-red-500" aria-hidden="true" />
      <p className="text-sm font-semibold text-red-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-xs font-bold text-red-700 underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <Inbox className="h-6 w-6 text-gray-400" aria-hidden="true" />
      <p className="text-sm font-bold text-gray-800">{title}</p>
      {description && <p className="max-w-md text-xs text-gray-500">{description}</p>}
      {action}
    </div>
  );
}

/** Message for a failed mutation, safe to render. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}
