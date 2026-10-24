"use client";

import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { AlertCircle, Check, Circle, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

const inputClass =
  "h-12 w-full rounded-md border bg-white text-[0.9375rem] text-ink placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2";

interface BaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  error?: string;
  /** Mark the field invalid without a message of its own (the form shows one alert for the whole form). */
  invalid?: boolean;
  hint?: string;
  icon?: ReactNode;
  /** Shown on the right of the label row (for example a "Forgot password?" link). */
  labelAside?: ReactNode;
}

function describedBy(...ids: (string | undefined)[]) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export const TextField = forwardRef<HTMLInputElement, BaseProps>(function TextField(
  { label, error, invalid, hint, icon, labelAside, id, ...rest },
  ref
) {
  const bad = !!error || !!invalid;
  const auto = useId();
  const fieldId = id ?? auto;
  const errId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative mt-2">
        {icon ? (
          <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={bad ? true : undefined}
          aria-describedby={describedBy(hintId, errId)}
          className={cn(
            inputClass,
            icon ? "pl-10 pr-4" : "px-4",
            bad ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-line focus:border-primary-500 focus:ring-primary-500/25"
          )}
          {...rest}
        />
      </div>
      {hint && !error ? (
        <p id={hintId} className="mt-2 text-sm text-ink-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, Omit<BaseProps, "type" | "icon">>(function PasswordField(
  { label, error, invalid, hint, labelAside, id, ...rest },
  ref
) {
  const auto = useId();
  const fieldId = id ?? auto;
  const errId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const [visible, setVisible] = useState(false);
  const bad = !!error || !!invalid;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative mt-2">
        <input
          ref={ref}
          id={fieldId}
          type={visible ? "text" : "password"}
          aria-invalid={bad ? true : undefined}
          aria-describedby={describedBy(hintId, errId)}
          className={cn(
            inputClass,
            "pl-4 pr-12",
            bad ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-line focus:border-primary-500 focus:ring-primary-500/25"
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded text-ink-400 transition-colors hover:text-ink-700"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {hint && !error ? (
        <p id={hintId} className="mt-2 text-sm text-ink-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
});

/** The API enforces length only (12 to 200). The other two rules are guidance, so they never block submit. */
export function PasswordGuidance({ value }: { value: string }) {
  const rules = [
    { label: "At least 12 characters", ok: value.length >= 12 },
    { label: "Upper and lower case letters", ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: "A number or symbol", ok: /[\d\W_]/.test(value) },
  ];
  const score = rules.filter((r) => r.ok).length;
  const label = !value ? "" : score === 3 ? "Strong" : score === 2 ? "Fair" : "Weak";

  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              value && i < score ? (score === 3 ? "bg-primary-500" : score === 2 ? "bg-secondary-500" : "bg-red-500") : "bg-paper-deep"
            )}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {rules.map((rule) => (
          <li key={rule.label} className={cn("flex items-center gap-2 text-sm", rule.ok ? "text-primary-600" : "text-ink-500")}>
            {rule.ok ? <Check size={14} strokeWidth={2.5} aria-hidden /> : <Circle size={14} aria-hidden />}
            {rule.label}
            <span className="sr-only">{rule.ok ? " (met)" : " (not met)"}</span>
          </li>
        ))}
      </ul>
      {label ? <p className="sr-only">Password strength: {label}</p> : null}
    </div>
  );
}

export function FormAlert({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} role="alert" className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-snug text-red-800">
      <AlertCircle size={17} className="mt-px shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
