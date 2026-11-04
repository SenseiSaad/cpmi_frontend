import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "./Reveal";

export default function CtaBand() {
  return (
    <section className="bg-secondary-500 text-primary-900">
      <div className="wrap grid items-center gap-8 py-16 lg:grid-cols-12 lg:py-20">
        <Reveal className="lg:col-span-7">
          <h2 className="t-h2 text-primary-900">Equip your team with official DBE / ACDBE credentials.</h2>
          <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-primary-900/80">
            Keep your agency audit-ready and your federal transportation funding protected, with training your staff can
            complete at their own pace.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
          <Link href="/register" className="btn-ink">
            Register your agency <ArrowRight size={17} aria-hidden />
          </Link>
          <Link
            href="#procurement"
            className="btn border border-primary-900/40 text-primary-900 hover:border-primary-900 hover:bg-primary-900/5 focus-visible:ring-primary-900 focus-visible:ring-offset-secondary-500"
          >
            Procurement options
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
