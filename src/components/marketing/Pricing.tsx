import Link from "next/link";
import { Check } from "lucide-react";

import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const PLANS = [
  {
    tag: "Complete program",
    name: "Annual agency seat license",
    blurb: "The full eleven-module certification program with one year of access.",
    price: "$1,495",
    unit: "per seat, per year",
    note: "Volume discounts available for 10 or more seats.",
    points: [
      "All 11 modules and the comprehensive final exam",
      "Unlimited seat reassignment when staff change",
      "Official PDF certificates with public verification",
      "Purchase-order invoicing on net-30 terms",
    ],
    cta: "Request an agency PO quote",
    featured: true,
  },
  {
    tag: "Modular",
    name: "Per-module enrollment",
    blurb: "Enroll staff in the modules they need, or pay in monthly installments.",
    price: "$175",
    unit: "per module enrolled",
    note: "Suited to refresher training and specialist compliance roles.",
    points: [
      "Choose specific modules, such as ACDBE concessions or goal setting",
      "Individual module assessment and certificate",
      "Automated monthly billing and receipts through Stripe",
      "Bulk CSV invitations and roster upload",
    ],
    cta: "Explore modular options",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="procurement" className="bg-paper py-24 lg:py-28">
      <div className="wrap">
        <Reveal>
          <SectionHead index="06" label="Procurement" title="Purchasing that follows government procurement rules">
            <p>
              Many agencies cannot put software on a credit card. Alongside card payment, CPMI issues invoices for state
              and federal purchase orders.
            </p>
          </SectionHead>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:gap-8">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08} className="flex">
              <article
                className={`panel flex w-full flex-col border-t-4 p-8 sm:p-10 ${plan.featured ? "border-t-secondary-500" : "border-t-line"}`}
              >
                <p className="eyebrow">{plan.tag}</p>
                <h3 className="t-h3 mt-3 text-primary-900">{plan.name}</h3>
                <p className="mt-2 text-[0.9688rem] leading-relaxed text-ink-500">{plan.blurb}</p>

                <p className="mt-8 flex items-baseline gap-2">
                  <span className="num font-serif text-[3.25rem] font-medium leading-none tracking-[-0.02em] text-primary-900">
                    {plan.price}
                  </span>
                  <span className="text-[0.9375rem] text-ink-500">{plan.unit}</span>
                </p>
                <p className="mt-2 text-sm text-ink-400">{plan.note}</p>

                <ul className="mt-8 space-y-3.5 border-t border-line-soft pt-8 text-[0.9375rem] leading-snug text-ink-700">
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <Check size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-primary-500" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>

                <Link href="/auth/login" className={`${plan.featured ? "btn-forest" : "btn-line"} mt-10 w-full md:mt-auto`}>
                  {plan.cta}
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
