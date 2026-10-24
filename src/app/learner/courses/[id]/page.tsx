"use client";

import { ArrowLeft, CheckCircle2, Circle, Clock, FileText, Lock, PlayCircle, Trophy } from "lucide-react";
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
  newIdempotencyKey,
  recordProgress,
  type LessonSummary,
} from "@/lib/api/learner";
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
  if (lesson.completed) return <CheckCircle2 className="size-4 text-ok" aria-hidden />;
  if (lesson.lessonType === "video") return <PlayCircle className="size-4 text-brand-700" aria-hidden />;
  if (lesson.lessonType === "resource") return <FileText className="size-4 text-info" aria-hidden />;
  return <Circle className="size-4 text-ink-400" aria-hidden />;
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
            <div className="rounded-2xl bg-navy-900 p-6 text-center text-white">
              <PlayCircle className="mx-auto size-10 text-brand-200" aria-hidden />
              <p className="mt-2 text-sm font-semibold">Video lesson</p>
              <p className="mt-1 text-xs text-white/70">
                {content.data.lesson.video.provider} asset {content.data.lesson.video.assetId}
              </p>
            </div>
          ) : null}

          {content.data?.lesson.bodyHtml ? (
            <article
              className="space-y-3 text-sm leading-relaxed text-ink-700 [&_a]:text-brand-700 [&_a]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5"
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
                {data.readOnly ? <Badge tone="warn" dot>Read only</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-ink-600">
                <span className="tnum font-semibold text-ink-900">{done}</span> of <span className="tnum font-semibold text-ink-900">{total}</span> lessons complete
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

      <div className="mt-6 space-y-4">
        {modules.length === 0 ? (
          <Panel><p className="py-8 text-center text-sm text-ink-600">Lessons are being prepared for this course.</p></Panel>
        ) : (
          modules.map((module) => {
            const moduleDone = module.lessons.filter((lesson) => lesson.completed).length;
            return (
              <Panel key={module.position}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Module {module.position}</p>
                    <h2 className="text-base font-bold text-ink-900">{module.title}</h2>
                  </div>
                  <Badge tone={moduleDone === module.lessons.length ? "ok" : "neutral"}>{moduleDone}/{module.lessons.length} complete</Badge>
                </div>
                <ul className="divide-y divide-line">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.uuid}>
                      <button
                        type="button"
                        onClick={() => setSelected(lesson)}
                        className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-brand-800"
                      >
                        <LessonIcon lesson={lesson} />
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${lesson.completed ? "text-ink-600" : "text-ink-900"}`}>{lesson.title}</p>
                          <p className="text-xs capitalize text-ink-500">
                            {lesson.lessonType} · {lesson.durationMinutes ? `${lesson.durationMinutes} min` : "self-paced"}
                            {lesson.progressPercent > 0 && !lesson.completed ? ` · ${Math.round(lesson.progressPercent)}% watched` : ""}
                          </p>
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
