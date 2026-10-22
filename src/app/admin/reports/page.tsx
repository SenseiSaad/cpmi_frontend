"use client";

import { Activity, Award, CheckCircle2, ServerCog, TrendingUp } from "lucide-react";

import { BarChart, Donut } from "@/components/charts/charts";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useHealth, useKpis } from "@/lib/api/hooks";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function AdminReportsPage() {
  const kpis = useKpis();
  const health = useHealth();

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Reports & observability"
        subtitle="Completion, assessment outcomes and the health of background processing."
      />

      {kpis.isError ? (
        <Panel><ErrorState message={kpis.error instanceof Error ? kpis.error.message : undefined} onRetry={() => void kpis.refetch()} /></Panel>
      ) : kpis.isPending || !kpis.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Paid revenue" value={formatCurrency(kpis.data.revenueMinor / 100)} icon={TrendingUp} tone="ok" />
          <StatCard label="Enrollments" value={formatNumber(kpis.data.activeLearners)} icon={Activity} tone="brand" />
          <StatCard label="Completion" value={`${kpis.data.completionRate}%`} icon={CheckCircle2} tone="info" />
          <StatCard label="Certificates" value={formatNumber(kpis.data.passFail.pass)} hint="Passing assessments" icon={Award} tone="navy" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <PanelHeader title="Completion by course" description="Percentage of enrollments completed in each course." />
          {kpis.isPending ? (
            <Skeleton className="h-52 w-full" />
          ) : kpis.data && kpis.data.moduleCompletion.length > 0 ? (
            <BarChart
              ariaLabel="Course completion percentages"
              data={kpis.data.moduleCompletion.slice(0, 12).map((c) => ({ label: c.label.length > 10 ? `${c.label.slice(0, 10)}…` : c.label, value: c.value }))}
            />
          ) : (
            <p className="py-16 text-center text-sm text-ink-600">No enrollments recorded yet.</p>
          )}
        </Panel>

        <Panel className="lg:col-span-4">
          <PanelHeader title="Assessment outcomes" description="Graded attempts across the platform." />
          {kpis.isPending || !kpis.data ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <div className="flex flex-col items-center gap-5 py-4">
              <Donut pass={Math.round(kpis.data.passRate)} label="Assessment pass rate" />
              <div className="grid w-full grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-ok-bg p-3">
                  <p className="tnum text-xl font-extrabold text-ok">{formatNumber(kpis.data.passFail.pass)}</p>
                  <p className="text-xs font-semibold text-ink-600">Passed</p>
                </div>
                <div className="rounded-2xl bg-bad-bg p-3">
                  <p className="tnum text-xl font-extrabold text-bad">{formatNumber(kpis.data.passFail.fail)}</p>
                  <p className="text-xs font-semibold text-ink-600">Failed</p>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelHeader
          title="Background processing"
          description="Queues that deliver audit events, notifications and Stripe webhooks."
          action={<Badge tone={health.data?.workers.every((w) => w.ok) ? "ok" : "warn"} dot>{health.data?.workers.every((w) => w.ok) ? "Healthy" : "Needs attention"}</Badge>}
        />
        {health.isError ? (
          <ErrorState message={health.error instanceof Error ? health.error.message : undefined} onRetry={() => void health.refetch()} />
        ) : health.isPending || !health.data ? (
          <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-canvas-soft p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink-900"><ServerCog className="size-4" aria-hidden /> Audit outbox</p>
              <p className="tnum mt-2 text-2xl font-extrabold text-ink-900">{formatNumber(health.data.auditQueue.pending)}</p>
              <p className="text-xs text-ink-600">pending · oldest {health.data.auditQueue.oldestMinutes} min · {formatNumber(health.data.auditQueue.deadLettered)} failed</p>
            </div>
            <div className="rounded-2xl bg-canvas-soft p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink-900"><Activity className="size-4" aria-hidden /> Stripe webhooks</p>
              <p className="tnum mt-2 text-2xl font-extrabold text-ink-900">{formatNumber(health.data.webhooks.stuck)}</p>
              <p className="text-xs text-ink-600">pending · {formatNumber(health.data.webhooks.failed)} failed</p>
            </div>
            <div className="rounded-2xl bg-canvas-soft p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink-900"><Award className="size-4" aria-hidden /> Notifications</p>
              <p className="tnum mt-2 text-2xl font-extrabold text-ink-900">{formatNumber(health.data.email.pending)}</p>
              <p className="text-xs text-ink-600">pending · {formatNumber(health.data.email.failed)} failed</p>
            </div>
          </div>
        )}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Worker status</caption>
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-600">
                <th className="pb-2 font-semibold">Worker</th>
                <th className="pb-2 font-semibold">Last activity</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(health.data?.workers ?? []).map((worker) => (
                <tr key={worker.name}>
                  <td className="py-3 font-medium text-ink-900">{worker.name}</td>
                  <td className="py-3 text-ink-600">{worker.lastRunSeconds}s ago</td>
                  <td className="py-3 text-right"><Badge tone={worker.ok ? "ok" : "bad"} dot>{worker.ok ? "OK" : "Failing"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
