"use client";

import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/QueryState";
import { platformApi } from "./api";
import { money, Panel, percent, StatTile, tdClass, thClass } from "./ui";

/** Report sections shared by the dashboard and the reports page. All data is from the reporting API. */

export function useReportsOverview() {
  return useQuery({ queryKey: ["platform", "report-overview"], queryFn: () => platformApi.reportsOverview() });
}

export function OverviewTiles() {
  const report = useReportsOverview();
  if (report.isPending) return <LoadingState label="Loading overview…" />;
  if (report.isError) return <ErrorState error={report.error} onRetry={() => void report.refetch()} />;
  const r = report.data;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatTile label="Paid revenue" value={money(r.revenue_cents)} hint={`${r.paid_orders} paid orders`} />
      <StatTile
        label="Enrollment completion"
        value={percent(r.enrollments.completion_percent)}
        hint={`${r.enrollments.completed} of ${r.enrollments.total} enrollments`}
      />
      <StatTile
        label="Assessment pass rate"
        value={percent(r.assessments.pass_rate_percent)}
        hint={`${r.assessments.passed} passed / ${r.assessments.graded} graded`}
      />
      <StatTile label="Certificates issued" value={r.certificates.issued} hint={`${r.certificates.revoked} revoked`} />
      <StatTile label="Agencies" value={r.agencies.total} hint={`${r.agencies.active} active`} />
      <StatTile label="Active entitlements" value={r.entitlements.active} hint={`${r.entitlements.seats_sold} seats sold`} />
    </div>
  );
}

export function RevenuePanel() {
  const revenue = useQuery({ queryKey: ["platform", "revenue"], queryFn: () => platformApi.reportsRevenue() });
  const data = (revenue.data?.months ?? []).map((m) => ({ month: m.month, revenue: m.revenueCents / 100, orders: m.orders }));
  return (
    <Panel title="Revenue overview" description="Paid orders over the last 12 months">
      {revenue.isPending ? (
        <LoadingState />
      ) : revenue.isError ? (
        <ErrorState error={revenue.error} onRetry={() => void revenue.refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title="No paid orders yet" description="Revenue appears here once agencies pay for orders." />
      ) : (
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2A5025" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2A5025" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: number) => [money(Math.round(v * 100)), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2A5025" strokeWidth={3} fill="url(#revenueGreen)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function CompletionPanel({ limit }: { limit?: number }) {
  const completions = useQuery({ queryKey: ["platform", "completions"], queryFn: () => platformApi.reportsCompletions() });
  const rows = (completions.data?.items ?? []).slice(0, limit);
  return (
    <Panel title="Course completion" description="Enrollments and completions per course">
      {completions.isPending ? (
        <LoadingState />
      ) : completions.isError ? (
        <ErrorState error={completions.error} onRetry={() => void completions.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No enrollments yet" />
      ) : (
        <div className="space-y-3.5">
          {rows.map((row, index) => (
            <div key={`${row.courseTitle}-${index}`} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-bold text-gray-800">{row.courseTitle}</span>
                <span className="tabular-nums text-gray-500">
                  {row.completed} / {row.enrollments} · {percent(row.completionPercent)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${Math.min(100, row.completionPercent ?? 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function PassRatePanel({ limit }: { limit?: number }) {
  const assessments = useQuery({ queryKey: ["platform", "assessment-report"], queryFn: () => platformApi.reportsAssessments() });
  const rows = (assessments.data?.items ?? []).slice(0, limit);
  return (
    <Panel title="Assessment pass rates" description="Per assessment version">
      {assessments.isPending ? (
        <LoadingState />
      ) : assessments.isError ? (
        <ErrorState error={assessments.error} onRetry={() => void assessments.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No assessment attempts yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                <th className={thClass}>Assessment</th>
                <th className={thClass}>Kind</th>
                <th className={`${thClass} text-right`}>Attempts</th>
                <th className={`${thClass} text-right`}>Passed / graded</th>
                <th className={`${thClass} text-right`}>Pass rate</th>
                <th className={`${thClass} text-right`}>Avg score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {rows.map((row) => (
                <tr key={row.assessmentVersionId}>
                  <td className={`${tdClass} font-bold text-gray-900`}>{row.assessmentTitle}</td>
                  <td className={`${tdClass} capitalize`}>{row.kind}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{row.attempts}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>
                    {row.passed} / {row.graded}
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`}>{percent(row.passRatePercent)}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{percent(row.averageScorePercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
