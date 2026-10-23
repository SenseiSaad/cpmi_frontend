"use client";

import { motion } from "motion/react";
import { Award, BadgeCheck, GraduationCap, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { ProgressRing } from "@/components/ui/progress";

const POINTS = [
  { icon: Users, text: "Buy seats once, assign and reassign as your team changes" },
  { icon: GraduationCap, text: "11 modules, quizzes and a final exam — progress tracked server-side" },
  { icon: Award, text: "Certificates anyone can verify, with a permanent audit trail" },
];

function HeroPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-brand-600/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-[26rem] rounded-full bg-navy-600/50 blur-3xl" aria-hidden />

      <div className="relative">
        <Logo />
      </div>

      <div className="relative">
        <motion.h2 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-5xl">
          Train your team.
          <br />
          <span className="bg-gradient-to-r from-brand-400 to-amber-300 bg-clip-text text-transparent">Prove compliance.</span>
        </motion.h2>
        <ul className="mt-8 max-w-md space-y-4">
          {POINTS.map((p, i) => (
            <motion.li key={p.text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="flex items-start gap-3 text-navy-100">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-400">
                <p.icon className="size-4" aria-hidden />
              </span>
              <span className="text-[15px] leading-snug">{p.text}</span>
            </motion.li>
          ))}
        </ul>

        <div className="relative mt-12 h-44 max-w-md" aria-hidden>
          <motion.div initial={{ opacity: 0, y: 30, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ delay: 0.7, duration: 0.8 }} className="absolute left-0 top-0 w-60 animate-float rounded-3xl bg-white p-4 shadow-lift">
            <div className="flex items-center gap-3">
              <ProgressRing value={72} size={58} stroke={7} label="Course progress" tone="brand">
                <span className="tnum text-sm font-extrabold text-navy-900">72%</span>
              </ProgressRing>
              <div>
                <p className="text-sm font-bold text-navy-900">Module 7 in progress</p>
                <p className="text-xs text-ink-600">Counting DBE Participation</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 3 }} transition={{ delay: 0.9, duration: 0.8 }} className="absolute bottom-0 right-0 w-56 animate-float rounded-3xl bg-white p-4 shadow-lift [animation-delay:-3s]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <BadgeCheck className="size-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy-900">Certificate verified</p>
                <p className="text-xs text-ink-600">CA-2026-M0412-7XQ9</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <p className="relative flex items-center gap-2 text-sm text-navy-300">
        <ShieldCheck className="size-4 text-brand-400" aria-hidden />
        Built for public agencies · WCAG 2.1 AA · Section 508
      </p>
    </div>
  );
}

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <HeroPanel />
      <main id="main" tabIndex={-1} className="flex flex-col outline-none">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Logo tone="dark" />
        </div>
        <div className="flex flex-1 items-center justify-start px-5 pb-10 pt-2 sm:px-10 lg:px-16 lg:py-12 xl:px-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md text-left">
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-navy-900">{title}</h1>
            {subtitle ? <p className="mt-2 text-pretty text-ink-600">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-8 text-left text-sm text-ink-600">{footer}</div> : null}
          </motion.div>
        </div>
        <p className="px-5 pb-6 text-left text-xs text-ink-500 sm:px-10 lg:px-16 xl:px-24">
          <Link href="/" className="font-medium underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
