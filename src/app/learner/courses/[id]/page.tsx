"use client";

import { ArrowLeft, Award, CheckCircle2, Circle, Clock, FileText, Lock, PlayCircle, Trophy } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/modal";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useEnrollment } from "@/lib/api/hooks";
import {
  getLesson,
  learnerKeys,
  listAssessments,
  newIdempotencyKey,
  recordProgress,
  type AssessmentOverview,
  type LessonSummary,
} from "@/lib/api/learner";
import { formatDuration } from "@/lib/api/analytics";
import { LESSON_PROSE, vimeoEmbedUrl } from "@/lib/lesson-prose";
import { relativeDays } from "@/lib/utils";

interface GroupedModule {
  position: number;
  title: string;
  lessons: LessonSummary[];
}

function groupLessons(lessons: LessonSummary[]): GroupedModule[] {
  const groups = new Map<number, { title: string; lessons: LessonSummary[] }>();
  for (const lesson of lessons) {
    const key = lesson.modulePosition ?? 1;
    const group = groups.get(key) ?? { title: lesson.moduleTitle || `Module ${key}`, lessons: [] };
    group.lessons.push(lesson);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([position, group]) => ({
      position,
      title: group.title,
      lessons: group.lessons.sort((a, b) => a.lessonPosition - b.lessonPosition),
    }));
}

function LessonIcon({ lesson }: { lesson: LessonSummary }) {
  if (lesson.locked) return <Lock className="size-4 text-ink-400" aria-hidden />;
  if (lesson.completed) return <CheckCircle2 className="size-4 text-ok" aria-hidden />;
  if (lesson.lessonType === "video") return <PlayCircle className="size-4 text-brand-700" aria-hidden />;
  if (lesson.lessonType === "resource") return <FileText className="size-4 text-info" aria-hidden />;
  return <Circle className="size-4 text-ink-400" aria-hidden />;
}

type StepState = "done" | "open" | "locked";

/** The route to the certificate, in plain words: lessons, then module quizzes, then the final exam. */
function CertificatePath({
  enrollmentId,
  lessonsDone,
  lessonsTotal,
  assessments,
  completed,
}: {
  enrollmentId: string;
  lessonsDone: number;
  lessonsTotal: number;
  assessments: AssessmentOverview[] | undefined;
  completed: boolean;
}) {
  const quizzes = (assessments ?? []).filter((a) => a.kind === "module");
  const final = (assessments ?? []).find((a) => a.kind === "final");
  const quizzesPassed = quizzes.filter((q) => q.hasPassed).length;
  const lessonsComplete = lessonsTotal > 0 && lessonsDone >= lessonsTotal;
  const quizzesComplete = quizzes.length === 0 || quizzesPassed === quizzes.length;

  const steps: { key: string; title: string; detail: string; state: StepState; href?: string; cta?: string }[] = [
    {
      key: "lessons",
      title: "Finish the lessons",
      detail: `${lessonsDone} of ${lessonsTotal} lessons complete`,
      state: completed || lessonsComplete ? "done" : "open",
    },
  ];
  if (quizzes.length > 0) {
    steps.push({
      key: "quizzes",
      title: "Pass the module quizzes",
      detail: `${quizzesPassed} of ${quizzes.length} passed`,
      state: completed || quizzesComplete ? "done" : lessonsDone > 0 ? "open" : "locked",
      href: `/learner/assessments?enrollment=${enrollmentId}`,
      cta: "Open quizzes",
    });
  }
  if (final) {
    steps.push({
      key: "final",
      title: "Pass the final exam",
      detail: final.hasPassed
        ? "Passed"
        : final.locked
          ? (final.lockedReason ?? "Opens when the earlier steps are done.")
          : final.attemptsRemaining === 0
            ? "No tries left. Ask your agency administrator for more."
            : final.maxAttempts === null
              ? "Ready when you are"
              : `Ready. ${final.attemptsRemaining} of ${final.maxAttempts} tries left`,
      state: final.hasPassed ? "done" : final.locked ? "locked" : "open",
      href: `/learner/assessments/${final.assessmentPublicId}?enrollment=${enrollmentId}`,
      cta: final.inProgressAttemptId ? "Resume exam" : "Open exam",
    });
  }
  steps.push({
    key: "certificate",
    title: "Receive your certificate",
    detail: completed ? "Earned. Find it under Certificates." : "Issued automatically when every step above is done.",
    state: completed ? "done" : "locked",
    href: completed ? "/learner/certificates" : undefined,
    cta: "View certificate",
  });

  return (
    <Panel className="mt-6">
      <PanelHeader title="Your path to the certificate" description="Your certificate is issued after you finish every module and pass the final exam." />
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className={`rounded-2xl p-4 ring-1 ${s.state === "done" ? "bg-ok-bg/60 ring-ok/30" : s.state === "open" ? "bg-white ring-2 ring-brand-700" : "bg-canvas-soft ring-line"}`}
          >
            <div className="flex items-center gap-2">
              <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${s.state === "done" ? "bg-ok text-white" : s.state === "open" ? "bg-brand-700 text-white" : "bg-line text-ink-600"}`}>
                {s.state === "done" ? <CheckCircle2 className="size-4" aria-hidden /> : s.state === "locked" ? <Lock className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <p className="text-sm font-bold text-ink-900">{s.title}</p>
            </div>
            <p className="mt-2 text-sm text-ink-700">{s.detail}</p>
            {s.href && s.state !== "locked" ? (
              <Link href={s.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 underline-offset-4 hover:underline">
                {s.key === "certificate" ? <Award className="size-4" aria-hidden /> : null}
                {s.cta}
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function LessonDrawer({
  enrollmentId,
  lesson,
  readOnly,
  onClose,
}: {
  enrollmentId: string;
  lesson: LessonSummary | null;
  readOnly: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const content = useQuery({
    queryKey: learnerKeys.lesson(enrollmentId, lesson?.uuid ?? ""),
    queryFn: () => getLesson(enrollmentId, lesson!.uuid),
    enabled: !!lesson,
  });

  const complete = useMutation({
    mutationFn: () =>
      recordProgress({
        enrollment_uuid: enrollmentId,
        lesson_uuid: lesson!.uuid,
        action: "complete",
        idempotency_key: newIdempotencyKey("lesson"),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: learnerKeys.enrollment(enrollmentId) }),
        queryClient.invalidateQueries({ queryKey: learnerKeys.enrollments }),
      ]);
      toast.success("Lesson completed");
      onClose();
    },
    onError: (error) => toast.error("Could not complete the lesson", error instanceof Error ? error.message : undefined),
  });

  return (
    <Drawer
      open={!!lesson}
      onClose={onClose}
      title={lesson?.title ?? "Lesson"}
      description={lesson ? `${lesson.moduleTitle} · ${lesson.durationMinutes ? `${lesson.durationMinutes} min` : "Self-paced"}` : undefined}
      footer={
        lesson ? (
          <>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            {!lesson.completed && !readOnly ? (
              <Button loading={complete.isPending} onClick={() => complete.mutate()} icon={<CheckCircle2 className="size-4" aria-hidden />}>
                Mark as complete
              </Button>
            ) : lesson.completed ? (
              <Badge tone="ok" dot>Completed</Badge>
            ) : (
              <Badge tone="warn">Read only</Badge>
            )}
          </>
        ) : null
      }
    >
      {content.isError ? (
        <ErrorState message={content.error instanceof Error ? content.error.message : undefined} onRetry={() => void content.refetch()} />
      ) : content.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <div className="space-y-5">
          {content.data?.lesson.video ? (
            content.data.lesson.video.provider === "vimeo" && /^\d{4,15}$/.test(content.data.lesson.video.assetId) ? (
              <div className="aspect-video overflow-hidden rounded-2xl bg-navy-950">
                <iframe
                  title={content.data.lesson.title}
                  src={vimeoEmbedUrl(content.data.lesson.video.assetId)}
                  className="size-full"
                  allow="fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-navy-900 p-6 text-center text-white">
                <PlayCircle className="mx-auto size-10 text-brand-200" aria-hidden />
                <p className="mt-2 text-sm font-semibold">Video lesson</p>
              </div>
            )
          ) : null}

          {content.data?.lesson.bodyHtml ? (
            <article
              className={LESSON_PROSE}
              // Sanitized server-side before it reaches the client.
              dangerouslySetInnerHTML={{ __html: content.data.lesson.bodyHtml }}
            />
          ) : (
            <p className="text-sm text-ink-600">This lesson has no written content. Mark it complete once you have reviewed the material.</p>
          )}

          {content.data?.lesson.resources.length ? (
            <div className="rounded-2xl bg-canvas-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Resources</p>
              <ul className="mt-2 space-y-1.5">
                {content.data.lesson.resources.map((resource) => (
                  <li key={resource.name} className="flex items-center gap-2 text-sm text-ink-700">
                    <FileText className="size-4 text-ink-500" aria-hidden />
                    <span className="truncate">{resource.name}</span>
                    <span className="text-xs text-ink-500">{resource.mimeType}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-xs text-ink-500">
            Completion rule: {content.data?.lesson.completionRule ?? "manual"}
            {content.data?.lesson.completionThreshold ? ` (${content.data.lesson.completionThreshold}%)` : ""}
          </p>
        </div>
      )}
    </Drawer>
  );
}

export default function LearnerCoursePage({ params }: { params: { id: string } }) {
  const enrollment = useEnrollment(params.id);
  const [selected, setSelected] = useState<LessonSummary | null>(null);
  const assessments = useQuery({
    queryKey: learnerKeys.assessments(params.id),
    queryFn: () => listAssessments(params.id),
    // A completed enrollment has no open assessments; the path then shows everything as done.
    retry: false,
  });

  if (enrollment.isError) {
    return (
      <>
        <PageHeader eyebrow="Learner" title="Course" actions={<ButtonLink href="/learner/courses" variant="secondary" icon={<ArrowLeft className="size-4" aria-hidden />}>Back</ButtonLink>} />
        <Panel><ErrorState message={enrollment.error instanceof Error ? enrollment.error.message : "This course could not be loaded."} onRetry={() => void enrollment.refetch()} /></Panel>
      </>
    );
  }

  if (enrollment.isPending || !enrollment.data) {
    return (
      <>
        <PageHeader eyebrow="Learner" title="Course" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  const data = enrollment.data;
  const modules = groupLessons(data.lessons);
  const total = data.lessons.length;
  const done = data.lessons.filter((lesson) => lesson.completed).length;
  // Course time is the planned length of the lessons (reading lessons have no stopwatch), so it is an estimate.
  const minutesOf = (list: LessonSummary[]) => list.reduce((n, l) => n + (l.durationMinutes ?? 0), 0);
  const totalMinutes = minutesOf(data.lessons);
  const doneMinutes = minutesOf(data.lessons.filter((l) => l.completed));

  return (
    <>
      <PageHeader
        eyebrow="Learner"
        title={data.course.title}
        subtitle={data.course.description ?? "Course materials and lesson progress."}
        actions={<ButtonLink href="/learner/courses" variant="secondary" icon={<ArrowLeft className="size-4" aria-hidden />}>All courses</ButtonLink>}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <ProgressRing value={data.progress_percent} label={`${data.course.title} progress`}>
              <div>
                <p className="tnum text-2xl font-extrabold text-ink-900">{Math.round(data.progress_percent)}%</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">complete</p>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={data.status === "completed" ? "ok" : data.readOnly ? "warn" : "brand"} dot>{data.status.replace(/_/g, " ")}</Badge>
                {data.readOnly ? <Badge tone="info" dot>{data.status === "completed" ? "Finished - review only" : "Read only"}</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-ink-600">
                <span className="tnum font-semibold text-ink-900">{done}</span> of <span className="tnum font-semibold text-ink-900">{total}</span> lessons complete
                {totalMinutes > 0 ? ` · about ${formatDuration(doneMinutes * 60)} of ${formatDuration(totalMinutes * 60)} learned` : ""}
                {data.due_at ? ` · due ${new Date(data.due_at).toLocaleDateString()}` : ""}
              </p>
              <ProgressBar value={data.progress_percent} label="Course progress" className="mt-3" />
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink href={`/learner/assessments?enrollment=${data.uuid}`} variant="secondary" size="sm" icon={<Trophy className="size-4" aria-hidden />}>Assessments</ButtonLink>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-4">
          <PanelHeader title="Course details" description="Assigned by your agency." />
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col items-start gap-1 border-b border-line pb-3">
              <dt className="text-ink-600">Agency</dt>
              <dd className="font-semibold text-ink-900">{data.agency.name}</dd>
            </div>
            <div className="flex flex-col items-start gap-1 border-b border-line pb-3">
              <dt className="text-ink-600">Due</dt>
              <dd className="font-semibold text-ink-900">{data.due_at ? new Date(data.due_at).toLocaleDateString() : "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-600">Enrollment</dt>
              <dd className="truncate font-mono text-xs text-ink-600">{data.uuid.slice(0, 8)}…</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <CertificatePath
        enrollmentId={data.uuid}
        lessonsDone={done}
        lessonsTotal={total}
        assessments={assessments.data}
        completed={data.status === "completed"}
      />

      <div className="mt-6 space-y-4">
        {modules.length === 0 ? (
          <Panel><p className="py-8 text-center text-sm text-ink-600">Lessons are being prepared for this course.</p></Panel>
        ) : (
          modules.map((module) => {
            const moduleDone = module.lessons.filter((lesson) => lesson.completed).length;
            const moduleMinutes = minutesOf(module.lessons);
            return (
              <Panel key={module.position}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Module {module.position}</p>
                    <h2 className="text-base font-bold text-ink-900">{module.title}</h2>
                    {moduleMinutes > 0 ? <p className="text-xs text-ink-600">About {formatDuration(moduleMinutes * 60)} · {Math.round((moduleDone / Math.max(1, module.lessons.length)) * 100)}% done</p> : null}
                  </div>
                  <Badge tone={moduleDone === module.lessons.length ? "ok" : "neutral"}>{moduleDone}/{module.lessons.length} complete</Badge>
                </div>
                <ul className="divide-y divide-line">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.uuid}>
                      <button
                        type="button"
                        onClick={() => setSelected(lesson)}
                        disabled={lesson.locked}
                        title={lesson.lockedReason ?? undefined}
                        className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-ink-900"
                      >
                        <LessonIcon lesson={lesson} />
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${lesson.completed ? "text-ink-600" : "text-ink-900"}`}>{lesson.title}</p>
                          <p className="text-xs capitalize text-ink-500">
                            {lesson.lessonType} · {lesson.durationMinutes ? `${lesson.durationMinutes} min` : "self-paced"}
                            {lesson.progressPercent > 0 && !lesson.completed ? ` · ${Math.round(lesson.progressPercent)}% watched` : ""}
                          </p>
                          {lesson.locked ? <p className="text-xs text-ink-600">{lesson.lockedReason}</p> : null}
                        </div>
                        {lesson.completed ? <CheckCircle2 className="size-4 text-ok" aria-hidden /> : <Clock className="size-4 text-ink-400" aria-hidden />}
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })
        )}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-ink-500">
        <Lock className="size-3.5" aria-hidden /> Progress is recorded by the backend against your enrollment. Closing the browser does not lose completed lessons.
      </p>

      <LessonDrawer enrollmentId={data.uuid} lesson={selected} readOnly={data.readOnly} onClose={() => setSelected(null)} />
    </>
  );
}
