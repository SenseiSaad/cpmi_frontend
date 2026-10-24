"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";

import Logo from "@/components/shared/Logo";
import { sampleQuizQuestions } from "@/lib/data";
import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const FEATURES = [
  {
    title: "Randomized question banks",
    body: "Questions and answers are shuffled for each candidate, so answers cannot be shared across an agency cohort.",
  },
  {
    title: "Scenario and matching questions",
    body: "Multiple choice, true/false and term-to-definition matching that test how the rules are applied.",
  },
  {
    title: "Immutable audit trail",
    body: "Every completion, score, attempt and verification is permanently recorded for state and federal audits.",
  },
  {
    title: "Configurable passing and retakes",
    body: "An 80% passing threshold by default, with retake intervals set by program policy.",
  },
];

const QUESTIONS = sampleQuizQuestions.slice(0, 5);

function QuizPreview() {
  const [index, setIndex] = useState(2);
  const [picked, setPicked] = useState<Record<number, string>>({ 2: "B" });
  const q = QUESTIONS[index];
  const answered = Object.keys(picked).length;
  const percent = Math.round(((index + 1) / QUESTIONS.length) * 100);

  return (
    <div className="panel p-6 sm:p-8" role="group" aria-label="Interactive assessment preview">
      <div className="flex items-center justify-between gap-4 border-b border-line-soft pb-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" showSubtitle={false} />
          <span className="text-[0.8125rem] text-ink-400">Module 4 assessment</span>
        </div>
        <p
          className="num flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[0.8125rem] font-medium text-ink-700"
          aria-label="Time remaining: 18 minutes 32 seconds"
        >
          <Clock size={14} aria-hidden /> 00:18:32
        </p>
      </div>

      <div className="mt-5">
        <div className="num flex justify-between text-[0.8125rem] text-ink-500">
          <span>
            Question {index + 1} of {QUESTIONS.length}
          </span>
          <span>{answered} answered</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Assessment progress">
          <div className="h-full rounded-full bg-primary-500 transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="font-serif text-[1.1875rem] font-medium leading-snug text-primary-900">{q.question}</legend>
        <div className="mt-5 space-y-2.5">
          {q.options.map((opt) => {
            const isPicked = picked[index] === opt.id;
            return (
              <label
                key={opt.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3.5 rounded-md border px-4 py-3.5 text-[0.9375rem] leading-snug transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 has-[:focus-visible]:ring-offset-2",
                  isPicked ? "border-primary-500 bg-primary-50/60 text-primary-900" : "border-line bg-white text-ink-700 hover:border-ink-400"
                )}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt.id}
                  checked={isPicked}
                  onChange={() => setPicked((p) => ({ ...p, [index]: opt.id }))}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "num mt-px grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                    isPicked ? "border-primary-500 bg-primary-500 text-white" : "border-line text-ink-400"
                  )}
                >
                  {isPicked ? <Check size={13} strokeWidth={3} /> : opt.label}
                </span>
                <span>{opt.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-5">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="btn-line !px-4 !py-2.5"
        >
          <ArrowLeft size={15} aria-hidden /> Previous
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(QUESTIONS.length - 1, i + 1))}
          disabled={index === QUESTIONS.length - 1}
          className="btn-forest !px-4 !py-2.5"
        >
          Next <ArrowRight size={15} aria-hidden />
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-ink-400">Preview only. Answers are not scored here.</p>
    </div>
  );
}

export default function Assessments() {
  return (
    <section id="assessments" className="border-y border-line bg-paper py-24 lg:py-28">
      <div className="wrap">
        <Reveal>
          <SectionHead index="04" label="Assessment and accreditation" title="Built for accreditation, and against answer-sharing">
            <p>
              To meet the Q2 2027 accreditation requirements, CPMI uses a purpose-built testing engine that removes
              opportunities for collusion and measures real regulatory comprehension.
            </p>
          </SectionHead>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-14">
          <ol className="divide-y divide-line border-y border-line lg:col-span-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <li className="flex gap-5 py-6">
                  <span className="num font-serif text-[1.375rem] font-medium leading-none text-secondary-700">0{i + 1}</span>
                  <div>
                    <h3 className="text-[1.0625rem] font-semibold leading-snug text-primary-900">{f.title}</h3>
                    <p className="mt-1.5 text-[0.9688rem] leading-[1.65] text-ink-500">{f.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.1} className="lg:col-span-6">
            <QuizPreview />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
