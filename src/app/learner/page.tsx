"use client";

import { Award, BookOpen, CheckCircle2, ChevronRight, ClipboardCheck, Clock, Play } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useAllAssessments, useEnrollments, useLearnerCertificates } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { formatNumber } from "@/lib/utils";

function dueLabel(iso: string): string {
  if (!iso) return "No due date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "No due date";
  return `Due ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function LearnerDashboard() {
  const { user } = useSession();
  const enrollments = useEnrollments();
  const certificates = useLearnerCertificates();
  const assessments = useAllAssessments(enrollments.data);

  const list = enrollments.data ?? [];
  const inProgress = list.filter((e) => e.status === "in_progress" || e.status === "assigned");
  const completed = list.filter((e) => e.status === "completed");
  const active = inProgress[0] ?? list[0] ?? null;
  const upcoming = (assessments.data ?? []).filter((a) => !a.hasPassed).slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Learner"
        title={user ? `Welcome back, ${user.firstName}` : "Welcome back"}
        subtitle="Pick up where you left off and keep your certifications current."
        actions={<ButtonLink href="/learner/courses" variant="secondary">My courses</ButtonLink>}
      />

      {enrollments.isError ? (
        <Panel><ErrorState message={enrollments.error instanceof Error ? enrollments.error.message : undefined} onRetry={() => void enrollments.refetch()} /></Panel>
      ) : enrollments.isPending ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Enrollments" value={formatNumber(list.length)} icon={BookOpen} tone="brand" />
          <StatCard label="In progress" value={formatNumber(inProgress.length)} icon={Clock} tone="warn" />
          <StatCard label="Completed" value={formatNumber(completed.length)} icon={CheckCircle2} tone="ok" />
          <StatCard label="Certificates" value={certificates.isPending ? "—" : formatNumber(certificates.data?.length ?? 0)} icon={Award} tone="navy" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Panel>
            <PanelHeader
              title={active ? "Continue learning" : "Your courses"}
              description={active ? active.course.title : "You are not enrolled in a course yet."}
              action={active ? <Link href={`/learner/courses/${active.uuid}`} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Open course</Link> : null}
            />
            {enrollments.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : !active ? (
              <div className="rounded-2xl bg-canvas-soft p-8 text-center">
                <p className="font-semibold text-ink-900">No enrollments yet</p>
                <p className="mt-1 text-sm text-ink-600">Your agency administrator assigns seats and enrollments.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <ProgressRing value={active.progress_percent} label={`${active.course.title} progress`}>
                  <div>
                    <p className="tnum text-2xl font-extrabold text-ink-900">{Math.round(active.progress_percent)}%</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">complete</p>
                  </div>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={active.status === "completed" ? "ok" : active.status === "in_progress" ? "brand" : "neutral"} dot>
                      {active.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-ink-600">{dueLabel(active.due_at)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-ink-900">{active.course.title}</h3>
                  {active.course.description ? <p className="mt-1 line-clamp-2 text-sm text-ink-600">{active.course.description}</p> : null}
                  <ProgressBar value={active.progress_percent} label={`${active.course.title} progress`} className="mt-4" />
                  <ButtonLink href={`/learner/courses/${active.uuid}`} className="mt-5" icon={<Play className="size-4" aria-hidden />}>
                    {active.progress_percent > 0 ? "Continue" : "Start course"}
                  </ButtonLink>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="All enrollments"
              description="Courses assigned to you by your agency."
              action={<Link href="/learner/courses" className="text-sm font-semibold text-brand-700 hover:text-brand-800">View all</Link>}
            />
            {enrollments.isPending ? (
              <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : list.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-600">Nothing assigned yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {list.slice(0, 4).map((enrollment) => (
                  <li key={enrollment.uuid}>
                    <Link href={`/learner/courses/${enrollment.uuid}`} className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-brand-800">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">{enrollment.course.title}</p>
                        <p className="text-xs capitalize text-ink-600">{enrollment.status.replace(/_/g, " ")} · {dueLabel(enrollment.due_at)}</p>
                      </div>
                      <div className="flex w-28 shrink-0 items-center gap-2">
                        <ProgressBar value={enrollment.progress_percent} label={`${enrollment.course.title} progress`} />
                        <span className="tnum w-8 text-right text-xs font-semibold text-ink-700">{Math.round(enrollment.progress_percent)}%</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Panel>
            <PanelHeader
              title="Assessments"
              description="Pass every required assessment to earn your certificate."
              action={<Link href="/learner/assessments" className="text-sm font-semibold text-brand-700 hover:text-brand-800">All</Link>}
            />
            {assessments.isPending ? (
              <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-600">No assessments outstanding.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((assessment) => (
                  <li key={`${assessment.enrollment.uuid}-${assessment.assessmentPublicId}`}>
                    <Link
                      href={`/learner/assessments/${assessment.assessmentPublicId}?enrollment=${assessment.enrollment.uuid}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-canvas-soft p-3 transition-colors hover:bg-white hover:shadow-card"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ClipboardCheck className="size-4 shrink-0 text-brand-700" aria-hidden />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">{assessment.title}</p>
                          <p className="truncate text-xs text-ink-600">{assessment.enrollment.course.title}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-ink-500" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="rounded-3xl bg-navy-900 p-6 text-white shadow-lift">
            <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-brand-200" aria-hidden>
              <Award className="size-5" />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-brand-200">Credential wallet</p>
            <p className="mt-1 text-2xl font-extrabold">
              {certificates.isPending ? "—" : `${formatNumber(certificates.data?.length ?? 0)} certificate${(certificates.data?.length ?? 0) === 1 ? "" : "s"}`}
            </p>
            <p className="mt-2 text-sm text-white/70">Download PDF certificates or share the public verification link with an auditor.</p>
            <Link href="/learner/certificates" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 hover:text-white">
              Open wallet <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
