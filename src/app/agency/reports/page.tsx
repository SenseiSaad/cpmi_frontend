"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useAgencyLearnerReport, useAgencyReport } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import type { AgencyLearnerReport } from "@/lib/api/hooks";
import { formatNumber, relativeDays } from "@/lib/utils";

const columns: Column<AgencyLearnerReport>[] = [
  {
    key: "learner",
    header: "Learner",
    width: "minmax(0,1.8fr)",
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink-900">{row.learnerName}</p>
        <p className="truncate font-mono text-xs text-ink-600">{row.email}</p>
      </div>
    ),
  },
  { key: "course", header: "Course", width: "minmax(0,1.5fr)", cell: (row) => <span className="truncate text-ink-700">{row.courseTitle}</span> },
  {
    key: "progress",
    header: "Progress",
    width: "minmax(0,1.4fr)",
    cell: (row) => (
      <div>
        <ProgressBar value={row.progressPercent} label={`${row.learnerName} progress`} showValue />
        <p className="mt-1 text-xs capitalize text-ink-600">{row.enrollmentStatus.replace(/_/g, " ")}</p>
      </div>
    ),
  },
  {
    key: "assessments",
    header: "Assessments",
    width: "120px",
    align: "right",
    cell: (row) => <span className="tnum text-ink-700">{row.assessmentsPassed}/{row.assessmentsTotal} passed</span>,
  },
  {
    key: "score",
    header: "Best score",
    width: "100px",
    align: "right",
    cell: (row) => <span className="tnum font-semibold">{row.bestScorePercent === null ? "—" : `${row.bestScorePercent}%`}</span>,
  },
  {
    key: "assigned",
    header: "Assigned",
    width: "120px",
    cell: (row) => <span className="text-ink-600">{row.assignedAt ? relativeDays(row.assignedAt) : "—"}</span>,
  },
];

export default function AgencyReportsPage() {
  const { user } = useSession();
  const report = useAgencyReport(true);
  const learners = useAgencyLearnerReport(true);
  const agencyId = user?.agency?.publicId;

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Reports"
        subtitle="Tenant-scoped completion and assessment reporting. Exports are generated server-side."
        actions={
          agencyId ? (
            <>
              <ButtonLink href={`/api/agencies/${agencyId}/reports/learners.csv`} variant="secondary" icon={<FileSpreadsheet className="size-4" aria-hidden />} prefetch={false}>
                Export CSV
              </ButtonLink>
              <ButtonLink href={`/api/agencies/${agencyId}/reports/learners.pdf`} variant="primary" icon={<FileText className="size-4" aria-hidden />} prefetch={false}>
                Export PDF
              </ButtonLink>
            </>
          ) : null
        }
      />

      {report.isError ? (
        <Panel><ErrorState message={report.error instanceof Error ? report.error.message : undefined} onRetry={() => void report.refetch()} /></Panel>
      ) : report.isPending || !report.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active members" value={formatNumber(report.data.members.active)} icon={undefined} tone="brand" />
          <StatCard label="Seats assigned" value={`${formatNumber(report.data.seats.assigned)} / ${formatNumber(report.data.seats.capacity)}`} tone="navy" />
          <StatCard label="Completion" value={report.data.enrollments.completionPercent === null ? "—" : `${report.data.enrollments.completionPercent}%`} hint={`${formatNumber(report.data.enrollments.completed)} of ${formatNumber(report.data.enrollments.total)} enrollments`} tone="ok" />
          <StatCard label="Pass rate" value={report.data.assessments.passRatePercent === null ? "—" : `${report.data.assessments.passRatePercent}%`} hint={`${formatNumber(report.data.assessments.graded)} graded attempts`} tone="info" />
        </div>
      )}

      <Panel className="mt-6">
        <PanelHeader
          title="Learner progress"
          description="Per-enrollment progress, assessment results and certificate eligibility."
          action={<Badge tone="navy"><Download className="size-3.5" aria-hidden /> Server-generated exports</Badge>}
        />
        <DataTable
          caption="Learner progress report"
          columns={columns}
          rows={learners.data?.items}
          rowKey={(row) => `${row.email}-${row.courseTitle}-${row.assignedAt}`}
          loading={learners.isPending}
          error={learners.isError ? (learners.error instanceof Error ? learners.error.message : "Could not load the learner report.") : undefined}
          onRetry={() => void learners.refetch()}
          empty={{ title: "No enrollments yet", description: "Assign a seat and enroll a learner to see progress here." }}
        />
      </Panel>
    </>
  );
}
