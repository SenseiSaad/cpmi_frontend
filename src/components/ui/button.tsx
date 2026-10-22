import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "secondary" | "ghost" | "soft" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-700 text-white shadow-glow hover:bg-brand-800",
  dark: "bg-navy-900 text-white hover:bg-navy-800",
  secondary: "bg-white text-ink-900 ring-1 ring-line hover:bg-canvas-soft",
  ghost: "text-ink-700 hover:bg-navy-900/5",
  soft: "bg-brand-50 text-brand-800 hover:bg-brand-100",
  danger: "bg-bad text-white hover:bg-red-800",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-xl px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-5 text-sm",
  lg: "h-12 gap-2 rounded-2xl px-6 text-base",
  icon: "size-10 rounded-xl",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-[transform,background-color,box-shadow,color] duration-200",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function ButtonLink({ variant = "primary", size = "md", icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
