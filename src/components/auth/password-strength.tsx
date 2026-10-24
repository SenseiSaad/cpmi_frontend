import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

export function passwordChecks(value: string) {
  return [
    { label: "At least 12 characters", ok: value.length >= 12, required: true },
    { label: "Upper and lower case letters", ok: /[a-z]/.test(value) && /[A-Z]/.test(value), required: false },
    { label: "A number or symbol", ok: /[\d\W_]/.test(value), required: false },
  ];
}

/** Length is what the API enforces (12–200); the other hints are guidance, not blockers. */
export function PasswordStrength({ value, id }: { value: string; id?: string }) {
  const checks = passwordChecks(value);
  const score = checks.filter((c) => c.ok).length;
  const label = value.length === 0 ? "" : score === 3 ? "Strong" : score === 2 ? "Good" : "Weak";
  return (
    <div id={id} className="mt-2 space-y-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", value.length && i < score ? (score === 3 ? "bg-emerald-600" : score === 2 ? "bg-amber-500" : "bg-red-500") : "bg-navy-900/10")} />
        ))}
      </div>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className={cn("flex items-center gap-2 text-xs", c.ok ? "text-ok" : "text-ink-600")}>
            {c.ok ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
            {c.label}
            <span className="sr-only">{c.ok ? " — met" : c.required ? " — required, not met" : " — not met"}</span>
          </li>
        ))}
      </ul>
      {label ? <p className="sr-only">Password strength: {label}</p> : null}
    </div>
  );
}
