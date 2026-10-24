"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import Logo from "@/components/shared/Logo";

const ASSURANCES = [
  "Lesson progress verified on the server",
  "Randomized assessments, controlled retakes",
  "Certificates anyone can verify online",
];

/** Split-screen frame shared by every sign-in related page. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="on-dark relative hidden flex-1 overflow-hidden bg-primary-900 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-[0.16] mix-blend-luminosity"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&q=80')" }}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900/95 to-primary-800/80" />

        <div className="relative z-10 flex w-full max-w-2xl flex-col justify-between p-12 xl:p-16">
          <Link href="/" aria-label="CPMI home" className="inline-block self-start rounded">
            <Logo variant="light" size="md" />
          </Link>

          <div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="flex items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-secondary-300">
                <span aria-hidden className="h-px w-8 bg-secondary-400" />
                Certification Academy
              </p>
              <h2 className="t-display mt-6 text-white">
                Compliance. Training.
                <span className="block italic text-secondary-400">Impact.</span>
              </h2>
              <p className="mt-6 max-w-md text-[1.0625rem] leading-[1.7] text-white/75">
                Training and verified DBE / ACDBE compliance credentials for transportation agencies.
              </p>
            </motion.div>

            <ul className="mt-10 max-w-md space-y-3.5 border-t border-white/15 pt-8 text-[0.9375rem] text-white/80">
              {ASSURANCES.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0 text-secondary-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-white/45">© 2026 Certification Professionals Mastery Institute</p>
        </div>
      </aside>

      <main id="main-content" className="flex w-full flex-col lg:max-w-[34rem] xl:max-w-[38rem]">
        <div className="flex items-center justify-between px-6 pt-6 sm:px-10 lg:justify-end lg:pt-8">
          <Link href="/" aria-label="CPMI home" className="rounded lg:hidden">
            <Logo size="md" showSubtitle={false} />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded text-sm font-medium text-ink-500 transition-colors hover:text-primary-500"
          >
            <ArrowLeft size={15} aria-hidden /> Back to website
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[26rem]"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

/** Page heading used inside AuthLayout. */
export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <>
      <h1 className="font-serif text-[2.125rem] font-medium leading-[1.1] tracking-[-0.02em] text-primary-900">{title}</h1>
      {children ? <p className="mt-3 text-[0.9688rem] leading-relaxed text-ink-500">{children}</p> : null}
    </>
  );
}
