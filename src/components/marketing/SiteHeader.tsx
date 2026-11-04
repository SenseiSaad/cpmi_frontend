"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import Logo from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#overview", id: "overview", label: "About CPMI" },
  { href: "#curriculum", id: "curriculum", label: "Curriculum" },
  { href: "#solutions", id: "solutions", label: "For agencies" },
  { href: "#assessments", id: "assessments", label: "Accreditation" },
  { href: "#procurement", id: "procurement", label: "Procurement & PO" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the nav item for the section currently in the middle of the viewport.
  useEffect(() => {
    // Sections without a nav entry (verify, faq) still count, so the highlight clears when you pass the last nav section.
    const ids = [...LINKS.map((l) => l.id), "verify", "faq"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const navIds = new Set(LINKS.map((l) => l.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(navIds.has(entry.target.id) ? entry.target.id : null);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    const onTop = () => window.scrollY < 200 && setActive(null);
    window.addEventListener("scroll", onTop, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onTop);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="on-dark bg-primary-950 text-[0.8125rem] text-white/80">
        <div className="wrap flex h-9 items-center justify-between gap-6">
          <p className="truncate">
            <span className="font-semibold text-secondary-400">Official standards</span>
            <span className="hidden sm:inline">
              <span className="mx-2 text-white/30">/</span>
              49 CFR Part 26 (DBE) and Part 23 (ACDBE)
              <span className="mx-2 text-white/30">/</span>
              WCAG 2.1 AA, Section 508
            </span>
          </p>
          <nav aria-label="Utility" className="flex shrink-0 items-center gap-5">
            <Link href="#verify" className="transition-colors hover:text-secondary-400">
              Verify a credential
            </Link>
            <Link href="/auth/login" className="hidden transition-colors hover:text-secondary-400 md:inline">
              Agency support
            </Link>
          </nav>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-shadow duration-200",
          scrolled ? "border-line shadow-[0_6px_20px_-12px_rgba(23,35,26,0.35)]" : "border-line-soft"
        )}
      >
        <div className="wrap flex h-[72px] items-center justify-between gap-6">
          <Link href="/" aria-label="CPMI home" className="min-w-0 shrink rounded">
            <span className="sm:hidden">
              <Logo size="md" showSubtitle={false} />
            </span>
            <span className="hidden sm:block">
              <Logo size="md" />
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex">
            {LINKS.map((link) => {
              const isActive = active === link.id;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "relative whitespace-nowrap rounded px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                    isActive ? "text-primary-500" : "text-ink-700 hover:text-primary-500"
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 -bottom-px h-0.5 origin-left bg-secondary-500 transition-transform duration-300",
                      isActive ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="hidden whitespace-nowrap rounded px-3 py-2 text-[0.9375rem] font-semibold text-primary-500 transition-colors hover:text-primary-700 sm:inline"
            >
              Sign in
            </Link>
            <Link href="/register" className="btn-gold !px-4 !py-2.5 focus-visible:!ring-offset-white sm:!px-5">
              Register your agency
            </Link>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-md border border-line text-ink-700 transition-colors hover:bg-paper xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div
          id="mobile-nav"
          className={cn(
            "grid overflow-hidden border-line bg-white transition-[grid-template-rows] duration-300 xl:hidden",
            open ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr]"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <nav aria-label="Mobile" className={cn("wrap py-3", !open && "invisible")}>
              <ul className="divide-y divide-line-soft">
                {LINKS.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-3.5 text-base font-medium text-ink-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-3.5 text-base font-semibold text-primary-500"
                  >
                    Sign in
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
