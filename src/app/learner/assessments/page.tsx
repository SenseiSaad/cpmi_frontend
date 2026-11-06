"use client";

import { ArrowRight, Award, CheckCircle2, ChevronDown, ClipboardCheck, Clock, Lock, PlayCircle, RotateCcw, Target, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useAllAssessments, useEnrollments } from "@/lib/api/hooks";
import type { EnrollmentAssessment, EnrollmentSummary } from "@/lib/api/learner";

type Standing = "passed" | "in_progress" | "locked" | "no_tries" | "ready";

function standingOf(a: EnrollmentAssessment): Standing {
  if (a.hasPassed) return "passed";
  if (a.inProgressAttemptId) return "in_progress";
  if (a.locked) return "locked";
  if (a.maxAttempts !== null && a.attemptsRemaining === 0) return "no_tries";
  return "ready";
}

const STANDING_BADGE: Record<Standing, { tone: "ok" | "warn" | "neutral" | "bad" | "info"; label: string }> = {
  passed: { tone: "ok", label: "Passed" },
  in_progress: { tone: "warn", label: "In progress" },
  locked: { tone: "neutral", label: "Locked" },
  no_tries: { tone: "bad", label: "No tries left" },
  ready: { tone: "info", label: "Ready to start" },
};

/** Module quizzes in course order, the final exam last. */
function sortAssessments(list: EnrollmentAssessment[]): EnrollmentAssessment[] {
  return [...list].sort((a, b) => Number(a.kind === "final") - Number(b.kind === "final"));
}

function AssessmentCard({ a }: { a: EnrollmentAssessment }) {
  const standing = standingOf(a);
  const badge = STANDING_BADGE[standing];
  const href = `/learner/assessments/${a.assessmentPublicId}?enrollment=${a.enrollment.uuid}`;
  const triesText =
    a.maxAttempts === null
      ? `${a.attemptsUsed} ${a.attemptsUsed === 1 ? "try" : "tries"} used · unlimited tries`
      : `${a.attemptsUsed} of ${a.maxAttempts} tries used`;

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-line sm:flex-row sm:items-center sm:gap-5">
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-xl ${
          standing === "passed" ? "bg-ok-bg text-ok" : standing === "locked" ? "bg-slate-100 text-ink-500" : standing === "no_tries" ? "bg-bad-bg text-bad" : "bg-brand-50 text-brand-700"
        }`}
        aria-hidden
      >
        {standing === "passed" ? <CheckCircle2 className="size-5" /> : standing === "locked" ? <Lock className="size-5" /> : standing === "no_tries" ? <TriangleAlert className="size-5" /> : a.kind === "final" ? <Award className="size-5" /> : <ClipboardCheck className="size-5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-bold text-ink-900">{a.title}</h3>
          <Badge tone="navy"><span className="capitalize">{a.kind === "final" ? "Final exam" : "Module quiz"}</span></Badge>
          <Badge tone={badge.tone} dot>{badge.label}</Badge>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
          <span className="inline-flex items-center gap-1"><Target className="size-3.5" aria-hidden /> Pass mark {Math.round(a.passingScore)}%</span>
          <span>{a.questionCount} {a.questionCount === 1 ? "question" : "questions"}</span>
          <span className="inline-flex items-center gap-1"><RotateCcw className="size-3.5" aria-hidden /> {triesText}</span>
        </p>

        {a.bestScorePercent !== null ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-semibold text-ink-700">Best score {Math.round(a.bestScorePercent)}%</span>
            <ProgressBar value={a.bestScorePercent} label={`Best score for ${a.title}`} tone={a.hasPassed ? "ok" : "brand"} className="max-w-xs flex-1" />
          </div>
        ) : null}

        {standing === "locked" && a.lockedReason ? <p className="mt-2 text-sm text-ink-700">{a.lockedReason}</p> : null}
        {standing === "no_tries" ? (
          <p className="mt-2 text-sm text-bad">You have used all your tries. Ask your agency administrator to give you more.</p>
        ) : null}
        {standing === "ready" && a.attemptsUsed > 0 && a.attemptsRemaining !== null ? (
          <p className="mt-2 text-sm text-ink-700">{a.attemptsRemaining} {a.attemptsRemaining === 1 ? "try" : "tries"} left.</p>
        ) : null}
      </div>

      <div className="shrink-0 sm:text-right">
        <ButtonLink
          href={href}
          variant={standing === "ready" || standing === "in_progress" ? "primary" : "secondary"}
          size="sm"
          icon={standing === "in_progress" ? <Clock className="size-4" aria-hidden /> : standing === "ready" ? <PlayCircle className="size-4" aria-hidden /> : undefined}
        >
          {standing === "passed" ? "Review" : standing === "in_progress" ? "Resume" : standing === "locked" ? "See what's needed" : standing === "no_tries" ? "View results" : a.attemptsUsed > 0 ? "Try again" : "Start"}
        </ButtonLink>
      </div>
    </li>
  );
}

export default function LearnerAssessmentsPage() {
  const searchParams = useSearchParams();
  const enrollmentFilter = searchParams.get("enrollment");
  const enrollments = useEnrollments();
  const assessments = useAllAssessments(enrollments.data);

  const [filter, setFilter] = useState<"todo" | "passed" | "all">("todo");

  const rows = useMemo(
    () => (assessments.data ?? []).filter((row) => !enrollmentFilter || row.enrollment.uuid === enrollmentFilter),
    [assessments.data, enrollmentFilter],
  );

  const byCourse = useMemo(() => {
    const groups = new Map<string, { enrollment: EnrollmentSummary; items: EnrollmentAssessment[] }>();
    for (const row of rows) {
      const group = groups.get(row.enrollment.uuid) ?? { enrollment: row.enrollment, items: [] };
      group.items.push(row);
      groups.set(row.enrollment.uuid, group);
    }
    return [...groups.values()].map((g) => ({ ...g, items: sortAssessments(g.items) }));
  }, [rows]);

  /** What to do next: finish what is open, else the first quiz or exam that is ready. */
  const next = useMemo(() => {
    const all = byCourse.flatMap((g) => g.items);
    return all.find((a) => standingOf(a) === "in_progress") ?? all.find((a) => standingOf(a) === "ready") ?? null;
  }, [byCourse]);

  const totals = useMemo(() => {
    const t = { all: rows.length, passed: 0, inProgress: 0, needHelp: 0 };
    for (const row of rows) {
      const s = standingOf(row);
      if (s === "passed") t.passed += 1;
      if (s === "in_progress") t.inProgress += 1;
      if (s === "no_tries") t.needHelp += 1;
    }
    return t;
  }, [rows]);

  const loading = enrollments.isPending || (!!enrollments.data && assessments.isPending);
  const failed = enrollments.isError || assessments.isError;
  const noCourses = !loading && !failed && (enrollments.data?.length ?? 0) === 0;
  const noAssessments = !loading && !failed && !noCourses && rows.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Learner"
        title="Assessments"
        subtitle="Module quizzes and the final exam. Pass every one to earn your certificate."
        actions={enrollmentFilter ? <ButtonLink href="/learner/assessments" variant="secondary" size="sm">Show all courses</ButtonLink> : null}
      />

      {failed ? (
        <Panel>
          <ErrorState
            message={(enrollments.error instanceof Error ? enrollments.error.message : undefined) ?? (assessments.error instanceof Error ? assessments.error.message : undefined)}
            onRetry={() => {
              void enrollments.refetch();
              void assessments.refetch();
            }}
          />
        </Panel>
      ) : loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
          </div>
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : noCourses ? (
        <Panel>
          <EmptyState
            icon={ClipboardCheck}
            title="You are not enrolled in a course yet"
            description="Your agency administrator gives you a seat in a course. Once you have one, its quizzes and final exam appear here."
            action={<ButtonLink href="/learner/courses" variant="secondary" size="sm">Go to my courses</ButtonLink>}
          />
        </Panel>
      ) : noAssessments ? (
        <Panel>
          <EmptyState
            icon={ClipboardCheck}
            title="No quizzes or exams in this course"
            description="This course has no assessments, so there is nothing to take here. Keep going with the lessons."
            action={<ButtonLink href="/learner/courses" variant="secondary" size="sm">Open my courses</ButtonLink>}
          />
        </Panel>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Passed" value={`${totals.passed} of ${totals.all}`} hint="quizzes and exams" icon={CheckCircle2} tone="ok" />
            <StatCard label="In progress" value={totals.inProgress} hint={totals.inProgress ? "Pick up where you left off" : "Nothing open right now"} icon={Clock} tone="warn" />
            <StatCard label="Need help" value={totals.needHelp} hint={totals.needHelp ? "Out of tries - ask your administrator" : "You still have tries on everything"} icon={TriangleAlert} tone={totals.needHelp ? "warn" : "info"} />
          </div>

          {next ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-navy-900 p-5 text-white shadow-card">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">{standingOf(next) === "in_progress" ? "Pick up where you left off" : "Up next"}</p>
                <p className="mt-1 truncate text-lg font-extrabold">{next.title}</p>
                <p className="truncate text-sm text-navy-200">{next.enrollment.course.title}</p>
              </div>
              <ButtonLink href={`/learner/assessments/${next.assessmentPublicId}?enrollment=${next.enrollment.uuid}`} variant="primary" icon={<ArrowRight className="size-4" aria-hidden />}>
                {standingOf(next) === "in_progress" ? "Resume" : "Start"}
              </ButtonLink>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Show">
            {([
              ["todo", "To do"],
              ["passed", "Passed"],
              ["all", "All"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", filter === value ? "bg-navy-900 text-white" : "bg-white text-ink-700 ring-1 ring-line hover:bg-canvas-soft")}
              >
                {label}
              </button>
            ))}
          </div>

          {(filter === "todo" && totals.passed === totals.all) || (filter === "passed" && totals.passed === 0) ? (
            <Panel>
              <EmptyState
                icon={filter === "todo" ? CheckCircle2 : ClipboardCheck}
                title={filter === "todo" ? "Everything is passed" : "Nothing passed yet"}
                description={filter === "todo" ? "You have passed every quiz and exam. Choose All or Passed to look back at your results." : "Quizzes and exams you pass will be listed here."}
              />
            </Panel>
          ) : null}

          {byCourse.map(({ enrollment, items: allItems }) => {
            const passed = allItems.filter((i) => i.hasPassed).length;
            const items = allItems.filter((i) => (filter === "all" ? true : filter === "passed" ? i.hasPassed : !i.hasPassed));
            if (items.length === 0) return null;
            const finished = passed === allItems.length;
            return (
              <Panel key={enrollment.uuid}>
                <details open={!finished || filter !== "todo"} className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-extrabold tracking-tight text-ink-900">{enrollment.course.title}</h2>
                      <p className="text-xs text-ink-600">
                        {passed} of {allItems.length} passed · lessons {Math.round(enrollment.progress_percent)}% complete
                        {finished ? " · all done" : ""}
                      </p>
                    </div>
                    <span className="flex items-center gap-3">
                      <Link href={`/learner/courses/${enrollment.uuid}`} className="text-sm font-semibold text-brand-700 hover:underline">Open course</Link>
                      <ChevronDown className="size-5 text-ink-500 transition-transform group-open:rotate-180" aria-hidden />
                    </span>
                  </summary>
                  <ProgressBar value={allItems.length ? (passed / allItems.length) * 100 : 0} label="Assessments passed" tone="ok" className="my-4" />
                  <ul className="space-y-3">
                    {items.map((a) => (
                      <AssessmentCard key={a.assessmentPublicId} a={a} />
                    ))}
                  </ul>
                </details>
              </Panel>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-canvas-soft p-5 ring-1 ring-line">
          <Target className="size-5 text-brand-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-ink-900">How passing works</p>
          <p className="mt-1 text-sm text-ink-600">Each quiz and exam shows its pass mark. Your best score is the one that counts, and answers are saved as you go so you can stop and resume.</p>
        </div>
        <div className="rounded-3xl bg-canvas-soft p-5 ring-1 ring-line">
          <RotateCcw className="size-5 text-brand-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-ink-900">Out of tries?</p>
          <p className="mt-1 text-sm text-ink-600">Your agency administrator can give you more tries from your learner page. You will get an email when they do.</p>
        </div>
      </div>
    </>
  );
}
