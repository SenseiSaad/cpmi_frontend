"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, ShieldCheck } from "lucide-react";

import Logo from "@/components/shared/Logo";
import { certificates } from "@/lib/data";

import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

type Certificate = (typeof certificates)[number];

function CertificateCard({ cert }: { cert: Certificate }) {
  return (
    <div className="relative bg-white p-3 shadow-lift ring-1 ring-line">
      <div className="relative border border-secondary-500/60 px-6 py-10 text-center sm:px-12 sm:py-12">
        <span aria-hidden className="pointer-events-none absolute inset-1.5 border border-secondary-500/25" />
        <div className="flex justify-center">
          <Logo size="md" className="!items-center" />
        </div>
        <p className="mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.28em] text-ink-400">Certificate of completion</p>

        <p className="mt-8 text-sm italic text-ink-500">This certifies that</p>
        <p className="mx-auto mt-2 inline-block border-b border-secondary-500 px-4 pb-2 font-serif text-[2rem] font-medium leading-tight tracking-[-0.01em] text-primary-900 sm:text-[2.375rem]">
          {cert.recipientName}
        </p>

        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink-500">
          has satisfied all curriculum requirements, module assessments and the final examination for
        </p>
        <p className="mt-2 font-serif text-xl font-medium text-primary-900">{cert.courseName}</p>

        <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 text-left">
          {[
            ["Certificate ID", cert.id],
            ["Issued", cert.issueDate],
            ["Expires", cert.expiryDate],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-400">{term}</dt>
              <dd className="num mt-1 break-words text-[0.8125rem] font-medium text-ink">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-400">Status</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600">
                <ShieldCheck size={13} aria-hidden /> {cert.verificationStatus}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-10 flex justify-center">
          <div className="w-52 border-t border-ink-400 pt-2 text-xs text-ink-500">{cert.signerTitle}</div>
        </div>
      </div>
    </div>
  );
}

export default function Verify() {
  const [input, setInput] = useState(certificates[0].id);
  const [result, setResult] = useState<Certificate | null>(certificates[0]);
  const [error, setError] = useState("");
  const reduce = useReducedMotion();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = certificates.find((c) => c.id.toLowerCase() === input.trim().toLowerCase());
    if (found) {
      setError("");
      setResult(found);
    } else {
      setResult(null);
      setError("No active certificate matches that ID. Check the number and try again.");
    }
  }

  return (
    <section id="verify" className="bg-white py-24 lg:py-28">
      <div className="wrap">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <SectionHead index="05" label="Public verification" title="Verify any credential in seconds" stacked>
              <p>
                Anyone can confirm that an officer&apos;s certification is current. Lookups need no account, are
                rate-limited, and read from a tamper-resistant record.
              </p>
            </SectionHead>

            <form onSubmit={onSubmit} className="mt-8" noValidate>
              <label htmlFor="cert-id" className="text-sm font-semibold text-ink">
                Certificate ID
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="cert-id"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="CPMI-2026-000123"
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby={error ? "cert-error" : "cert-hint"}
                    aria-invalid={error ? true : undefined}
                    className="num h-12 w-full rounded-md border border-line bg-white pl-10 pr-4 text-[0.9375rem] text-ink placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
                  />
                </div>
                <button type="submit" className="btn-forest h-12">
                  Verify
                </button>
              </div>
              {error ? (
                <p id="cert-error" role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </p>
              ) : (
                <p id="cert-hint" className="mt-3 text-sm text-ink-400">
                  Try the sample ID <span className="num font-medium text-ink-700">CPMI-2026-000123</span>.
                </p>
              )}
            </form>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {result ? (
                  <motion.div
                    key={result.id}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CertificateCard cert={result} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid min-h-[22rem] place-items-center border border-dashed border-line bg-paper px-8 text-center text-ink-500"
                  >
                    <p className="max-w-xs text-[0.9375rem] leading-relaxed">
                      The verified certificate appears here when you search for a valid ID.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
