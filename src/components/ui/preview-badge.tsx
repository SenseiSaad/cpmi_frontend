import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/** Marks screens whose backend slice is not built yet. Visible, honest, and easy to remove later. */
export function PreviewBadge({ className, label = "Preview · sample data" }: { className?: string; label?: string }) {
  return (
    <span
      title="This feature's backend isn't built yet. You're looking at the designed experience with sample data."
      className={cn("inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-200", className)}
    >
      <FlaskConical className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
