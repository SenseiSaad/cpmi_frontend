import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ href = "/", tone = "light", className, compact }: { href?: string; tone?: "light" | "dark"; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5 rounded-xl", className)} aria-label="Certification Academy home">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className={cn("block text-[15px] font-extrabold tracking-tight", tone === "light" ? "text-white" : "text-navy-900")}>Certification</span>
          <span className={cn("block text-xs font-semibold tracking-[0.18em] uppercase", tone === "light" ? "text-navy-300" : "text-ink-600")}>Academy</span>
        </span>
      )}
    </Link>
  );
}
