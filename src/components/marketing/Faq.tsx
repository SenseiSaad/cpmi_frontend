"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const FAQS = [
  {
    q: "Can our agency pay by purchase order instead of a credit card?",
    a: "Yes. Many procurement departments cannot use a card for software licenses, so we issue invoices on net-30 terms for state and federal purchase orders, with W-9 forms and vendor registration support.",
  },
  {
    q: "What happens if a trained employee leaves the agency?",
    a: "An agency administrator can reassign the seat to another staff member at no extra cost. The earlier employee's certificate stays on record in the audit ledger.",
  },
  {
    q: "Does the course satisfy USDOT and FHWA DBE program requirements?",
    a: "The curriculum trains staff in the mandates of 49 CFR Part 26 and Part 23, including triennial goal setting, Commercially Useful Function reviews, Good Faith Efforts and uniform reporting.",
  },
  {
    q: "How does server-side video tracking work?",
    a: "The player sends periodic progress signals to our servers. A lesson cannot be completed by skipping ahead in the browser; a minimum verified watch time is enforced.",
  },
  {
    q: "Is the platform accessible under Section 508 and WCAG 2.1 AA?",
    a: "Accessibility is a design requirement: strong contrast, screen-reader support, full keyboard navigation and captions. Government buyers can request our accessibility conformance documentation.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-24 lg:py-28">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <SectionHead index="07" label="Questions" title="Frequently asked questions" stacked />
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-8">
          <div className="divide-y divide-line border-y border-line">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <h3>
                    <button
                      type="button"
                      id={`faq-btn-${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-start justify-between gap-6 py-6 text-left"
                    >
                      <span className={cn("text-[1.0625rem] font-medium leading-snug transition-colors sm:text-lg", isOpen ? "text-primary-500" : "text-ink")}>
                        {item.q}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border transition-all duration-300",
                          isOpen ? "rotate-45 border-primary-500 bg-primary-500 text-white" : "border-line text-ink-500"
                        )}
                      >
                        <Plus size={15} />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-btn-${i}`}
                    aria-hidden={!isOpen}
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="max-w-2xl pb-7 pr-12 text-[0.9688rem] leading-[1.75] text-ink-500">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
