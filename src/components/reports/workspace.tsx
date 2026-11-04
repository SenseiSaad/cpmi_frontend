"use client";

import { Banknote, CalendarClock, Download, GraduationCap, Hourglass, Moon, Percent, Repeat, Ticket, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { Badge, StatusPill } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import {
  csvHref,
  formatDuration,
  useReport,
  type AgencyAccountRow,
  type CompletedCourseRow,
  type CompletionsResponse,
  type CourseProgressRow,
  type DormantRow,
  type ReportName,
  type ReportParams,
  type RevenueResponse,
  type Rows,
  type StudentsResponse,
  type SubscriptionRow,
  type SubscriptionsResponse,
  type SummaryResponse,
} from "@/lib/api/analytics";
import { useAgencyLearners, type AgencyLearnerLine } from "@/lib/api/people";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---- Period ------------------------------------------------------------------------------------------------------------

type Preset = "7d" | "30d" | "month" | "quarter" | "year" | "12m" | "custom";
const PRESETS: { value: Preset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
  { value: "12m", label: "Last 12 months" },
  { value: "custom", label: "Pick dates…" },
];
const ymd = (d: Date) => d.toISOString().slice(0, 10);
function presetRange(p: Preset): { from: string; to: string } {
  const now = new Date();
  const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const today = utc(y, m, now.getUTCDate());
  switch (p) {
    case "7d": return { from: ymd(new Date(today.getTime() - 6 * 86_400_000)), to: ymd(today) };
    case "month": return { from: ymd(utc(y, m, 1)), to: ymd(today) };
    case "quarter": return { from: ymd(utc(y, Math.floor(m / 3) * 3, 1)), to: ymd(today) };
    case "year": return { from: ymd(utc(y, 0, 1)), to: ymd(today) };
    case "12m": return { from: ymd(utc(y - 1, m, now.getUTCDate() + 1)), to: ymd(today) };
    default: return { from: ymd(new Date(today.getTime() - 29 * 86_400_000)), to: ymd(today) };
  }
}
const toParams = (r: { from: string; to: string }): ReportParams => ({ from: `${r.from}T00:00:00.000Z`, to: `${r.to}T23:59:59.999Z` });

function PeriodBar({ preset, range, onPreset, onRange }: { preset: Preset; range: { from: string; to: string }; onPreset: (p: Preset) => void; onRange: (r: { from: string; to: string }) => void }) {
  const invalid = range.from > range.to;
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-navy-900/[0.04]">
      <Field label="Period" className="min-w-[12rem]">
        {({ id }) => (
          <Select id={id} value={preset} onChange={(e) => { const p = e.target.value as Preset; onPreset(p); if (p !== "custom") onRange(presetRange(p)); }}>
            {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
        )}
      </Field>
      <Field label="From">{({ id }) => <Input id={id} type="date" value={range.from} max={range.to} onChange={(e) => { onPreset("custom"); onRange({ ...range, from: e.target.value }); }} />}</Field>
      <Field label="To" error={invalid ? "Must be after the start" : undefined}>{({ id, invalid: inv }) => <Input id={id} invalid={inv} type="date" value={range.to} min={range.from} onChange={(e) => { onPreset("custom"); onRange({ ...range, to: e.target.value }); }} />}</Field>
      <p className="pb-2 text-sm text-ink-600">Dates are UTC. Tables list the most recent first.</p>
    </div>
  );
}

// ---- Building blocks ------------------------------------------------------------------------------------------------------

const PAGE = 10;
const date = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");
const money = (minor: number | null | undefined) => (minor === null || minor === undefined ? "—" : formatCurrency(minor / 100));
const TYPE: Record<string, string> = { program: "Full course", module: "Single module" };
const PLAN: Record<string, string> = { annual: "Annual", monthly: "Monthly" };

function Note({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm text-ink-600">{children}</p>;
}

function Download_({ base, name, params, label = "Download spreadsheet" }: { base: string; name: ReportName; params: ReportParams; label?: string }) {
  return (
    <a href={csvHref(base, name, params)} download className={buttonClasses("secondary", "sm")}>
      <Download className="size-4" aria-hidden /> {label}
    </a>
  );
}

/** A paged report table with its spreadsheet download. Remount (key) to reset the page. */
function ReportTable<T, R extends Rows<T>>({
  base,
  name,
  params,
  title,
  description,
  columns,
  rowKey,
  empty,
  search,
  extra,
  pick = (r) => r.rows as unknown as T[],
}: {
  base: string;
  name: ReportName;
  params: ReportParams;
  title: string;
  description?: string;
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty: { title: string; description: string };
  search?: boolean;
  extra?: (data: R) => ReactNode;
  pick?: (data: R) => T[];
}) {
  const [page, setPage] = useState(1);
  const [text, setText] = useState("");
  const [applied, setApplied] = useState("");
  const q = { ...params, limit: PAGE, offset: (page - 1) * PAGE, ...(applied ? { search: applied } : {}) };
  const report = useReport<R>(base, name, q);
  const total = report.data?.page.total ?? 0;
  return (
    <Panel>
      <PanelHeader title={title} description={description} action={<Download_ base={base} name={name} params={{ ...params, ...(applied ? { search: applied } : {}) }} />} />
      {search ? (
        <form className="mb-4 max-w-md" onSubmit={(e) => { e.preventDefault(); setApplied(text.trim()); setPage(1); }}>
          <label htmlFor={`${name}-search`} className="sr-only">Search</label>
          <Input id={`${name}-search`} type="search" autoComplete="off" placeholder="Search by name, then press Enter" value={text} onChange={(e) => { setText(e.target.value); if (!e.target.value) { setApplied(""); setPage(1); } }} />
        </form>
      ) : null}
      {report.data && extra ? extra(report.data) : null}
      <DataTable
        caption={title}
        columns={columns}
        rows={report.data ? pick(report.data) : undefined}
        rowKey={rowKey}
        loading={report.isPending}
        error={report.isError ? (report.error instanceof Error ? report.error.message : "Could not load this report.") : undefined}
        onRetry={() => void report.refetch()}
        empty={empty}
      />
      <div className="mt-4"><Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} onChange={setPage} total={total} pageSize={PAGE} /></div>
    </Panel>
  );
}

/** Bars for a short series. Plain markup, readable by screen readers as a list. */
function Bars({ points, format = (n: number) => String(n), label }: { points: { label: string; value: number }[]; format?: (n: number) => string; label: string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  if (points.length === 0) return <p className="py-6 text-center text-sm text-ink-600">Nothing in this period yet.</p>;
  return (
    <ol className="flex h-44 items-end gap-1.5 overflow-x-auto pb-1" aria-label={label}>
      {points.map((p) => (
        <li key={p.label} className="flex h-full min-w-[2rem] flex-1 flex-col justify-end text-center" title={`${p.label}: ${format(p.value)}`}>
          <span className="mb-1 text-[11px] font-semibold text-ink-700">{format(p.value)}</span>
          <span className="block w-full rounded-t-md bg-brand-600" style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }} />
          <span className="mt-1 truncate text-[10px] text-ink-500">{p.label}</span>
        </li>
      ))}
    </ol>
  );
}

const AgencyCell = ({ agency, uuid, platform }: { agency: string; uuid: string; platform: boolean }) =>
  platform ? <Link href={`/admin/agencies/${uuid}`} className="truncate font-semibold text-ink-900 hover:text-brand-800 hover:underline">{agency}</Link> : <span className="truncate font-semibold text-ink-900">{agency}</span>;

// ---- The report views --------------------------------------------------------------------------------------------------------

function Overview({ base, params, platform }: { base: string; params: ReportParams; platform: boolean }) {
  const report = useReport<SummaryResponse>(base, "summary", { ...params, days: 60 });
  if (report.isError) return <Panel><ErrorState message={report.error instanceof Error ? report.error.message : undefined} onRetry={() => void report.refetch()} /></Panel>;
  if (!report.data) return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  const s = report.data.summary;
  const d = report.data.definitions;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={formatNumber(s.students.total)} hint={`${formatNumber(s.students.newInPeriod)} new in this period`} icon={Users} />
        <StatCard label="Courses in progress" value={formatNumber(s.courses.inProgress)} hint={`${formatNumber(s.courses.notStarted)} not started yet`} icon={GraduationCap} />
        <StatCard label="Courses completed" value={formatNumber(s.courses.completedInPeriod)} hint={`${formatNumber(s.courses.completedTotal)} in total`} icon={Percent} />
        <StatCard label="Dormant accounts" value={formatNumber(s.dormant)} hint="No activity for 60+ days" icon={Moon} />
        <StatCard label="Average time to complete" value={formatDuration(s.completions.avgSecondsToComplete)} hint={`${formatNumber(s.completions.count)} completions in this period`} icon={Hourglass} />
        <StatCard label="Learning time of completions" value={formatDuration(s.completions.learningSeconds)} hint="Estimated from lesson lengths" icon={Hourglass} />
        <StatCard label="Active subscriptions" value={formatNumber(s.subscriptions?.active ?? 0)} hint={s.subscriptions?.nextRenewal ? `Next renewal ${date(s.subscriptions.nextRenewal)}` : "No renewals coming"} icon={Repeat} />
        {s.revenue ? (
          <StatCard label="Revenue in this period" value={money(s.revenue.periodMinor)} hint={`${money(s.revenue.mrrMinor)} per month recurring`} icon={Banknote} />
        ) : (
          <StatCard label="Next renewal" value={s.subscriptions?.nextRenewal ? date(s.subscriptions.nextRenewal) : "—"} hint="Earliest active subscription" icon={CalendarClock} />
        )}
      </div>
      {platform && s.revenue ? <p className="text-sm text-ink-600">{formatNumber(s.revenue.agencies)} active agencies.</p> : null}
      <Panel>
        <PanelHeader title="How these numbers are worked out" />
        <dl className="grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
          {([["Progress", d.progress], ["Time to complete", d.timeToComplete], ["Learning time", d.learningTime], ["Student", d.student], ["Dormant", d.dormant], ...(platform ? [["Revenue and MRR", d.revenue]] : [])] as [string, string | undefined][]).map(([k, v]) => (
            <div key={k}><dt className="font-semibold text-ink-900">{k}</dt><dd className="text-ink-600">{v}</dd></div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}

function CoursesInProgress({ base, platform }: { base: string; platform: boolean }) {
  const columns: Column<CourseProgressRow>[] = [
    ...(platform ? [{ key: "agency", header: "Client", width: "minmax(0,1.3fr)", cell: (r: CourseProgressRow) => <AgencyCell agency={r.agency} uuid={r.agencyUuid} platform /> }] : []),
    { key: "course", header: "Course", width: "minmax(0,1.6fr)", cell: (r) => <span className="truncate text-ink-900">{r.course}</span> },
    { key: "learners", header: "Learners", width: "90px", cell: (r) => <span className="tnum font-semibold">{r.learners}</span> },
    { key: "split", header: "Started / not started", width: "150px", cell: (r) => <span className="tnum text-ink-700">{r.inProgress} / {r.notStarted}</span> },
    { key: "avg", header: "Average progress", width: "minmax(0,1fr)", cell: (r) => (<div className="w-full"><p className="tnum text-sm font-semibold text-ink-900">{r.avgPercent}%</p><ProgressBar value={r.avgPercent} label={`${r.course} average progress`} className="mt-1" /></div>) },
  ];
  return <ReportTable<CourseProgressRow, Rows<CourseProgressRow>> base={base} name="courses-in-progress" params={{}} title="Courses in progress" description="Every course currently assigned and not finished, with how far along learners are on average." columns={columns} rowKey={(r) => `${r.agencyUuid}-${r.course}`} empty={{ title: "No courses in progress", description: "When seats are assigned and learners start, they appear here." }} />;
}

function CoursesCompleted({ base, params, platform }: { base: string; params: ReportParams; platform: boolean }) {
  const columns: Column<CompletedCourseRow>[] = [
    ...(platform ? [{ key: "agency", header: "Client", width: "minmax(0,1.3fr)", cell: (r: CompletedCourseRow) => <AgencyCell agency={r.agency} uuid={r.agencyUuid} platform /> }] : []),
    { key: "course", header: "Course", width: "minmax(0,1.6fr)", cell: (r) => <span className="truncate text-ink-900">{r.course}</span> },
    { key: "n", header: "Completed", width: "100px", cell: (r) => <span className="tnum font-semibold">{r.completed}</span> },
    { key: "time", header: "Average time to complete", width: "170px", cell: (r) => <span className="text-ink-700">{formatDuration(r.avgSecondsToComplete)}</span> },
    { key: "learn", header: "Learning time (total)", width: "160px", cell: (r) => <span className="text-ink-700">{formatDuration(r.learningSeconds)}</span> },
  ];
  return <ReportTable<CompletedCourseRow, Rows<CompletedCourseRow>> base={base} name="courses-completed" params={params} title="Courses completed" description="Courses finished in the chosen period, by course." columns={columns} rowKey={(r) => `${r.agencyUuid}-${r.course}`} empty={{ title: "Nothing completed in this period", description: "Try a longer period." }} />;
}

function Completions({ base, params, platform }: { base: string; params: ReportParams; platform: boolean }) {
  const columns: Column<CompletionsResponse["rows"][number]>[] = [
    { key: "date", header: "Completed", width: "130px", cell: (r) => <span className="text-ink-700">{date(r.completedAt)}</span> },
    ...(platform ? [{ key: "agency", header: "Client", width: "minmax(0,1fr)", cell: (r: CompletionsResponse["rows"][number]) => <AgencyCell agency={r.agency} uuid={r.agencyUuid} platform /> }] : []),
    {
      key: "learner",
      header: "Learner",
      width: "minmax(0,1.3fr)",
      cell: (r) => (
        <div className="min-w-0">
          <Link href={platform ? `/admin/agencies/${r.agencyUuid}/learners/${r.membershipId}` : `/agency/members/${r.membershipId}`} className="block truncate font-semibold text-ink-900 hover:text-brand-800 hover:underline">{r.learner}</Link>
          <p className="truncate font-mono text-xs text-ink-600">{r.email}</p>
        </div>
      ),
    },
    { key: "course", header: "Course", width: "minmax(0,1.2fr)", cell: (r) => <span className="truncate text-ink-700">{r.course}</span> },
    { key: "time", header: "Time to complete", width: "140px", cell: (r) => <span className="text-ink-700">{formatDuration(r.secondsToComplete)}</span> },
    { key: "learn", header: "Learning time", width: "120px", cell: (r) => <span className="text-ink-700">{formatDuration(r.learningSeconds)}</span> },
  ];
  return (
    <ReportTable<CompletionsResponse["rows"][number], CompletionsResponse>
      base={base}
      name="completions"
      params={params}
      title="Student completions"
      description="Each completed course in the period, with how long it took."
      columns={columns}
      rowKey={(r) => `${r.membershipId}-${r.completedAt}-${r.course}`}
      empty={{ title: "No completions in this period", description: "Try a longer period." }}
      extra={(d) => (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-canvas-soft p-3"><p className="text-xs text-ink-600">Completions</p><p className="text-xl font-extrabold text-ink-900">{formatNumber(d.totals.count)}</p></div>
          <div className="rounded-2xl bg-canvas-soft p-3"><p className="text-xs text-ink-600">Total learning time</p><p className="text-xl font-extrabold text-ink-900">{formatDuration(d.totals.learningSeconds)}</p></div>
          <div className="rounded-2xl bg-canvas-soft p-3"><p className="text-xs text-ink-600">Average time to complete</p><p className="text-xl font-extrabold text-ink-900">{formatDuration(d.totals.avgSecondsToComplete)}</p></div>
        </div>
      )}
    />
  );
}

function Students({ base, params, platform }: { base: string; params: ReportParams; platform: boolean }) {
  const columns: Column<StudentsResponse["rows"][number]>[] = [
    { key: "agency", header: "Client", width: "minmax(0,1.6fr)", cell: (r) => <AgencyCell agency={r.agency} uuid={r.agencyUuid} platform={platform} /> },
    { key: "total", header: "Students", width: "120px", cell: (r) => <span className="tnum font-semibold">{formatNumber(r.students)}</span> },
    { key: "new", header: "New in this period", width: "170px", cell: (r) => <span className="tnum text-ink-700">{formatNumber(r.newInPeriod)}</span> },
  ];
  return (
    <ReportTable<StudentsResponse["rows"][number], StudentsResponse>
      base={base}
      name="students"
      params={params}
      title="Students and new students"
      description="A student is someone who has been given a course. New students are those whose first course was assigned in the period."
      columns={columns}
      rowKey={(r) => r.agencyUuid}
      empty={{ title: "No students yet", description: "Students appear once seats are assigned." }}
      extra={(d) => (
        <div className="mb-5">
          <p className="mb-2 text-sm font-semibold text-ink-900">New students per {d.bucket}</p>
          <Bars label="New students over time" points={d.series.map((p) => ({ label: p.bucket, value: p.count }))} />
        </div>
      )}
    />
  );
}

function Agencies({ base }: { base: string }) {
  const columns: Column<AgencyAccountRow>[] = [
    { key: "agency", header: "Client", width: "minmax(0,1.4fr)", cell: (r) => (<div className="min-w-0"><AgencyCell agency={r.agency} uuid={r.agencyUuid} platform /><div className="mt-0.5"><StatusPill status={r.status} /></div></div>) },
    { key: "plans", header: "Plan", width: "100px", cell: (r) => <span className="text-ink-700">{r.plans ? r.plans.split(",").map((p) => PLAN[p] ?? p).join(", ") : "—"}</span> },
    { key: "learners", header: "Learners", width: "90px", cell: (r) => <span className="tnum font-semibold">{r.learners}</span> },
    { key: "seats", header: "Seats used / bought", width: "150px", cell: (r) => <span className="tnum text-ink-700">{r.seatsAssigned} / {r.seatsPurchased}</span> },
    { key: "revenue", header: "Revenue", width: "120px", cell: (r) => <span className="tnum font-semibold">{money(r.revenueMinor)}</span> },
    { key: "start", header: "Subscribed since", width: "130px", cell: (r) => <span className="text-ink-700">{date(r.firstSubscriptionStart)}</span> },
    { key: "renew", header: "Next renewal", width: "130px", cell: (r) => <span className="text-ink-700">{date(r.nextRenewal)}</span> },
  ];
  return <ReportTable<AgencyAccountRow, Rows<AgencyAccountRow>> base={base} name="agencies" params={{}} search title="Agency accounts" description="Every agency: its plan, learners, seats, revenue and renewal date. “Enterprise” and “single use” are not defined yet, so plan shows the billing period." columns={columns} rowKey={(r) => r.agencyUuid} empty={{ title: "No agencies match", description: "Try another name." }} />;
}

function Revenue({ base, params }: { base: string; params: ReportParams }) {
  const [bucket, setBucket] = useState<"month" | "quarter" | "year">("month");
  const report = useReport<RevenueResponse>(base, "revenue", { ...params, bucket });
  const d = report.data;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue in this period" value={d ? money(d.totalMinor) : "…"} hint="Paid orders" icon={Banknote} />
        <StatCard label="Monthly recurring (MRR)" value={d ? money(d.mrrMinor) : "…"} hint="Active seats at their price per month" icon={Repeat} />
        <StatCard label="Yearly run rate (ARR)" value={d ? money(d.arrMinor) : "…"} hint="MRR x 12" icon={CalendarClock} />
        <StatCard label="Active subscriptions" value={d ? formatNumber(d.activeSubscriptions) : "…"} hint="Right now" icon={Ticket} />
      </div>
      <Panel>
        <PanelHeader title="Revenue over time" description="Refunds are not synced from Stripe yet, so refunded money still counts here." action={<div className="flex items-center gap-2"><Select aria-label="Group by" value={bucket} onChange={(e) => setBucket(e.target.value as typeof bucket)}><option value="month">By month</option><option value="quarter">By quarter</option><option value="year">By year</option></Select><Download_ base={base} name="revenue" params={{ ...params, bucket }} /></div>} />
        {report.isError ? <ErrorState message={report.error instanceof Error ? report.error.message : undefined} onRetry={() => void report.refetch()} /> : !d ? <Skeleton className="h-44" /> : <Bars label="Revenue over time" points={d.series.map((p) => ({ label: p.bucket, value: p.revenueMinor / 100 }))} format={(n) => formatCurrency(n)} />}
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="By client" description="Top clients by revenue in the period." />
          {!d ? <Skeleton className="h-40" /> : d.byAgency.length === 0 ? <p className="py-4 text-sm text-ink-600">No paid orders in this period.</p> : (
            <ul className="divide-y divide-line">
              {d.byAgency.slice(0, 10).map((r) => (
                <li key={r.agencyUuid} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/agencies/${r.agencyUuid}`} className="min-w-0 truncate font-semibold text-ink-900 hover:text-brand-800 hover:underline">{r.agency}</Link>
                  <span className="tnum shrink-0 text-ink-700">{money(r.revenueMinor)} · {r.orders} order{r.orders === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <PanelHeader title="By subscription type" description="What was bought: plan and product." />
          {!d ? <Skeleton className="h-40" /> : d.byType.length === 0 ? <p className="py-4 text-sm text-ink-600">No paid orders in this period.</p> : (
            <ul className="divide-y divide-line">
              {d.byType.map((r) => (
                <li key={`${r.plan}-${r.type}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold text-ink-900">{PLAN[r.plan] ?? r.plan} · {TYPE[r.type] ?? r.type}</span>
                  <span className="tnum text-ink-700">{money(r.revenueMinor)} · {r.orders} order{r.orders === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Subscriptions({ base, platform }: { base: string; platform: boolean }) {
  const columns: Column<SubscriptionRow>[] = [
    ...(platform ? [{ key: "agency", header: "Client", width: "minmax(0,1.2fr)", cell: (r: SubscriptionRow) => <AgencyCell agency={r.agency} uuid={r.agencyUuid} platform /> }] : []),
    { key: "product", header: "Product", width: "minmax(0,1.4fr)", cell: (r) => (<div className="min-w-0"><p className="truncate font-semibold text-ink-900">{r.product}</p><p className="text-xs text-ink-600">{TYPE[r.type] ?? r.type} · {PLAN[r.plan] ?? r.plan}</p></div>) },
    { key: "status", header: "Status", width: "110px", cell: (r) => <StatusPill status={r.status} /> },
    { key: "seats", header: "Seats used / bought", width: "150px", cell: (r) => <span className="tnum text-ink-700">{r.seatsAssigned} / {r.seats}</span> },
    { key: "price", header: "Price per seat", width: "120px", cell: (r) => <span className="tnum text-ink-700">{money(r.pricePerSeatMinor)}</span> },
    { key: "start", header: "Started", width: "120px", cell: (r) => <span className="text-ink-700">{date(r.startsAt)}</span> },
    { key: "renew", header: "Renews", width: "120px", cell: (r) => <span className="font-semibold text-ink-900">{date(r.renewsAt)}</span> },
  ];
  return (
    <ReportTable<SubscriptionRow, SubscriptionsResponse>
      base={base}
      name="subscriptions"
      params={{}}
      title="Subscriptions"
      description="Active subscriptions, what they are and when they renew."
      columns={columns}
      rowKey={(r) => `${r.agencyUuid}-${r.product}-${r.startsAt}-${r.renewsAt}-${r.seats}`}
      empty={{ title: "No active subscriptions", description: "They appear once a course is bought." }}
      extra={(d) => (
        <div className="mb-4 flex flex-wrap gap-2">
          {d.byKind.map((k) => <Badge key={`${k.type}-${k.plan}`} tone="navy">{TYPE[k.type] ?? k.type} · {PLAN[k.plan] ?? k.plan}: {k.count} ({k.seats} seats)</Badge>)}
          <Badge tone="brand">Recurring: {money(d.mrrMinor)} / month</Badge>
        </div>
      )}
    />
  );
}

function Dormant({ base, platform }: { base: string; platform: boolean }) {
  const [days, setDays] = useState(60);
  const columns: Column<DormantRow>[] = [
    {
      key: "learner",
      header: "Learner",
      width: "minmax(0,1.5fr)",
      cell: (r) => (
        <div className="min-w-0">
          <Link href={platform ? `/admin/agencies/${r.agencyUuid}/learners/${r.membershipId}` : `/agency/members/${r.membershipId}`} className="block truncate font-semibold text-ink-900 hover:text-brand-800 hover:underline">{r.learner}</Link>
          <p className="truncate font-mono text-xs text-ink-600">{r.email}</p>
        </div>
      ),
    },
    ...(platform ? [{ key: "agency", header: "Client", width: "minmax(0,1fr)", cell: (r: DormantRow) => <AgencyCell agency={r.agency} uuid={r.agencyUuid} platform /> }] : []),
    { key: "last", header: "Last activity", width: "140px", cell: (r) => <span className="text-ink-700">{r.lastActivity ? date(r.lastActivity) : "Never"}</span> },
    { key: "days", header: "Days dormant", width: "120px", cell: (r) => <span className="tnum font-semibold text-bad">{r.daysDormant}+</span> },
    { key: "open", header: "Unfinished courses", width: "150px", cell: (r) => <span className="tnum text-ink-700">{r.unfinishedCourses}</span> },
  ];
  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Field label="Dormant means no activity for">{({ id }) => <Select id={id} value={days} onChange={(e) => setDays(Number(e.target.value))}>{[30, 60, 90, 180].map((d) => <option key={d} value={d}>{d} days</option>)}</Select>}</Field>
      </div>
      <ReportTable<DormantRow, Rows<DormantRow>> key={days} base={base} name="dormant" params={{ days }} title="Dormant accounts" description="Active people who still have a course to finish but have not signed in or learned anything for the chosen number of days." columns={columns} rowKey={(r) => `${r.agencyUuid}-${r.membershipId}`} empty={{ title: "No dormant accounts", description: `Everyone with an unfinished course has been active in the last ${days} days.` }} />
    </div>
  );
}

function AgencyLearners({ agencyId, base }: { agencyId: string; base: string }) {
  const [page, setPage] = useState(1);
  const q = { limit: PAGE, offset: (page - 1) * PAGE };
  const learners = useAgencyLearners(agencyId, q);
  const columns: Column<AgencyLearnerLine>[] = [
    { key: "learner", header: "Learner", width: "minmax(0,1.5fr)", cell: (r) => (<div className="min-w-0"><Link href={`/agency/members/${r.membershipId}`} className="block truncate font-semibold text-ink-900 hover:text-brand-800 hover:underline">{r.learnerName}</Link><p className="truncate font-mono text-xs text-ink-600">{r.email}</p></div>) },
    { key: "course", header: "Course", width: "minmax(0,1.3fr)", cell: (r) => <span className="truncate text-ink-700">{r.courseTitle}</span> },
    { key: "progress", header: "Progress", width: "minmax(0,1fr)", cell: (r) => (<div className="w-full"><p className="tnum text-sm font-semibold text-ink-900">{Math.round(r.progressPercent)}%</p><ProgressBar value={r.progressPercent} label={`${r.learnerName} progress`} className="mt-1" /></div>) },
    { key: "exams", header: "Exams passed", width: "110px", cell: (r) => <span className="tnum text-ink-700">{r.assessmentsPassed}/{r.assessmentsTotal}</span> },
    { key: "best", header: "Best score", width: "100px", cell: (r) => <span className="tnum font-semibold">{r.bestScorePercent === null ? "—" : `${Math.round(r.bestScorePercent)}%`}</span> },
    { key: "status", header: "Status", width: "120px", cell: (r) => <Badge tone={r.enrollmentStatus === "completed" ? "ok" : r.enrollmentStatus === "in_progress" ? "brand" : "neutral"} dot>{r.enrollmentStatus === "assigned" ? "Not started" : r.enrollmentStatus.replace(/_/g, " ")}</Badge> },
  ];
  return (
    <Panel>
      <PanelHeader
        title="Learners"
        description="Every person and course, with progress. Open a name for their full record."
        action={<div className="flex gap-2"><a href={`${base.replace("/analytics", "")}/reports/learners.csv`} download className={buttonClasses("secondary", "sm")}><Download className="size-4" aria-hidden /> Spreadsheet</a><a href={`${base.replace("/analytics", "")}/reports/learners.pdf`} download className={buttonClasses("secondary", "sm")}><Download className="size-4" aria-hidden /> PDF</a></div>}
      />
      <DataTable caption="Learners" columns={columns} rows={learners.data?.items} rowKey={(r) => `${r.membershipId}-${r.courseTitle}-${r.assignedAt}`} loading={learners.isPending} error={learners.isError ? (learners.error instanceof Error ? learners.error.message : "Could not load learners.") : undefined} onRetry={() => void learners.refetch()} empty={{ title: "No learners on a course yet", description: "Assign seats and your learners appear here." }} />
      <div className="mt-4"><Pagination page={page} pageCount={Math.max(1, Math.ceil((learners.data?.total ?? 0) / PAGE))} onChange={setPage} total={learners.data?.total} pageSize={PAGE} /></div>
    </Panel>
  );
}

// ---- The workspace ---------------------------------------------------------------------------------------------------------------

type TabKey = "overview" | "learners" | "progress" | "completed" | "completions" | "students" | "agencies" | "revenue" | "subscriptions" | "dormant";
const USES_PERIOD: TabKey[] = ["overview", "completed", "completions", "students", "revenue"];

export function ReportsWorkspace({ scope, agencyId }: { scope: "platform" | "agency"; agencyId?: string }) {
  const platform = scope === "platform";
  const base = platform ? "/api/platform/analytics" : `/api/agencies/${agencyId}/analytics`;
  const [tab, setTab] = useState<TabKey>("overview");
  const [preset, setPreset] = useState<Preset>("30d");
  const [range, setRange] = useState(() => presetRange("30d"));
  const params = useMemo(() => (range.from <= range.to ? toParams(range) : toParams(presetRange("30d"))), [range]);

  const tabs: { value: TabKey; label: string }[] = platform
    ? [
        { value: "overview", label: "Overview" },
        { value: "progress", label: "Courses in progress" },
        { value: "completed", label: "Courses completed" },
        { value: "completions", label: "Completions" },
        { value: "students", label: "Students" },
        { value: "agencies", label: "Agency accounts" },
        { value: "revenue", label: "Revenue & MRR" },
        { value: "subscriptions", label: "Subscriptions" },
        { value: "dormant", label: "Dormant accounts" },
      ]
    : [
        { value: "overview", label: "Overview" },
        { value: "learners", label: "Learners" },
        { value: "progress", label: "Courses in progress" },
        { value: "completed", label: "Courses completed" },
        { value: "completions", label: "Completions" },
        { value: "students", label: "Students" },
        { value: "subscriptions", label: "Subscriptions" },
        { value: "dormant", label: "Dormant accounts" },
      ];

  const periodKey = `${params.from}-${params.to}`;
  return (
    <>
      <div className="mb-4"><Tabs label="Reports" value={tab} onChange={setTab} items={tabs} /></div>
      {USES_PERIOD.includes(tab) ? <PeriodBar preset={preset} range={range} onPreset={setPreset} onRange={setRange} /> : null}
      {tab === "overview" ? <Overview base={base} params={params} platform={platform} />
        : tab === "learners" && agencyId ? <AgencyLearners agencyId={agencyId} base={base} />
        : tab === "progress" ? <CoursesInProgress base={base} platform={platform} />
        : tab === "completed" ? <CoursesCompleted key={periodKey} base={base} params={params} platform={platform} />
        : tab === "completions" ? <Completions key={periodKey} base={base} params={params} platform={platform} />
        : tab === "students" ? <Students key={periodKey} base={base} params={params} platform={platform} />
        : tab === "agencies" && platform ? <Agencies base={base} />
        : tab === "revenue" && platform ? <Revenue base={base} params={params} />
        : tab === "subscriptions" ? <Subscriptions base={base} platform={platform} />
        : tab === "dormant" ? <Dormant base={base} platform={platform} />
        : null}
      <p className="mt-6 flex items-center gap-2 text-xs text-ink-500"><UserPlus className="size-3.5" aria-hidden /> Every table has a spreadsheet download that matches what you see, for the whole period, not just this page.</p>
    </>
  );
}
