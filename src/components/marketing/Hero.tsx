import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Reveal } from "./Reveal";

const GLANCE = [
  { term: "Curriculum", value: "11 modules", detail: "Complete DBE and ACDBE scope under 49 CFR Parts 26 and 23." },
  { term: "Assessment", value: "80% to pass", detail: "Randomized question banks with controlled retakes." },
  { term: "Credential", value: "Verifiable certificate", detail: "Tamper-evident PDF with a public lookup." },
  { term: "Accessibility", value: "WCAG 2.1 AA", detail: "Designed for Section 508 and screen-reader use." },
];

const POINTS = ["Self-paced, resume anywhere", "Server-verified lesson progress", "Seats reassignable when staff change", "Purchase-order invoicing"];

export default function Hero() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-primary-900 text-white">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.18] mix-blend-luminosity"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1800&q=80')" }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-950 via-primary-900/95 to-primary-900/70" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-secondary-500/50 to-transparent" />

      <div className="wrap grid gap-14 py-20 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-28">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="flex items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-secondary-300">
              <span aria-hidden className="h-px w-8 bg-secondary-400" />
              DBE / ACDBE compliance training
            </p>
            <h1 className="t-display mt-6 text-white">
              Build a Stronger Tomorrow
              <span className="mt-1 block italic text-secondary-400">with CPMI Certification</span>
            </h1>
            <p className="mt-7 max-w-xl text-[1.0625rem] leading-[1.7] text-white/80 sm:text-lg">
              Government agencies rely on CPMI for DBE and ACDBE compliance training. Give your team the knowledge,
              skills and verifiable certification to run federally funded transportation programs with confidence.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-gold">
                Register your agency <ArrowRight size={17} aria-hidden />
              </Link>
              <Link href="#curriculum" className="btn-line-light">
                Explore the curriculum
              </Link>
            </div>

            <ul className="mt-10 grid max-w-xl gap-x-8 gap-y-3 text-[0.9375rem] text-white/80 sm:grid-cols-2">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-1 shrink-0 text-secondary-400" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={0.12}>
            <aside
              aria-labelledby="glance-title"
              className="overflow-hidden rounded-lg border border-white/15 bg-primary-950/60 shadow-lift"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-7 py-4">
                <h2 id="glance-title" className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-secondary-300">
                  Program at a glance
                </h2>
                <span aria-hidden className="h-1.5 w-8 rounded-full bg-secondary-500" />
              </div>
              <dl className="divide-y divide-white/10">
                {GLANCE.map((row) => (
                  <div key={row.term} className="px-7 py-5">
                    <dt className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-white/50">{row.term}</dt>
                    <dd className="mt-1.5">
                      <span className="font-serif text-[1.375rem] font-medium leading-tight text-white">{row.value}</span>
                      <span className="mt-1 block text-[0.9375rem] leading-relaxed text-white/65">{row.detail}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 bg-primary-950/50 px-7 py-4 text-[0.8125rem]">
                <p className="text-white/60">
                  Target delivery
                  <span className="num mt-0.5 block font-medium text-white">Q4 2026</span>
                </p>
                <p className="text-white/60">
                  Accreditation target
                  <span className="num mt-0.5 block font-medium text-secondary-400">Q2 2027</span>
                </p>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
