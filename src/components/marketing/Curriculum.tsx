"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronRight, Download, ListChecks } from "lucide-react";

import { modules, type ModuleData } from "@/lib/data";
import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

function ModuleDetail({ module: m, framed }: { module: ModuleData; framed: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      key={m.id}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(framed ? "panel p-7 sm:p-9" : "px-4 pb-8 pt-2 sm:px-6")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.8125rem]">
        <p className="num font-medium text-ink-400">
          <span className="mr-3 rounded bg-primary-500 px-2 py-1 text-xs font-semibold text-white">{m.code}</span>
          {m.regulatoryRef}
        </p>
        <p className="num rounded-full bg-secondary-50 px-3 py-1 font-medium text-secondary-800 ring-1 ring-secondary-200">
          {m.duration} total
        </p>
      </div>

      <h3 className="mt-6 font-serif text-[1.625rem] font-medium leading-[1.15] tracking-[-0.015em] text-primary-900 sm:text-[2rem]">
        {m.title}
      </h3>
      <p className="mt-4 text-[0.9688rem] leading-[1.7] text-ink-500">{m.fullDesc}</p>

      <h4 className="mt-8 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-400">Lessons</h4>
      {m.lessons && m.lessons.length > 0 ? (
        <ol className="mt-3 divide-y divide-line-soft border-y border-line-soft">
          {m.lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-start gap-4 py-3.5">
              <span className="num mt-0.5 w-8 shrink-0 text-sm font-semibold text-primary-500">{lesson.lessonNumber}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-medium leading-snug text-ink">{lesson.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[0.8125rem] text-ink-400 sm:line-clamp-1">{lesson.summary}</p>
              </div>
              <span className="num shrink-0 text-[0.8125rem] text-ink-400">{lesson.duration}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 border-y border-line-soft py-5 text-[0.9375rem] leading-relaxed text-ink-500">
          {m.shortDesc} The module has <span className="num">{m.lessonsCount}</span> lessons and an end-of-module quiz.
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-ink-500">
          <span className="flex items-center gap-1.5">
            <Download size={14} className="text-secondary-700" aria-hidden /> Downloadable guide
          </span>
          <span className="flex items-center gap-1.5">
            <ListChecks size={14} className="text-secondary-700" aria-hidden /> End-of-module quiz
          </span>
        </p>
        <Link href="/auth/login" className="btn-forest !px-4 !py-2.5">
          Enroll in this module <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </motion.article>
  );
}

export default function Curriculum() {
  const [active, setActive] = useState(3);
  const selected = modules[active] ?? modules[0];

  return (
    <section id="curriculum" className="bg-white py-24 lg:py-28">
      <div className="wrap">
        <Reveal>
          <SectionHead index="02" label="The curriculum" title="Eleven modules, from certification to the jobsite">
            <p>
              Each module combines video and reading lessons with a downloadable guide and an end-of-module quiz. The
              full sequence covers the complete regulatory lifecycle.
            </p>
          </SectionHead>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <ol aria-label="Modules" className="border-t border-line lg:col-span-5">
            {modules.map((m, idx) => {
              const isActive = idx === active;
              return (
                <li key={m.id} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setActive(idx)}
                    aria-current={isActive ? "true" : undefined}
                    aria-expanded={isActive}
                    className={cn(
                      "group flex w-full items-center gap-4 py-4 pl-4 pr-3 text-left transition-colors",
                      isActive ? "bg-paper shadow-[inset_3px_0_0_#CFB112]" : "hover:bg-paper/70"
                    )}
                  >
                    <span className={cn("num w-8 shrink-0 text-sm font-semibold", isActive ? "text-secondary-700" : "text-ink-400")}>
                      {m.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[0.9688rem] font-medium leading-snug", isActive ? "text-primary-500" : "text-ink")}>
                        {m.title}
                      </span>
                      <span className="num mt-0.5 block text-[0.8125rem] text-ink-400">
                        {m.lessonsCount} lessons · {m.duration}
                      </span>
                    </span>
                    <ChevronRight
                      size={16}
                      aria-hidden
                      className={cn(
                        "shrink-0 transition-transform",
                        isActive ? "rotate-90 text-secondary-700 lg:rotate-0 lg:translate-x-0.5" : "text-ink-400 group-hover:translate-x-0.5"
                      )}
                    />
                  </button>

                  {/* Small screens: the detail opens directly under the module that was tapped. */}
                  <div className="bg-paper lg:hidden">
                    <AnimatePresence initial={false}>{isActive ? <ModuleDetail module={m} framed={false} /> : null}</AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Large screens: a sticky detail panel beside the list. */}
          <div className="hidden lg:col-span-7 lg:block">
            <div aria-live="polite" className="lg:sticky lg:top-28">
              <AnimatePresence mode="wait" initial={false}>
                <ModuleDetail key={selected.id} module={selected} framed />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
