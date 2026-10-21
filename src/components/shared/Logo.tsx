"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  /** Hide the long subtitle on phones, where it would push header buttons off screen. */
  compactOnMobile?: boolean;
  className?: string;
}

export default function Logo({
  variant = "dark",
  size = "md",
  showSubtitle = true,
  compactOnMobile = false,
  className,
}: LogoProps) {
  const isLight = variant === "light";

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const barSizes = {
    sm: "w-1.5 h-5",
    md: "w-2 h-6",
    lg: "w-2.5 h-8",
  };

  return (
    <div className={cn("inline-flex flex-col items-start select-none", className)}>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "font-black tracking-tight leading-none",
            textSizes[size],
            isLight ? "text-white" : "text-primary-500"
          )}
        >
          CPMI
        </span>
        <span
          className={cn(
            "rounded-[2px] bg-secondary-500 shadow-sm",
            barSizes[size]
          )}
        />
      </div>
      {showSubtitle && (
        <span
          className={cn(
            "text-[7px] sm:text-[8px] font-bold tracking-[0.16em] uppercase whitespace-nowrap mt-1 leading-none",
            compactOnMobile && "hidden sm:block",
            isLight ? "text-white/80" : "text-gray-700"
          )}
        >
          Certification Professionals Mastery Institute
        </span>
      )}
    </div>
  );
}
