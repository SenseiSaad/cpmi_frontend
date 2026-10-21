"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  Check,
  Shield,
  Lock,
  ChevronDown,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { EmptyState, ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";
import {
  getEnrollment,
  getLesson,
  learnerKeys,
  listEnrollments,
  newIdempotencyKey,
  recordProgress,
  type EnrollmentDetail,
  type LessonSummary,
  type ProgressResult,
} from "@/features/learner/api";
import { formatBytes, formatSeconds } from "@/features/learner/format";

const HEARTBEAT_MS = 30_000;
const VIMEO_ORIGIN = "https://player.vimeo.com";

function lessonNumber(l: LessonSummary) {
  return `${l.modulePosition}.${l.lessonPosition}`;
}

/** Index of the furthest lesson the learner may open (sequential gating). */
function unlockedUpTo(lessons: LessonSummary[], readOnly: boolean): number {
  if (readOnly) return lessons.length - 1;
  const firstIncomplete = lessons.findIndex((l) => !l.completed);
  return firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete;
}

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const enrollmentId = String(params.id ?? "");
  const requestedLesson = searchParams.get("lesson");

  const enrollmentQ = useQuery({
    queryKey: learnerKeys.enrollment(enrollmentId),
    queryFn: () => getEnrollment(enrollmentId),
    enabled: !!enrollmentId,
  });
  const enrollmentsQ = useQuery({ queryKey: learnerKeys.enrollments, queryFn: listEnrollments });

  const detail = enrollmentQ.data;
  const lessons = useMemo(
    () =>
      [...(detail?.lessons ?? [])].sort(
        (a, b) => a.modulePosition - b.modulePosition || a.lessonPosition - b.lessonPosition,
      ),
    [detail?.lessons],
  );
  const readOnly = detail?.readOnly ?? false;
  const maxUnlocked = unlockedUpTo(lessons, readOnly);

  // Active lesson: ?lesson=… if unlocked, else the first incomplete lesson.
  const requestedIndex = requestedLesson ? lessons.findIndex((l) => l.uuid === requestedLesson) : -1;
  const currentLessonIndex =
    requestedIndex >= 0 && requestedIndex <= maxUnlocked ? requestedIndex : Math.max(0, maxUnlocked);
  const activeLesson: LessonSummary | undefined = lessons[currentLessonIndex];

  const selectLesson = useCallback(
    (uuid: string) => router.replace(`/learner/courses/${enrollmentId}?lesson=${uuid}`, { scroll: false }),
    [router, enrollmentId],
  );

  const lessonQ = useQuery({
    queryKey: learnerKeys.lesson(enrollmentId, activeLesson?.uuid ?? ""),
    queryFn: () => getLesson(enrollmentId, activeLesson!.uuid),
    enabled: !!activeLesson && !readOnly,
  });
  const content = lessonQ.data?.lesson;

  /** Merge a progress result into the cached enrollment so gating updates immediately. */
  const applyProgress = useCallback(
    (result: ProgressResult) => {
      queryClient.setQueryData<EnrollmentDetail>(learnerKeys.enrollment(enrollmentId), (prev) =>
        prev
          ? {
              ...prev,
              status: result.enrollment.status,
              progress_percent: result.enrollment.progress_percent,
              lessons: prev.lessons.map((l) =>
                l.uuid === result.lesson.uuid
                  ? { ...l, completed: result.lesson.completed, progressPercent: result.lesson.progress_percent }
                  : l,
              ),
            }
          : prev,
      );
      if (result.enrollment.status === "completed" || result.lesson.completed) {
        void queryClient.invalidateQueries({ queryKey: learnerKeys.enrollments });
        void queryClient.invalidateQueries({ queryKey: ["learner", "assessments"] });
        void queryClient.invalidateQueries({ queryKey: learnerKeys.allAssessments });
      }
    },
    [queryClient, enrollmentId],
  );

  // ---- open ---------------------------------------------------------------------------
  const activeUuid = activeLesson?.uuid;
  const activeCompleted = activeLesson?.completed ?? false;
  useEffect(() => {
    if (!activeUuid || readOnly || activeCompleted) return;
    recordProgress({
      enrollment_uuid: enrollmentId,
      lesson_uuid: activeUuid,
      action: "open",
      idempotency_key: newIdempotencyKey("open"),
    })
      .then(applyProgress)
      .catch(() => undefined);
    // Only once per lesson visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId, activeUuid, readOnly]);

  // ---- video tracking (Vimeo postMessage API) ----------------------------------------
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const positionRef = useRef(0);
  const pendingWatchedRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const isVimeo = content?.lessonType === "video" && content.video?.provider.toLowerCase() === "vimeo";

  useEffect(() => {
    positionRef.current = activeLesson?.playbackSeconds ?? 0;
    pendingWatchedRef.current = 0;
    setIsPlaying(false);
    setVideoPosition(activeLesson?.playbackSeconds ?? 0);
    setVideoDuration(content?.durationSeconds ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUuid, content?.uuid]);

  useEffect(() => {
    if (!isVimeo) return;
    const post = (method: string, value?: unknown) =>
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method, value }), VIMEO_ORIGIN);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== VIMEO_ORIGIN || event.source !== iframeRef.current?.contentWindow) return;
      let msg: { event?: string; data?: { seconds?: number; duration?: number } };
      try {
        msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      switch (msg.event) {
        case "ready":
          ["timeupdate", "play", "pause", "ended"].forEach((e) => post("addEventListener", e));
          break;
        case "play":
          setIsPlaying(true);
          break;
        case "pause":
        case "ended":
          setIsPlaying(false);
          break;
        case "timeupdate": {
          const seconds = Number(msg.data?.seconds ?? 0);
          const diff = seconds - positionRef.current;
          // Count only continuous forward playback; ignore seeks.
          if (diff > 0 && diff <= 2) pendingWatchedRef.current += diff;
          positionRef.current = seconds;
          setVideoPosition(seconds);
          if (msg.data?.duration) setVideoDuration(msg.data.duration);
          break;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isVimeo, content?.uuid]);

  const sendHeartbeat = useCallback(() => {
    if (!activeUuid) return;
    const delta = Math.min(120, Math.floor(pendingWatchedRef.current));
    if (delta <= 0) return;
    pendingWatchedRef.current -= delta;
    recordProgress({
      enrollment_uuid: enrollmentId,
      lesson_uuid: activeUuid,
      action: "heartbeat",
      playback_seconds: Math.floor(positionRef.current),
      watched_delta_seconds: delta,
      idempotency_key: newIdempotencyKey("hb"),
    })
      .then(applyProgress)
      .catch(() => {
        pendingWatchedRef.current += delta; // retry on the next tick
      });
  }, [enrollmentId, activeUuid, applyProgress]);

  useEffect(() => {
    if (!isVimeo || readOnly || activeCompleted) return;
    const timer = setInterval(sendHeartbeat, HEARTBEAT_MS);
    return () => {
      clearInterval(timer);
      sendHeartbeat(); // flush on lesson change / unmount
    };
  }, [isVimeo, readOnly, activeCompleted, sendHeartbeat]);

  // ---- complete -----------------------------------------------------------------------
  const completeMutation = useMutation({
    mutationFn: (lessonUuid: string) =>
      recordProgress({
        enrollment_uuid: enrollmentId,
        lesson_uuid: lessonUuid,
        action: "complete",
        idempotency_key: newIdempotencyKey("complete"),
      }),
    onSuccess: applyProgress,
  });

  useEffect(() => completeMutation.reset(), [activeUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLast = currentLessonIndex === lessons.length - 1;
  const nextUnlocked = readOnly || activeCompleted;

  const handleNextLesson = () => {
    if (!nextUnlocked) return;
    if (!isLast) selectLesson(lessons[currentLessonIndex + 1].uuid);
    else router.push(`/learner/assessments/${enrollmentId}`);
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) selectLesson(lessons[currentLessonIndex - 1].uuid);
  };

  if (enrollmentQ.isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <LoadingState label="Loading course…" />
      </div>
    );
  }
  if (enrollmentQ.isError || !detail) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-4 p-6">
        <ErrorState error={enrollmentQ.error} onRetry={() => enrollmentQ.refetch()} />
        <Link href="/learner/courses" className="text-xs font-bold text-primary-700 hover:text-primary-900">
          Back to My Courses
        </Link>
      </div>
    );
  }

  const progress = detail.progress_percent;
  const completionRule = content?.completionRule;
  const threshold = content?.completionThreshold ?? 100;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row text-gray-900 selection:bg-secondary-500 selection:text-primary-950">
      {/* LEFT SIDEBAR: Course & Lessons Navigation */}
      <aside className="w-full lg:w-72 bg-[#152A13] text-white flex flex-col flex-shrink-0 border-r border-[#1e3b1c]">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/learner">
            <Logo variant="light" size="sm" />
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-400 bg-white/5 px-2 py-0.5 rounded">
            LMS Player
          </span>
        </div>

        {/* Course Selector Dropdown */}
        <div className="p-4 border-b border-white/10">
          <label htmlFor="course-select" className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">
            Current Course
          </label>
          <div className="relative">
            <select
              id="course-select"
              value={detail.uuid}
              onChange={(e) => router.push(`/learner/courses/${e.target.value}`)}
              className="w-full bg-[#1b3519] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-secondary-500 appearance-none pr-8 cursor-pointer"
            >
              {(enrollmentsQ.data ?? [detail]).map((m) => (
                <option key={m.uuid} value={m.uuid} className="bg-[#152A13] text-white">
                  {m.course.title}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          </div>
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-3 py-1">Course Lessons</p>

          {lessons.length > 0 ? (
            lessons.map((lesson, idx) => {
              const isActive = idx === currentLessonIndex;
              const isLocked = idx > maxUnlocked;
              return (
                <button
                  key={lesson.uuid}
                  onClick={() => !isLocked && selectLesson(lesson.uuid)}
                  disabled={isLocked}
                  title={isLocked ? "Complete the previous lesson to unlock" : undefined}
                  className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                    isActive
                      ? "bg-highlight-500/20 text-white border border-highlight-500/50 shadow-sm font-bold"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        lesson.completed || isActive
                          ? "bg-highlight-500 text-primary-950"
                          : "border border-white/20 text-white/60"
                      }`}
                    >
                      {lesson.completed ? <Check size={11} /> : isLocked ? <Lock size={10} /> : lesson.lessonPosition}
                    </div>
                    <span className="truncate">
                      {lessonNumber(lesson)} {lesson.title}
                    </span>
                  </div>
                  {lesson.durationMinutes != null && (
                    <span className="text-[10px] text-white/50 ml-2 whitespace-nowrap">{lesson.durationMinutes} min</span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-4 text-xs text-white/50 text-center">
              {readOnly ? "This course is complete and is now read-only." : "No lessons in this course yet."}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 text-[10px] text-white/60 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary-400" />
          <span>Server-side position verified for audit</span>
        </div>
      </aside>

      {/* MAIN PLAYER CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/learner/courses"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ChevronLeft size={14} /> Back to My Courses
            </Link>
            <div className="hidden sm:block">
              <h2 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">{detail.course.title}</h2>
              {activeLesson && (
                <p className="text-[11px] text-gray-500 font-medium">
                  Lesson {currentLessonIndex + 1} of {lessons.length}
                  {activeLesson.durationMinutes != null ? ` • ${activeLesson.durationMinutes} min` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-primary-700 whitespace-nowrap">{progress}% Complete</span>
            <div className="w-32 sm:w-44 bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-highlight-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {readOnly ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm">
              <EmptyState
                title="Course completed"
                description="You have completed this course. Lesson content is no longer available, but your certificate is."
                action={
                  <Link href="/learner/certificates" className="mt-2 text-xs font-bold text-primary-700 hover:text-primary-900">
                    View certificates
                  </Link>
                }
              />
            </div>
          ) : !activeLesson ? (
            <EmptyState title="No lessons yet" description="This course has no published lessons." />
          ) : lessonQ.isLoading ? (
            <LoadingState label="Loading lesson…" />
          ) : lessonQ.isError || !content ? (
            <ErrorState error={lessonQ.error} onRetry={() => lessonQ.refetch()} />
          ) : (
            <>
              <div className="grid lg:grid-cols-12 gap-6 items-start">
                {/* VIDEO PLAYER */}
                {content.lessonType === "video" && (
                  <div className="lg:col-span-8 bg-black rounded-3xl overflow-hidden shadow-xl border border-gray-800 flex flex-col">
                    <div className="relative aspect-video w-full bg-gray-950 flex items-center justify-center overflow-hidden">
                      {isVimeo && content.video ? (
                        <iframe
                          key={content.uuid}
                          ref={iframeRef}
                          src={`${VIMEO_ORIGIN}/video/${encodeURIComponent(content.video.assetId)}?api=1&dnt=1#t=${Math.floor(
                            activeLesson.playbackSeconds,
                          )}s`}
                          title={content.title}
                          className="absolute inset-0 h-full w-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <p className="text-xs text-white/70">This video is not available in the player.</p>
                      )}
                      <div className="pointer-events-none absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-bold flex items-center gap-2">
                        <Shield size={13} className="text-secondary-400" />
                        <span>
                          {lessonNumber(activeLesson)} {content.title}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#121c11] px-5 py-3.5 text-white flex flex-col gap-2 border-t border-white/10">
                      <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-highlight-500 rounded-full"
                          style={{ width: `${activeLesson.completed ? 100 : activeLesson.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium pt-1">
                        <span className="text-[11px] text-white/70 font-mono">
                          {formatSeconds(videoPosition)} / {formatSeconds(videoDuration)}
                        </span>
                        <span className="text-[10px] bg-white/10 text-secondary-400 px-2 py-0.5 rounded font-bold">
                          {activeLesson.completed
                            ? "Completed"
                            : `${activeLesson.progressPercent}% watched${isPlaying ? " • Tracking" : ""}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* LESSON RESOURCES PANEL */}
                <div
                  className={`${
                    content.lessonType === "video" ? "lg:col-span-4" : "lg:col-span-12"
                  } bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-6`}
                >
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-secondary-600" />
                      Lesson Resources
                    </h3>
                    {content.resources.length === 0 ? (
                      <p className="text-xs text-gray-500">No resources are attached to this lesson.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {[...content.resources]
                          .sort((a, b) => a.position - b.position)
                          .map((res) => (
                            <div
                              key={`${res.position}-${res.name}`}
                              className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold text-gray-900 truncate">{res.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {[formatBytes(res.byteSize), res.mimeType].filter(Boolean).join(" • ")}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Completion */}
                  {!activeLesson.completed && (
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      <p className="text-[11px] text-gray-500">
                        {completionRule === "video_percent"
                          ? `Watch at least ${Math.round(threshold)}% of the video to complete this lesson.`
                          : "Mark this lesson complete to unlock the next one."}
                      </p>
                      <button
                        onClick={() => completeMutation.mutate(activeLesson.uuid)}
                        disabled={completeMutation.isPending}
                        className="w-full bg-[#152A13] hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} className="text-secondary-400" />
                        {completeMutation.isPending ? "Saving…" : "Mark Lesson Complete"}
                      </button>
                      {completeMutation.isError && (
                        <p className="text-[11px] font-semibold text-red-600" role="alert">
                          {errorMessage(completeMutation.error)}
                        </p>
                      )}
                    </div>
                  )}
                  {activeLesson.completed && (
                    <p className="pt-4 border-t border-gray-100 text-xs font-bold text-highlight-600 flex items-center gap-1.5">
                      <Check size={14} /> Lesson completed
                    </p>
                  )}
                </div>
              </div>

              {/* LESSON BODY & STEP NAVIGATION */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-600 bg-secondary-50 px-2.5 py-1 rounded-md border border-secondary-200">
                      {activeLesson.moduleTitle}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                      {lessonNumber(activeLesson)} {content.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrevLesson}
                      disabled={currentLessonIndex === 0}
                      className="px-4 py-2.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <ChevronLeft size={15} /> Previous
                    </button>
                    <button
                      onClick={handleNextLesson}
                      disabled={!nextUnlocked}
                      title={nextUnlocked ? undefined : "Complete this lesson to continue"}
                      className="px-6 py-2.5 bg-[#152A13] hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {!nextUnlocked && <Lock size={13} className="text-secondary-400" />}
                      <span>{isLast ? "Go to Assessments" : "Next Lesson"}</span>
                      <ChevronRight size={15} className="text-secondary-400" />
                    </button>
                  </div>
                </div>

                {content.bodyHtml ? (
                  <div
                    className="pt-6 max-w-4xl space-y-4 text-sm text-gray-700 leading-relaxed [&_h2]:text-base [&_h2]:font-black [&_h2]:text-gray-900 [&_h3]:font-bold [&_h3]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary-700 [&_a]:underline"
                    // bodyHtml is sanitized by the backend before it is stored/served.
                    dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
                  />
                ) : (
                  content.lessonType !== "video" && (
                    <p className="pt-6 text-sm text-gray-500">This lesson has no written content.</p>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
