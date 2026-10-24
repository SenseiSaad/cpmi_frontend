import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const AUDIENCES = [
  {
    role: "For agencies",
    title: "Purchasing contacts and DOTs",
    summary: "Built around state and federal procurement, with every agency's data kept strictly separate.",
    points: [
      "Purchase-order invoicing alongside card payments",
      "Seat pools, reassigned instantly when staff leave",
      "Bulk onboarding from a CSV roster",
      "CSV and PDF compliance reports for FHWA and FTA audits",
    ],
    cta: "Agency admin sign in",
  },
  {
    role: "For enrolled staff",
    title: "Compliance officers and learners",
    summary: "A self-paced portal that works on desktop, tablet and phone, and remembers where you stopped.",
    points: [
      "Eleven self-paced modules, resumable anywhere",
      "Server-verified video progress that cannot be skipped client-side",
      "Downloadable regulatory guides, templates and spreadsheets",
      "Official PDF certificate as soon as you pass",
    ],
    cta: "Learner sign in",
  },
  {
    role: "For program leadership",
    title: "Training managers and administrators",
    summary: "Platform governance, content authoring and credential oversight in one console.",
    points: [
      "Cross-agency enrollment and completion reporting",
      "Question-bank management and score distributions",
      "Certificate issuance, revocation and audit ledger",
      "Automated invitation, completion and renewal emails",
    ],
    cta: "Staff console",
  },
];

export default function Audiences() {
  return (
    <section id="solutions" className="on-dark bg-primary-900 py-24 text-white lg:py-28">
      <div className="wrap">
        <Reveal>
          <SectionHead index="03" label="Who it serves" title="One platform for the three people who run a compliance program" tone="dark">
            <p>
              Agency buyers, the staff who take the training, and the team that maintains the content each get a
              purpose-built workspace.
            </p>
          </SectionHead>
        </Reveal>

        <div className="mt-16 grid gap-x-10 gap-y-14 md:grid-cols-3">
          {AUDIENCES.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.08} className="flex flex-col border-t border-white/20 pt-8">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-secondary-400">{a.role}</p>
              <h3 className="t-h3 mt-3 text-white">{a.title}</h3>
              <p className="mt-3 text-[0.9688rem] leading-[1.7] text-white/70">{a.summary}</p>
              <ul className="mt-6 space-y-3.5 text-[0.9375rem] leading-snug text-white/85">
                {a.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Check size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-secondary-400" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/login"
                className="group mt-8 inline-flex items-center gap-2 pt-1 text-[0.9375rem] font-semibold text-secondary-400 transition-colors hover:text-secondary-300 md:mt-auto"
              >
                {a.cta}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
