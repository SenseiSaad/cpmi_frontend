import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import Logo from "@/components/shared/Logo";

const COLUMNS = [
  {
    title: "Curriculum",
    links: [
      { label: "Introduction to the DBE program", href: "#curriculum" },
      { label: "Eligibility and certification", href: "#curriculum" },
      { label: "Goal setting", href: "#curriculum" },
      { label: "Monitoring and compliance", href: "#curriculum" },
      { label: "ACDBE airport concessions", href: "#curriculum" },
    ],
  },
  {
    title: "For agencies",
    links: [
      { label: "Agency admin sign in", href: "/auth/login" },
      { label: "Purchase orders and invoicing", href: "#procurement" },
      { label: "Seat management", href: "#solutions" },
      { label: "Verify a certificate", href: "#verify" },
    ],
  },
  {
    title: "Access",
    links: [
      { label: "Learner sign in", href: "/auth/login" },
      { label: "Staff console", href: "/auth/login" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="on-dark bg-primary-950 text-white/70">
      <div className="wrap py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo variant="light" size="md" />
            <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-white/65">
              Certification Professionals Mastery Institute provides DBE and ACDBE compliance training for state
              transportation departments, transit agencies and airport sponsors.
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm text-secondary-400">
              <ShieldCheck size={16} aria-hidden /> Built to WCAG 2.1 AA and Section 508
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8 lg:pl-10">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{col.title}</p>
                <ul className="mt-5 space-y-3 text-[0.9375rem]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Certification Professionals Mastery Institute. All rights reserved.</p>
          <p>Accreditation target: Q2 2027</p>
        </div>
      </div>
    </footer>
  );
}
