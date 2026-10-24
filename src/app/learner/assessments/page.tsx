"use client";

import { ClipboardCheck, Trophy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useAllAssessments, useEnrollments } from "@/lib/api/hooks";
import type { EnrollmentAssessment } from "@/lib/api/learner";

export default function LearnerAssessmentsPage() {
  const searchParams = useSearchParams();
  const enrollmentFilter = searchParams.get("enrollment");
  const enrollments = useEnrollments();
  const assessments = useAllAssessments(enrollments.data);

  const rows = useMemo(
    () => (assessments.data ?? []).filter((row) => !enrollmentFilter || row.enrollment.uuid === enrollmentFilter),
    [assessments.data, enrollmentFilter],
  );

  const columns: Column<EnrollmentAssessment>[] = [
    {
      key: "assessment",
      header: "Assessment",
      width: "minmax(0,2fr)",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{row.title}</p>
          <p className="truncate text-xs text-ink-600">{row.enrollment.course.title}</p>
        </div>
      ),
    },
    { key: "kind", header: "Type", width: "100px", cell: (row) => <Badge tone="navy"><span className="capitalize">{row.kind}</span></Badge> },
    {
      key: "attempts",
      header: "Attempts",
      width: "110px",
      align: "right",
      cell: (row) => (
        <span className="tnum text-ink-700">
          {row.attemptsUsed}
          {row.maxAttempts !== null ? ` / ${row.maxAttempts}` : ""}
        </span>
      ),
    },
    {
      key: "best",
      header: "Best score",
      width: "110px",
      align: "right",
      cell: (row) => <span className="tnum font-semibold">{row.bestScorePercent === null ? "—" : `${row.bestScorePercent}%`}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      cell: (row) =>
        row.hasPassed ? (
          <Badge tone="ok" dot>Passed</Badge>
        ) : row.inProgressAttemptId ? (
          <Badge tone="warn" dot>In progress</Badge>
        ) : (
          <Badge tone="neutral">Not started</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "130px",
      align: "right",
      cell: (row) => (
        <ButtonLink
          href={`/learner/assessments/${row.assessmentPublicId}?enrollment=${row.enrollment.uuid}`}
          variant={row.hasPassed ? "secondary" : "primary"}
          size="sm"
        >
          {row.hasPassed ? "Review" : row.inProgressAttemptId ? "Resume" : "Start"}
        </ButtonLink>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Learner"
        title="Assessments"
        subtitle="Module quizzes and final exams. Pass every required assessment to unlock your certificate."
        actions={enrollmentFilter ? <ButtonLink href="/learner/assessments" variant="secondary" size="sm">Show all enrollments</ButtonLink> : null}
      />

      {enrollments.isError || assessments.isError ? (
        <Panel>
          <ErrorState
            message={
              (enrollments.error instanceof Error ? enrollments.error.message : undefined) ??
              (assessments.error instanceof Error ? assessments.error.message : undefined)
            }
            onRetry={() => {
              void enrollments.refetch();
              void assessments.refetch();
            }}
          />
        </Panel>
      ) : enrollments.isPending || assessments.isPending ? (
        <Panel><Skeleton className="h-64 w-full" /></Panel>
      ) : (
        <Panel>
          <DataTable
            caption="Assessments"
            columns={columns}
            rows={rows}
            rowKey={(row) => `${row.enrollment.uuid}-${row.assessmentPublicId}`}
            empty={{
              title: "No assessments available",
              description: "Assessments appear once your enrollment includes a published quiz or exam.",
            }}
          />
        </Panel>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-canvas-soft p-5 ring-1 ring-line">
          <Trophy className="size-5 text-brand-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-ink-900">Passing scores</p>
          <p className="mt-1 text-sm text-ink-600">Each assessment has its own pass threshold, shown when you start an attempt. Your best graded score is kept.</p>
        </div>
        <div className="rounded-3xl bg-canvas-soft p-5 ring-1 ring-line">
          <ClipboardCheck className="size-5 text-brand-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-ink-900">Attempt limits</p>
          <p className="mt-1 text-sm text-ink-600">If an attempt limit applies it is shown on the assessment. Answers are saved as you go.</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Looking for course material? <Link href="/learner/courses" className="font-semibold text-brand-700 hover:underline">Open your courses</Link>.
      </p>
    </>
  );
}
