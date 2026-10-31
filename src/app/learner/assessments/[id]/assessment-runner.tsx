"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Award,
  ArrowLeft,
  History,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  getAttempt,
  learnerKeys,
  listAssessments,
  listAttempts,
  saveAnswers,
  startAttempt,
  submitAttempt,
  type AnswerMap,
  type AttemptQuestion,
  type AttemptView,
} from "@/lib/api/learner";
import { cn } from "@/lib/utils";

const PRIMARY_BTN =
  "inline-flex select-none items-center justify-center whitespace-nowrap rounded-xl bg-[#152A13] px-7 py-2.5 text-xs font-black text-white transition-all shadow-xs hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:pointer-events-none disabled:opacity-50";

const SECONDARY_BTN =
  "inline-flex select-none items-center justify-center whitespace-nowrap rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:pointer-events-none disabled:opacity-40";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TYPE_LABEL: Record<AttemptQuestion["questionType"], string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  true_false: "True or false",
  matching: "Matching",
};

const STATUS_LABEL: Record<AttemptView["status"], string> = {
  in_progress: "In progress",
  submitted: "Submitted",
  graded: "Graded",
  abandoned: "Abandoned",
};

function statusPillClass(status: AttemptView["status"]): string {
  if (status === "in_progress") return "bg-amber-100 text-amber-800";
  if (status === "submitted") return "bg-blue-100 text-blue-800";
  if (status === "graded") return "bg-emerald-100 text-emerald-800";
  return "bg-gray-100 text-gray-700";
}

function questionTypeLabel(type: AttemptQuestion["questionType"]): string {
  return TYPE_LABEL[type] ?? type.replace(/_/g, " ");
}

function isAnswered(question: AttemptQuestion, answer: AnswerMap[string] | undefined): boolean {
  if (!answer) return false;
  if (question.questionType === "matching") {
    const left = question.pairs?.left ?? [];
    if (left.length === 0) return false;
    return left.every((pair) => Boolean(answer.matches?.[pair.key]));
  }
  return (answer.selected?.length ?? 0) > 0;
}

function hintFor(question: AttemptQuestion): string {
  if (question.questionType === "multiple_choice") return "Select every correct answer.";
  if (question.questionType === "matching") return "Match each item on the left with its pair.";
  return "Select the single best answer.";
}

/** Zed exam card: white rounded workspace with internal progress + dark CTA. */
export function AssessmentRunner({ assessmentId }: { assessmentId: string }) {
  const searchParams = useSearchParams();
  const enrollmentRef = searchParams.get("enrollment");
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const overviewQuery = useQuery({
    queryKey: learnerKeys.assessments(enrollmentRef ?? ""),
    queryFn: () => listAssessments(enrollmentRef as string),
    enabled: Boolean(enrollmentRef),
  });

  const attemptsQuery = useQuery({
    queryKey: learnerKeys.attempts(enrollmentRef ?? "", assessmentId),
    queryFn: () => listAttempts(enrollmentRef as string, assessmentId),
    enabled: Boolean(enrollmentRef),
  });

  const attemptQuery = useQuery({
    queryKey: learnerKeys.attempt(attemptId ?? ""),
    queryFn: () => getAttempt(attemptId as string),
    enabled: Boolean(attemptId),
  });

  const assessment = useMemo(
    () => overviewQuery.data?.find((item) => item.assessmentPublicId === assessmentId) ?? null,
    [overviewQuery.data, assessmentId],
  );

  useEffect(() => {
    if (!attemptId && assessment?.inProgressAttemptId) {
      setAttemptId(assessment.inProgressAttemptId);
    }
  }, [assessment?.inProgressAttemptId, attemptId]);

  const attempt = attemptQuery.data ?? null;

  // Real elapsed time from the server-side attempt start (the exam has no configured time limit).
  useEffect(() => {
    if (!attempt?.startedAt || attempt.status !== "in_progress") return;
    const started = new Date(attempt.startedAt).getTime();
    if (Number.isNaN(started)) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.startedAt, attempt?.status]);

  const start = useMutation({
    mutationFn: () => startAttempt(enrollmentRef as string, assessmentId),
    onSuccess: async (view) => {
      setAttemptId(view.attemptPublicId);
      setAnswers({});
      setQuestionIndex(0);
      await queryClient.invalidateQueries({ queryKey: ["learner"] });
    },
    onError: (error) => {
      toast.error("Could not start the attempt", error instanceof Error ? error.message : undefined);
    },
  });

  const save = useMutation({
    mutationFn: () => saveAnswers(attemptId as string, answers),
    onSuccess: () => toast.success("Progress saved", "You can leave and resume this attempt later."),
    onError: (error) => toast.error("Could not save progress", error instanceof Error ? error.message : undefined),
  });

  const submit = useMutation({
    mutationFn: () => submitAttempt(attemptId as string, answers),
    onSuccess: async (view) => {
      setConfirmSubmit(false);
      setAttemptId(view.attemptPublicId);
      queryClient.setQueryData(learnerKeys.attempt(view.attemptPublicId), view);
      await queryClient.invalidateQueries({ queryKey: ["learner"] });
      toast.success(
        view.passed ? "Assessment passed" : "Attempt submitted",
        view.passed ? "Your result is recorded on the server." : "Review the feedback below.",
      );
    },
    onError: (error) => {
      setConfirmSubmit(false);
      toast.error("Could not submit the attempt", error instanceof Error ? error.message : undefined);
    },
  });

  const questions = attempt?.questions ?? [];
  const currentQuestion = questions[questionIndex] ?? questions[0] ?? null;
  const answeredCount = questions.filter((question) => isAnswered(question, answers[question.questionPublicId])).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const questionProgress = questions.length > 0 ? Math.round(((questionIndex + 1) / questions.length) * 100) : 0;
  const maxReached =
    assessment !== null && assessment.maxAttempts !== null && assessment.attemptsUsed >= assessment.maxAttempts;

  const timerLabel = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  };

  function setOption(question: AttemptQuestion, optionKey: string) {
    setAnswers((previous) => {
      const current = previous[question.questionPublicId] ?? {};
      const selected = current.selected ?? [];
      const nextSelected =
        question.questionType === "multiple_choice"
          ? selected.includes(optionKey)
            ? selected.filter((key) => key !== optionKey)
            : [...selected, optionKey]
          : [optionKey];
      return { ...previous, [question.questionPublicId]: { ...current, selected: nextSelected } };
    });
  }

  function setMatch(question: AttemptQuestion, leftKey: string, rightKey: string) {
    setAnswers((previous) => {
      const current = previous[question.questionPublicId] ?? {};
      const matches = { ...(current.matches ?? {}) };
      if (rightKey) matches[leftKey] = rightKey;
      else delete matches[leftKey];
      return { ...previous, [question.questionPublicId]: { ...current, matches } };
    });
  }

  function resetToOverview() {
    setAttemptId(null);
    setAnswers({});
    setQuestionIndex(0);
    void queryClient.invalidateQueries({ queryKey: learnerKeys.attempts(enrollmentRef ?? "", assessmentId) });
  }

  async function saveAndExit() {
    if (!attemptId) return;
    if (answeredCount > 0) {
      try {
        await saveAnswers(attemptId, answers);
      } catch (error) {
        toast.error("Could not save progress", error instanceof Error ? error.message : undefined);
        return;
      }
    }
    router.push("/learner/assessments");
  }

  if (!enrollmentRef) {
    return <RunnerNoticeShell title="Assessment" icon={ClipboardCheck} heading="Choose an assessment from your list" body="An attempt belongs to a specific enrollment. Open it from the assessment list so the course context is known." action={<Link href="/learner/assessments" className={PRIMARY_BTN}>Open my assessments</Link>} />;
  }

  if (overviewQuery.isError || attemptsQuery.isError) {
    return (
      <RunnerNoticeShell
        title="Assessment"
        icon={AlertTriangle}
        heading="We couldn't load this assessment"
        body={
          (overviewQuery.error instanceof Error ? overviewQuery.error.message : undefined) ??
          (attemptsQuery.error instanceof Error ? attemptsQuery.error.message : undefined) ??
          "Something went wrong. Please try again."
        }
        action={
          <div className="flex gap-3">
            <button
              className={SECONDARY_BTN}
              onClick={() => {
                void overviewQuery.refetch();
                void attemptsQuery.refetch();
              }}
            >
              Try again
            </button>
            <Link href="/learner/assessments" className={SECONDARY_BTN}>Back to assessments</Link>
          </div>
        }
      />
    );
  }

  if (overviewQuery.isPending || attemptsQuery.isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 py-24" role="status" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-highlight-600" aria-hidden />
        <p className="text-xs font-bold text-gray-500">Loading assessment…</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <RunnerNoticeShell
        title="Assessment"
        icon={AlertTriangle}
        heading="Assessment not found"
        body="This assessment is not part of the selected enrollment, or it is no longer available."
        action={<Link href="/learner/assessments" className={SECONDARY_BTN}>Back to assessments</Link>}
      />
    );
  }

  if (attemptId && attemptQuery.isError) {
    return (
      <RunnerNoticeShell
        title={assessment.title}
        icon={AlertTriangle}
        heading="We couldn't load this attempt"
        body={attemptQuery.error instanceof Error ? attemptQuery.error.message : "Something went wrong. Please try again."}
        action={
          <div className="flex gap-3">
            <button className={SECONDARY_BTN} onClick={() => void attemptQuery.refetch()}>Try again</button>
            <button className={SECONDARY_BTN} onClick={resetToOverview}>Assessment overview</button>
          </div>
        }
      />
    );
  }

  if (attemptId && attemptQuery.isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 py-24" role="status" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-highlight-600" aria-hidden />
        <p className="text-xs font-bold text-gray-500">Loading attempt…</p>
      </div>
    );
  }

  if (attempt && attempt.status === "in_progress" && currentQuestion) {
    const currentAnswer = answers[currentQuestion.questionPublicId];
    const multi = currentQuestion.questionType === "multiple_choice";
    const matching = currentQuestion.questionType === "matching";

    return (
      <div className="flex flex-col justify-between">
        {/* EXAM HEADER STRIP (Zed Screen 5 header) */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/learner/assessments" className="focus:outline-none" aria-label="Back to assessments">
              <span className="text-xl font-black tracking-tight leading-none text-primary-500">CPMI</span>
            </Link>
            <div className="h-5 w-px bg-gray-200" aria-hidden />
            <div className="min-w-0">
              <h1 className="truncate text-xs font-black text-gray-900 sm:text-sm">{assessment.title}</h1>
              <p className="text-[10px] font-semibold text-gray-500">
                Attempt {attempt.attemptNo} · started {formatDateTime(attempt.startedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-1.5 font-mono text-xs font-bold text-gray-700 shadow-2xs">
              <Clock size={14} aria-hidden />
              <span aria-label="Elapsed time">{timerLabel(elapsed)}</span>
            </div>
            <button className={SECONDARY_BTN} onClick={() => void saveAndExit()}>
              <span className="inline-flex items-center gap-1.5"><Save size={13} /> Save &amp; exit</span>
            </button>
          </div>
        </header>

        {/* QUIZ WORKSPACE */}
        <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-10">
          {/* Question Progress Header */}
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-500">
            <span className="text-sm text-primary-900">
              Question {questionIndex + 1} of {questions.length}
            </span>
            <span>{answeredCount}/{questions.length} answered</span>
          </div>
          <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-highlight-500 transition-all duration-300"
              style={{ width: `${questionProgress}%` }}
              role="progressbar"
              aria-label="Question progress"
              aria-valuenow={questionProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Question navigator chips */}
          <div className="thin-scroll mb-6 flex flex-wrap gap-1.5">
            {questions.map((question, index) => {
              const done = isAnswered(question, answers[question.questionPublicId]);
              const current = index === questionIndex;
              return (
                <button
                  key={question.questionPublicId}
                  type="button"
                  onClick={() => setQuestionIndex(index)}
                  aria-label={`Question ${index + 1}${done ? ", answered" : ", not answered"}`}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "tnum grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500",
                    current
                      ? "bg-[#152A13] text-white"
                      : done
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-highlight-500"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Question Text */}
          <div className="mb-8">
            <div
              className="text-lg font-black leading-snug text-gray-900 sm:text-xl [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-2 [&_ul]:ml-5 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: currentQuestion.promptHtml }}
            />
            <p className="mt-1 text-xs text-gray-400">{hintFor(currentQuestion)}</p>
          </div>

          {/* Options (Zed rows with custom radio / checkbox) */}
          {matching ? (
            <div className="mb-10 space-y-3">
              {(currentQuestion.pairs?.left ?? []).map((left, index) => {
                const chosen = currentAnswer?.matches?.[left.key] ?? "";
                const used = new Set(
                  Object.entries(currentAnswer?.matches ?? {})
                    .filter(([key]) => key !== left.key)
                    .map(([, value]) => value),
                );
                const rightOptions = (currentQuestion.pairs?.right ?? []).filter(
                  (right) => !used.has(right.key) || right.key === chosen,
                );
                return (
                  <div
                    key={left.key}
                    className="grid items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-3 sm:grid-cols-[minmax(0,1fr)_13rem]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#152A13] text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <p className="text-xs font-semibold leading-relaxed text-gray-800 sm:text-sm">{left.text}</p>
                    </div>
                    <div className="relative">
                      <select
                        aria-label={`Match for ${left.text}`}
                        value={chosen}
                        onChange={(event) => setMatch(currentQuestion, left.key, event.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-xs font-semibold text-gray-800 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="">Choose a match…</option>
                        {rightOptions.map((right) => (
                          <option key={right.key} value={right.key}>{right.text}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mb-10 space-y-3.5">
              {(currentQuestion.options ?? []).map((option) => {
                const isSelected = (currentAnswer?.selected ?? []).includes(option.optionKey);
                return (
                  <button
                    key={option.optionKey}
                    onClick={() => setOption(currentQuestion, option.optionKey)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500",
                      isSelected
                        ? "bg-emerald-50/70 shadow-xs ring-1 ring-highlight-500 border-highlight-500 text-primary-950"
                        : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center text-xs font-black transition-all",
                        multi ? "rounded-md" : "rounded-full",
                        isSelected
                          ? "bg-highlight-500 text-white shadow-xs"
                          : "border border-gray-300 bg-white text-transparent",
                      )}
                      aria-hidden
                    >
                      {isSelected ? <Check size={14} className="stroke-[3]" /> : null}
                    </div>
                    <span className="text-xs font-semibold leading-relaxed sm:text-sm">{option.optionText}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Question Navigation (Zed) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
            <button
              onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
              disabled={questionIndex === 0}
              className={cn(SECONDARY_BTN)}
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => save.mutate()}
                disabled={answeredCount === 0 || save.isPending}
                className={SECONDARY_BTN}
              >
                {save.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save progress
              </button>
              {questionIndex < questions.length - 1 ? (
                <button onClick={() => setQuestionIndex((index) => Math.min(questions.length - 1, index + 1))} className={PRIMARY_BTN}>
                  <span>Next</span>
                  <ChevronRight size={15} className="text-secondary-400" />
                </button>
              ) : (
                <button onClick={() => setConfirmSubmit(true)} disabled={!allAnswered} className={PRIMARY_BTN}>
                  <ClipboardCheck size={14} /> Submit attempt
                </button>
              )}
            </div>
          </div>
          {answeredCount === 0 ? (
            <p className="mt-4 text-center text-[11px] text-gray-400">
              Select an answer before submitting. Use Save progress if you need to come back.
            </p>
          ) : null}
        </div>

        <ConfirmSubmit
          open={confirmSubmit}
          onClose={() => setConfirmSubmit(false)}
          pending={submit.isPending}
          total={questions.length}
          onConfirm={() => submit.mutate()}
        />
      </div>
    );
  }

  if (attempt && (attempt.status === "graded" || attempt.status === "submitted" || attempt.status === "abandoned")) {
    const hasFeedback = attempt.questions.some((question) => question.results);
    const passed = attempt.passed === true;
    return (
      <div className="space-y-6">
        <AnimatePresence>
          {/* Zed result modal layout */}
          <motion.div
            key={attempt.attemptPublicId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl sm:p-10"
          >
            <div
              className={cn(
                "mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl border",
                attempt.status === "submitted"
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : passed
                    ? "border-highlight-200 bg-emerald-50 text-highlight-600"
                    : "border-red-200 bg-red-50 text-red-600",
              )}
            >
              {attempt.status === "submitted" ? (
                <Clock size={36} aria-hidden />
              ) : passed ? (
                <Award size={36} aria-hidden />
              ) : (
                <AlertTriangle size={36} aria-hidden />
              )}
            </div>

            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                attempt.status === "submitted"
                  ? "bg-blue-100 text-blue-800"
                  : passed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800",
              )}
            >
              {attempt.status === "submitted" ? "Grading" : passed ? "Assessment Passed" : attempt.status === "abandoned" ? "Attempt Abandoned" : "Retake Required"}
            </span>

            <h2 className="mt-3 text-2xl font-black text-gray-900 sm:text-3xl">
              {attempt.status === "submitted"
                ? "Grading your attempt"
                : passed
                  ? "Congratulations!"
                  : "Passing Threshold Not Met"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs text-gray-600 sm:text-sm">
              {attempt.status === "submitted"
                ? "Refresh this page in a moment for the graded result."
                : passed
                  ? "Your result is recorded. Any certificate you earned is in your certificate wallet."
                  : "Review the feedback below and use a remaining attempt when you are ready."}
            </p>

            {attempt.status === "graded" ? (
              <div className="mx-auto my-6 max-w-xs rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase text-gray-400">Your Score</p>
                <p className="tnum mt-1 text-4xl font-black text-primary-900">
                  {attempt.scorePercent === null ? "—" : `${Math.round(attempt.scorePercent)}%`}
                </p>
                {attempt.possiblePoints !== null ? (
                  <p className="mt-0.5 text-[11px] text-gray-500">of {attempt.possiblePoints} points</p>
                ) : null}
                <p className="mt-1 text-[11px] text-gray-500">
                  Attempt {attempt.attemptNo} · graded {formatDateTime(attempt.gradedAt)}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-4">
              <button className={SECONDARY_BTN} onClick={resetToOverview}>
                <ArrowLeft size={14} /> Assessment overview
              </button>
              {passed ? (
                <Link href="/learner/certificates" className={PRIMARY_BTN}>
                  <Award size={14} className="text-secondary-400" /> <span>View Official Certificate</span>
                </Link>
              ) : null}
              <Link href="/learner/courses" className={SECONDARY_BTN}>Return to My Courses</Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {hasFeedback ? (
          <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Question Review</h3>
            <p className="mt-1 text-xs text-gray-500">Server-graded feedback for this attempt.</p>
            <div className="mt-4 space-y-3 text-left">
              {attempt.questions.map((question, index) => {
                const result = question.results;
                return (
                  <div key={question.questionPublicId} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Question {index + 1} · {questionTypeLabel(question.questionType)}
                      </p>
                      <div className="flex items-center gap-2">
                        {result?.pointsAwarded !== null && result?.pointsAwarded !== undefined ? (
                          <span className="tnum text-xs font-semibold text-gray-600">
                            {result.pointsAwarded} / {question.pointsPossible} pts
                          </span>
                        ) : null}
                        {result?.isCorrect === true ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle size={10} /> Correct
                          </span>
                        ) : result?.isCorrect === false ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                            <XCircle size={10} /> Incorrect
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">Feedback unavailable</span>
                        )}
                      </div>
                    </div>
                    <div
                      className="mt-3 text-sm font-semibold leading-relaxed text-gray-900 [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-2"
                      dangerouslySetInnerHTML={{ __html: question.promptHtml }}
                    />
                    {result?.explanationHtml ? (
                      <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Explanation</p>
                        <div
                          className="text-sm leading-relaxed text-gray-700 [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-2"
                          dangerouslySetInnerHTML={{ __html: result.explanationHtml }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : attempt.status === "graded" ? (
          <div className="rounded-3xl border border-gray-200/90 bg-white p-6 text-center shadow-sm">
            <ShieldCheck className="mx-auto size-6 text-highlight-600" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-gray-800">Detailed feedback is not shown for this attempt</p>
            <p className="mt-1 text-xs text-gray-500">Agency assessment settings decide when per-question feedback is visible.</p>
          </div>
        ) : null}

        <AttemptHistory attempts={attemptsQuery.data ?? []} currentId={attempt.attemptPublicId} onSelect={(id) => { setAttemptId(id); setAnswers({}); setQuestionIndex(0); }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Overview card (Zed style) */}
      <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-400">
                {assessment.kind === "final" ? "Final exam" : "Module assessment"}
              </span>
              {assessment.hasPassed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  <CheckCircle size={10} /> Passed
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">Not passed</span>
              )}
              {assessment.inProgressAttemptId ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  <Clock size={10} /> In progress
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-xl font-black leading-snug text-gray-900 sm:text-2xl">{assessment.title}</h2>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Available from {formatDate(assessment.availableFrom)}. Attempts and scoring are tracked by the server.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Best score</p>
              <p className="tnum mt-0.5 text-xl font-black text-primary-900">
                {assessment.bestScorePercent === null ? "—" : `${Math.round(assessment.bestScorePercent)}%`}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Attempts</p>
              <p className="tnum mt-0.5 text-xl font-black text-primary-900">
                {assessment.attemptsUsed}
                {assessment.maxAttempts === null ? "" : ` / ${assessment.maxAttempts}`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
          {assessment.inProgressAttemptId ? (
            <button className={PRIMARY_BTN} onClick={() => setAttemptId(assessment.inProgressAttemptId)}>
              <Clock size={14} className="text-secondary-400" /> Resume attempt
            </button>
          ) : assessment.hasPassed ? (
            <Link href="/learner/certificates" className={PRIMARY_BTN}>
              <Award size={14} className="text-secondary-400" /> View certificate
            </Link>
          ) : maxReached ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
              <p>No attempts remain. Contact your agency administrator if you need another attempt.</p>
            </div>
          ) : (
            <button className={PRIMARY_BTN} onClick={() => start.mutate()} disabled={start.isPending}>
              {start.isPending ? <Loader2 size={14} className="animate-spin text-secondary-400" /> : assessment.attemptsUsed > 0 ? <RotateCcw size={14} className="text-secondary-400" /> : <ClipboardCheck size={14} className="text-secondary-400" />}
              <span>{assessment.attemptsUsed > 0 ? "Start another attempt" : "Start assessment"}</span>
            </button>
          )}
          {assessment.maxAttempts !== null && !maxReached ? (
            <span className="text-xs font-semibold text-gray-500">
              {assessment.maxAttempts - assessment.attemptsUsed} attempt
              {assessment.maxAttempts - assessment.attemptsUsed === 1 ? "" : "s"} remaining
            </span>
          ) : null}
        </div>
      </div>

      {/* Before-you-start facts */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Server-graded", body: "Answers are scored by the API, never in your browser." },
          { icon: Save, title: "Save as you go", body: "Use Save progress before leaving; an open attempt can be resumed." },
          { icon: Award, title: "Certificates", body: "Passing a required assessment can unlock a certificate automatically." },
        ].map((fact) => (
          <div key={fact.title} className="rounded-3xl border border-gray-200/90 bg-white p-5 shadow-xs">
            <fact.icon className="size-5 text-highlight-600" aria-hidden />
            <p className="mt-3 text-sm font-black text-gray-900">{fact.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{fact.body}</p>
          </div>
        ))}
      </div>

      <AttemptHistory attempts={attemptsQuery.data ?? []} currentId={attemptId} onSelect={(id) => { setAttemptId(id); setAnswers({}); setQuestionIndex(0); }} />
    </div>
  );
}

function ConfirmSubmit({
  open,
  onClose,
  onConfirm,
  pending,
  total,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
  total: number;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit this attempt?"
      description="Submitting grades the attempt immediately. You cannot change your answers afterwards."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>Keep working</Button>
          <Button onClick={onConfirm} loading={pending} icon={<ClipboardCheck className="size-4" aria-hidden />}>Submit attempt</Button>
        </>
      }
    >
      <p className="py-2 text-sm text-ink-700">All {total} questions will be graded on the server.</p>
    </Modal>
  );
}

function RunnerNoticeShell({
  title,
  icon: Icon,
  heading,
  body,
  action,
}: {
  title: string;
  icon: typeof ShieldCheck;
  heading: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 shadow-xs">
        <span className="text-xl font-black tracking-tight leading-none text-primary-500">CPMI</span>
        <div className="h-5 w-px bg-gray-200" aria-hidden />
        <h1 className="truncate text-xs font-black text-gray-900 sm:text-sm">{title}</h1>
      </header>
      <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-amber-200 bg-amber-50 text-amber-600">
          <Icon size={30} aria-hidden />
        </div>
        <h2 className="mt-4 text-xl font-black text-gray-900 sm:text-2xl">{heading}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>
      </div>
    </div>
  );
}

function AttemptHistory({
  attempts,
  currentId,
  onSelect,
}: {
  attempts: AttemptView[];
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  const sorted = [...attempts].sort((a, b) => b.attemptNo - a.attemptNo);
  return (
    <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black leading-tight text-gray-900">Attempt History</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {sorted.length === 0 ? "No attempts have been recorded yet." : `${sorted.length} attempt${sorted.length === 1 ? "" : "s"} recorded for this assessment.`}
          </p>
        </div>
        <History className="size-5 text-highlight-600" aria-hidden />
      </div>

      {sorted.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-gray-50 p-6 text-center text-xs font-semibold text-gray-500">
          Your attempts appear here after you start the assessment.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-gray-200">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <caption className="sr-only">Assessment attempt history</caption>
            <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <tr>
                <th scope="col" className="px-4 py-3">Attempt</th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">Started</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-left">Score</th>
                <th scope="col" className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sorted.map((item) => {
                const isCurrent = item.attemptPublicId === currentId;
                return (
                  <tr key={item.attemptPublicId} className={isCurrent ? "bg-emerald-50/60" : undefined}>
                    <td className="px-4 py-3">
                      <p className="font-black text-gray-900">Attempt {item.attemptNo}</p>
                      {item.passed === true ? (
                        <span className="text-[10px] font-bold text-emerald-700">Passed</span>
                      ) : item.passed === false ? (
                        <span className="text-[10px] font-bold text-red-700">Not passed</span>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{formatDateTime(item.startedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold", statusPillClass(item.status))}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td className="tnum px-4 py-3 text-left font-black text-gray-900">
                      {item.scorePercent === null ? "—" : `${Math.round(item.scorePercent)}%`}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button
                        onClick={() => onSelect(item.attemptPublicId)}
                        disabled={isCurrent}
                        className={cn(
                          "rounded-xl px-4 py-2 text-[11px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                          isCurrent ? "text-gray-500" : "border border-gray-200 text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        {isCurrent ? "Viewing" : item.status === "in_progress" ? "Resume" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
