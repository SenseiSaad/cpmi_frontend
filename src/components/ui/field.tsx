"use client";

import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-xl bg-white px-3.5 text-sm text-ink-900 ring-1 ring-line transition-shadow placeholder:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:bg-canvas-soft disabled:text-ink-500";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Shows a visible "required" marker (and announces it to screen readers). */
  required?: boolean;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Label + control + hint/error wired together with ids (WCAG 1.3.1 / 3.3.1). */
export function Field({ label, hint, error, optional, required, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn("space-y-1.5 text-left", className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
        {label}
        {required ? (
          <>
            <span className="text-bad" aria-hidden>
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        ) : null}
        {optional ? <span className="ml-0.5 text-xs font-medium text-ink-500">Optional</span> : null}
      </label>
      {children({ id, describedBy: [hintId, errId].filter(Boolean).join(" ") || undefined, invalid: !!error })}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-600">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} role="alert" className="text-xs font-medium text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, invalid, leading, type = "text", ...rest }, ref) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="relative">
      {leading ? <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500">{leading}</span> : null}
      <input
        ref={ref}
        type={isPassword && reveal ? "text" : type}
        aria-invalid={invalid || undefined}
        className={cn(CONTROL, "h-11", leading && "pl-10", isPassword && "pr-11", invalid && "ring-2 ring-bad", className)}
        {...rest}
      />
      {isPassword ? (
        <button type="button" onClick={() => setReveal((v) => !v)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-600 hover:bg-canvas-soft" aria-label={reveal ? "Hide password" : "Show password"} aria-pressed={reveal}>
          {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      ) : null}
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, invalid, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(CONTROL, "h-11 appearance-none pr-10", invalid && "ring-2 ring-bad", className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-600" aria-hidden />
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, ...rest }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(CONTROL, "min-h-28 py-3", invalid && "ring-2 ring-bad", className)} {...rest} />;
});

interface ChoiceProps {
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
  type?: "radio" | "checkbox";
  name?: string;
  icon?: ReactNode;
  className?: string;
}

/** Large selectable card (radio/checkbox) used for payment method, quiz answers, etc. */
export function ChoiceCard({ checked, onChange, title, description, type = "radio", name, icon, className }: ChoiceProps) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 ring-1 transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-700",
        checked ? "bg-brand-50 ring-2 ring-brand-700" : "ring-line hover:bg-canvas-soft hover:ring-navy-300",
        className,
      )}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center border-2 transition-colors", type === "radio" ? "rounded-full" : "rounded-md", checked ? "border-brand-700 bg-brand-700" : "border-ink-300 bg-white")} aria-hidden>
        {checked ? <span className={cn("bg-white", type === "radio" ? "size-2 rounded-full" : "size-2.5 rounded-sm")} /> : null}
      </span>
      {icon ? <span className="mt-0.5 text-ink-700">{icon}</span> : null}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        {description ? <span className="mt-0.5 block text-sm text-ink-600">{description}</span> : null}
      </span>
    </label>
  );
}
