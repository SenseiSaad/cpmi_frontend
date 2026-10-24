import { FileCheck, Shield, UserCheck } from "lucide-react";

import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const PILLARS = [
  {
    icon: Shield,
    tag: "49 CFR Part 26",
    title: "Federal mandate and funding protection",
    body: "State DOTs and transit recipients must submit triennial DBE goals and enforce Commercially Useful Function reviews. Certified staff keep the agency audit-ready for FHWA and FTA oversight.",
  },
  {
    icon: UserCheck,
    tag: "Flexible seat licenses",
    title: "Staff turnover and onboarding readiness",
    body: "Turnover among civil rights and contract officers leaves agencies exposed. Buy a seat pool, reassign seats when staff change, and have new officers trained in days.",
  },
  {
    icon: FileCheck,
    tag: "Accreditation target Q2 2027",
    title: "Credentials that stand up to scrutiny",
    body: "Unlike a generic video library, CPMI verifies playback on the server, randomizes question banks, discourages answer-sharing and issues tamper-evident certificates.",
  },
];

export default function Mandate() {
  return (
    <section id="overview" className="bg-paper py-24 lg:py-28">
      <div className="wrap">
        <Reveal>
          <SectionHead index="01" label="The mandate" title="What CPMI certification is, and why your agency needs it">
            <p>
              Under federal law (<strong className="font-semibold text-ink">49 CFR Part 26</strong> for highway and
              transit, <strong className="font-semibold text-ink">Part 23</strong> for airport concessions), any agency
              receiving federal transportation grants must run an active DBE program. Falling short can put hundreds of
              millions of dollars in infrastructure funding at risk.
            </p>
          </SectionHead>
        </Reveal>

        <div className="mt-16 grid border-t border-line md:grid-cols-3 md:divide-x md:divide-line">
          {PILLARS.map(({ icon: Icon, tag, title, body }, i) => (
            <Reveal key={title} delay={i * 0.08} className="border-b border-line py-10 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0">
              <Icon size={26} strokeWidth={1.5} className="text-primary-500" aria-hidden />
              <p className="eyebrow mt-6">{tag}</p>
              <h3 className="t-h3 mt-3 text-primary-900">{title}</h3>
              <p className="mt-3 text-[0.9688rem] leading-[1.7] text-ink-500">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
