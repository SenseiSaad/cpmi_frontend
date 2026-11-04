"use client";

import { Award, BookOpen, FileEdit, Layers, Library, Plus, Search, Tag } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Panel } from "@/components/ui/panel";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useDebounced, useOverviewPage } from "@/lib/api/lists";
import type { CourseOverviewRow } from "@/lib/api/studio";
import { formatCurrency } from "@/lib/utils";

const CERT: Record<string, string> = {
  final_only: "Certificate after the final exam",
  module_and_final: "Certificate per module + final",
  none: "No certificate",
};

function CourseCard({ c }: { c: CourseOverviewRow }) {
  const live = c.products.filter((p) => p.status === "active");
  return (
    <li className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-800"><BookOpen className="size-5" aria-hidden /></span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold tracking-tight text-ink-900">{c.title}</h3>
            <p className="font-mono text-xs text-ink-600">{c.code} · version {c.version}</p>
          </div>
        </div>
        <ButtonLink href={`/admin/content/builder?course=${c.uuid}`} icon={<FileEdit className="size-4" aria-hidden />}>Edit content</ButtonLink>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
        <div className="flex items-center gap-1.5"><Layers className="size-4 text-ink-500" aria-hidden /><dt className="sr-only">Size</dt><dd>{c.modules} module{c.modules === 1 ? "" : "s"} · {c.lessons} lessons</dd></div>
        <div className="flex items-center gap-1.5"><Award className="size-4 text-ink-500" aria-hidden /><dt className="sr-only">Certificate</dt><dd>{c.hasFinal ? "Final exam" : "No final exam"} · {c.certificateMode ? CERT[c.certificateMode] ?? c.certificateMode : "—"}</dd></div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-canvas-soft p-3">
        <Tag className="size-4 text-ink-500" aria-hidden />
        {live.length > 0 ? (
          <>
            <Badge tone="ok" dot>On sale</Badge>
            {live.flatMap((p) => p.prices.map((pr) => <Badge key={pr.id} tone="brand">{formatCurrency(pr.unitAmountMinor / 100)} / {pr.billingPeriod === "annual" ? "year" : "month"}</Badge>))}
            <ButtonLink href="/admin/courses" size="sm" variant="ghost">Change price</ButtonLink>
          </>
        ) : (
          <>
            <Badge tone="warn" dot>Not on sale</Badge>
            <ButtonLink href={`/admin/courses?sell=${c.uuid}`} size="sm" variant="soft">Sell this course</ButtonLink>
          </>
        )}
      </div>
    </li>
  );
}

const PAGE_SIZE = 8;

export default function ContentStudioPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(search.trim());
  const overview = useOverviewPage({ search: term, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const rows = overview.data?.items ?? [];
  const total = overview.data?.total ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Content studio"
        subtitle="Create and edit the courses themselves: modules, lessons, videos and quizzes. Prices and what is on sale are handled in Catalog & pricing."
        actions={
          <>
            <ButtonLink href="/admin/courses" variant="secondary" icon={<Tag className="size-4" aria-hidden />}>Catalog & pricing</ButtonLink>
            <ButtonLink href="/admin/content/builder" icon={<Plus className="size-4" aria-hidden />}>Create a course</ButtonLink>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["1", "Build it", "Name the course, add modules and lessons (text, video or both), add quizzes and a final exam."],
          ["2", "Preview and publish", "See it as a learner would, then publish. Published content is locked; editing makes a new version."],
          ["3", "Sell it", "Set a price while publishing, or later under Catalog & pricing."],
        ].map(([n, title, text]) => (
          <div key={n} className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-navy-900/[0.04]">
            <span className="grid size-7 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">{n}</span>
            <p className="mt-2 font-bold text-ink-900">{title}</p>
            <p className="mt-0.5 text-sm text-ink-600">{text}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <label htmlFor="course-search" className="sr-only">Search courses</label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
        <Input id="course-search" type="search" autoComplete="off" className="pl-10" placeholder="Search courses" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {overview.isError ? (
        <Panel><ErrorState message={overview.error instanceof Error ? overview.error.message : undefined} onRetry={() => void overview.refetch()} /></Panel>
      ) : overview.isPending ? (
        <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : rows.length === 0 ? (
        <Panel>
          <EmptyState icon={Library} title={term ? "No course matches" : "No courses yet"} description={term ? "Try a different search." : "Create your first course. It takes a few minutes."} action={term ? undefined : <ButtonLink href="/admin/content/builder" icon={<Plus className="size-4" aria-hidden />}>Create a course</ButtonLink>} />
        </Panel>
      ) : (
        <>
          <ul className="space-y-4">{rows.map((c: CourseOverviewRow) => <CourseCard key={c.uuid} c={c} />)}</ul>
          <div className="mt-5"><Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))} onChange={setPage} total={total} pageSize={PAGE_SIZE} /></div>
        </>
      )}
    </>
  );
}
