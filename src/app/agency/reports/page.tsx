"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { agencyApi, agencyApiExt, formatDate, useAgencyScope } from "@/features/agency/api";
import { AgencyPage, Panel, StatTile, StatusPill, ProgressBar, outlineBtn, primaryBtn, thCls } from "@/features/agency/ui";
import { ErrorState, LoadingState, EmptyState } from "@/components/shared/QueryState";

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v)}%`);

export default function AgencyReportsPage() {
  const { agencyId } = useAgencyScope();
  const overview = useQuery({
    queryKey: ["agency", agencyId, "reports"],
    queryFn: () => agencyApi.reportsOverview(agencyId as string),
    enabled: Boolean(agencyId)
  });
  const learners = useQuery({
    queryKey: ["agency", agencyId, "report-learners"],
    queryFn: () => agencyApi.reportsLearners(agencyId as string),
    enabled: Boolean(agencyId)
  });
  const r = overview.data;

  return (
    <AgencyPage title="Agency Compliance Reports" subtitle="Exportable team training records">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs">
          <div>
            <span className="text-sm font-black text-gray-900">Learner Training Report</span>
            <p className="text-xs text-gray-500 mt-1">Enrollment progress, assessment scores and completion dates for every learner.</p>
          </div>
          {agencyId && (
            <div className="flex items-center gap-3">
              <a href={agencyApiExt.learnersCsvUrl(agencyId)} download className={outlineBtn}>
                <FileSpreadsheet size={14} className="text-emerald-600" /> Export CSV
              </a>
              <a href={agencyApiExt.learnersPdfUrl(agencyId)} download className={primaryBtn}>
                <Download size={14} className="text-secondary-400" /> Export PDF
              </a>
            </div>
          )}
        </div>

        {overview.isLoading ? (
          <LoadingState />
        ) : overview.isError ? (
          <ErrorState error={overview.error} onRetry={() => overview.refetch()} />
        ) : r ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Enrollments" value={r.enrollments.total} sub={`${r.enrollments.inProgress} in progress`} />
            <StatTile label="Completion" value={pct(r.enrollments.completionPercent)} sub={`${r.enrollments.completed} completed`} />
            <StatTile label="Pass Rate" value={pct(r.assessments.passRatePercent)} sub={`${r.assessments.attempts} attempts`} />
            <StatTile label="Certificates" value={r.certificates.issued} sub={`Avg score ${pct(r.assessments.averageScorePercent)}`} />
          </div>
        ) : null}

        <Panel title="Team Member Training Records">
          {learners.isLoading ? (
            <LoadingState />
          ) : learners.isError ? (
            <ErrorState error={learners.error} onRetry={() => learners.refetch()} />
          ) : !learners.data?.items.length ? (
            <EmptyState title="No learner activity yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className={`${thCls} pl-2`}>Staff Member</th>
                    <th className={thCls}>Course</th>
                    <th className={`${thCls} w-40`}>Progress</th>
                    <th className={thCls}>Best Score</th>
                    <th className={thCls}>Assessments</th>
                    <th className={thCls}>Completed</th>
                    <th className={`${thCls} text-right pr-2`}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {learners.data.items.map((l, i) => (
                    <tr key={`${l.email}-${l.courseTitle}-${i}`} className="hover:bg-gray-50/70">
                      <td className="py-4 pl-2">
                        <p className="font-bold text-gray-900">{l.learnerName}</p>
                        <p className="font-mono text-[10px] text-gray-500">{l.email}</p>
                      </td>
                      <td className="py-4">{l.courseTitle}</td>
                      <td className="py-4 pr-4"><ProgressBar value={l.progressPercent} /></td>
                      <td className="py-4 font-bold text-gray-900">{pct(l.bestScorePercent)}</td>
                      <td className="py-4">{l.assessmentsPassed} / {l.assessmentsTotal} passed</td>
                      <td className="py-4 text-gray-500">{formatDate(l.completedAt)}</td>
                      <td className="py-4 text-right pr-2"><StatusPill status={l.enrollmentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </AgencyPage>
  );
}
