"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Award,
  AlertTriangle,
  RotateCcw,
  Check,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { EmptyState, ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";
import {
  getAttempt,
  learnerKeys,
  listAssessments,
  listAttempts,
  saveAnswers,
  startAttempt,
  submitAttempt,
  type AnswerMap,
  type AnswerValue,
  type AssessmentOverview,
  type AttemptQuestion,
  type AttemptView,
  type SubmitResult,
} from "@/features/learner/api";
import { formatDate } from "@/features/learner/format";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function isAnswered(q: AttemptQuestion, a: AnswerValue | undefined): boolean {
  if (!a) return false;
  if (q.questionType === "matching") {
    const left = q.pairs?.left ?? [];
    return left.length > 0 && left.every((l) => !!a.matches?.[l.key]);
  }
  return (a.selected?.length ?? 0) > 0;
}

function attemptsLeft(o: AssessmentOverview): number | null {
  return o.maxAttempts === null ? null : Math.max(0, o.maxAttempts - o.attemptsUsed);
}

export default function AssessmentRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const enrollmentId = String(params.id ?? "");
  const assessmentId = searchParams.get("assessment");

  const overviewQ = useQuery({
    queryKey: learnerKeys.assessments(enrollmentId),
    queryFn: () => listAssessments(enrollmentId),
    enabled: !!enrollmentId,
  });
  const overview = overviewQ.data?.find((a) => a.assessmentPublicId === assessmentId);

  const attemptsQ = useQuery({
    queryKey: learnerKeys.attempts(enrollmentId, assessmentId ?? ""),
    queryFn: () => listAttempts(enrollmentId, assessmentId!),
    enabled: !!assessmentId && !!overview,
  });

  // The attempt being taken right now (resumed or freshly started).
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | AttemptView | null>(null);
  useEffect(() => {
    setActiveAttemptId(null);
    setResult(null);
  }, [assessmentId]);
  useEffect(() => {
    if (overview?.inProgressAttemptId && !result) setActiveAttemptId(overview.inProgressAttemptId);
  }, [overview?.inProgressAttemptId, result]);

  const attemptQ = useQuery({
    queryKey: learnerKeys.attempt(activeAttemptId ?? ""),
    queryFn: () => getAttempt(activeAttemptId!),
    enabled: !!activeAttemptId,
  });
  const attempt = attemptQ.data?.status === "in_progress" ? attemptQ.data : undefined;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: learnerKeys.assessments(enrollmentId) });
    void queryClient.invalidateQueries({ queryKey: learnerKeys.attempts(enrollmentId, assessmentId ?? "") });
    void queryClient.invalidateQueries({ queryKey: learnerKeys.allAssessments });
    void queryClient.invalidateQueries({ queryKey: learnerKeys.enrollments });
    void queryClient.invalidateQueries({ queryKey: learnerKeys.certificates });
  };

  const startMutation = useMutation({
    mutationFn: () => startAttempt(enrollmentId, assessmentId!),
    onSuccess: (view) => {
      queryClient.setQueryData(learnerKeys.attempt(view.attemptPublicId), view);
      setResult(null);
      setActiveAttemptId(view.attemptPublicId);
      invalidate();
    },
  });

  // ---- runner state -------------------------------------------------------------------
  const questions = useMemo(
    () => [...(attempt?.questions ?? [])].sort((a, b) => a.displayPosition - b.displayPosition),
    [attempt?.questions],
  );
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  useEffect(() => {
    setCurrentQIndex(0);
    setAnswers({});
  }, [attempt?.attemptPublicId]);

  const saveMutation = useMutation({
    mutationFn: (payload: AnswerMap) => saveAnswers(attempt!.attemptPublicId, payload),
  });
  const submitMutation = useMutation({
    mutationFn: () => submitAttempt(attempt!.attemptPublicId, answers),
    onSuccess: (res) => {
      setResult(res);
      setActiveAttemptId(null);
      queryClient.removeQueries({ queryKey: learnerKeys.attempt(res.attemptPublicId) });
      invalidate();
    },
  });

  const currentQuestion = questions[currentQIndex];
  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.questionPublicId])).length;
  const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isLastQuestion = currentQIndex === totalQuestions - 1;

  const setAnswer = (q: AttemptQuestion, value: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [q.questionPublicId]: value }));

  const handleSelectOption = (q: AttemptQuestion, key: string) => {
    if (q.questionType === "multiple_choice") {
      const current = new Set(answers[q.questionPublicId]?.selected ?? []);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      setAnswer(q, { selected: Array.from(current) });
    } else {
      setAnswer(q, { selected: [key] });
    }
  };

  const autosave = () => {
    if (!currentQuestion) return;
    const a = answers[currentQuestion.questionPublicId];
    if (a) saveMutation.mutate({ [currentQuestion.questionPublicId]: a });
  };

  const handleNext = () => {
    autosave();
    if (!isLastQuestion) setCurrentQIndex((i) => i + 1);
    else submitMutation.mutate();
  };

  const handlePrev = () => {
    autosave();
    if (currentQIndex > 0) setCurrentQIndex((i) => i - 1);
  };

  // Latest graded attempt (for the results view when no attempt is active).
  const gradedAttempts = (attemptsQ.data ?? []).filter((a) => a.status === "graded" || a.status === "submitted");
  const latest = result ?? gradedAttempts[gradedAttempts.length - 1] ?? null;
  const passedThreshold = result && "passedThreshold" in result ? result.passedThreshold : null;

  const title = overview?.title ?? "Assessment";

  // ---- render -------------------------------------------------------------------------
  let body: React.ReactNode;

  if (overviewQ.isLoading) {
    body = <LoadingState label="Loading assessment…" />;
  } else if (overviewQ.isError) {
    body = <ErrorState error={overviewQ.error} onRetry={() => overviewQ.refetch()} />;
  } else if (!assessmentId) {
    // Picker: all assessments for this enrollment.
    const items = overviewQ.data ?? [];
    body = (
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-10 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Course Assessments</h2>
        {items.length === 0 ? (
          <EmptyState title="No assessments" description="This course has no assessments assigned yet." />
        ) : (
          items.map((a) => (
            <Link
              key={a.assessmentPublicId}
              href={`/learner/assessments/${enrollmentId}?assessment=${a.assessmentPublicId}`}
              className="p-4 rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    a.hasPassed ? "bg-emerald-50 text-highlight-600" : "bg-secondary-50 text-secondary-800"
                  }`}
                >
                  {a.hasPassed ? <CheckCircle size={18} /> : <ClipboardList size={18} />}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{a.title}</p>
                  <p className="text-[11px] text-gray-500">
                    {a.kind === "final" ? "Final Exam" : "Module Assessment"}
                    {a.bestScorePercent !== null ? ` • Best ${a.bestScorePercent}%` : ""}
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-secondary-600" />
            </Link>
          ))
        )}
      </div>
    );
  } else if (!overview) {
    body = <EmptyState title="Assessment not found" description="This assessment is not part of your course." />;
  } else if (activeAttemptId && attemptQ.isLoading) {
    body = <LoadingState label="Loading your attempt…" />;
  } else if (activeAttemptId && attemptQ.isError) {
    body = <ErrorState error={attemptQ.error} onRetry={() => attemptQ.refetch()} />;
  } else if (attempt && currentQuestion) {
    const answer = answers[currentQuestion.questionPublicId];
    const type = currentQuestion.questionType;
    body = (
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-10">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
          <span className="text-primary-900 text-sm">
            Question {currentQIndex + 1} of {totalQuestions}
          </span>
          <span>
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>

        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-8">
          <div
            className="bg-highlight-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mb-8">
          <div
            className="text-lg sm:text-xl font-black text-gray-900 leading-snug [&_p]:mb-2"
            // promptHtml is sanitized by the backend.
            dangerouslySetInnerHTML={{ __html: currentQuestion.promptHtml }}
          />
          <p className="text-xs text-gray-400 mt-1">
            {type === "matching"
              ? "Match each item on the left with the correct item on the right."
              : type === "multiple_choice"
              ? "Select all answers that apply."
              : type === "true_false"
              ? "Select True or False."
              : "Select the single best answer."}
          </p>
        </div>

        {type === "matching" ? (
          <div className="space-y-3.5 mb-10">
            {(currentQuestion.pairs?.left ?? []).map((left) => (
              <div
                key={left.key}
                className="p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
              >
                <span className="text-xs sm:text-sm font-semibold text-gray-800">{left.text}</span>
                <select
                  aria-label={`Match for ${left.text}`}
                  value={answer?.matches?.[left.key] ?? ""}
                  onChange={(e) =>
                    setAnswer(currentQuestion, {
                      matches: { ...(answer?.matches ?? {}), [left.key]: e.target.value },
                    })
                  }
                  className="sm:w-64 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="" disabled>
                    Select a match…
                  </option>
                  {(currentQuestion.pairs?.right ?? []).map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.text}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3.5 mb-10" role={type === "multiple_choice" ? "group" : "radiogroup"}>
            {(currentQuestion.options ?? []).map((option, idx) => {
              const isSelected = answer?.selected?.includes(option.optionKey) ?? false;
              return (
                <button
                  key={option.optionKey}
                  role={type === "multiple_choice" ? "checkbox" : "radio"}
                  aria-checked={isSelected}
                  onClick={() => handleSelectOption(currentQuestion, option.optionKey)}
                  className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center gap-4 focus:outline-none ${
                    isSelected
                      ? "bg-emerald-50/70 border-highlight-500 text-primary-950 shadow-xs ring-1 ring-highlight-500"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 text-gray-800"
                  }`}
                >
                  <div
                    className={`w-6 h-6 ${type === "multiple_choice" ? "rounded-md" : "rounded-full"} flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                      isSelected ? "bg-highlight-500 text-white shadow-xs" : "border border-gray-300 text-gray-500 bg-white"
                    }`}
                  >
                    {isSelected ? <Check size={14} className="stroke-[3]" /> : LETTERS[idx]}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold leading-relaxed">{option.optionText}</span>
                </button>
              );
            })}
          </div>
        )}

        {(submitMutation.isError || saveMutation.isError) && (
          <p className="mb-4 text-xs font-semibold text-red-600" role="alert">
            {errorMessage(submitMutation.error ?? saveMutation.error)}
          </p>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            onClick={handlePrev}
            disabled={currentQIndex === 0}
            className="px-5 py-2.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <ChevronLeft size={15} /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={submitMutation.isPending || (isLastQuestion && answeredCount < totalQuestions)}
            title={isLastQuestion && answeredCount < totalQuestions ? "Answer every question before submitting" : undefined}
            className="px-7 py-2.5 bg-[#152A13] hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <span>{isLastQuestion ? (submitMutation.isPending ? "Submitting…" : "Submit Assessment") : "Next"}</span>
            <ChevronRight size={15} className="text-secondary-400" />
          </button>
        </div>
      </div>
    );
  } else {
    // Intro / results view.
    const left = attemptsLeft(overview);
    const canStart = !overview.hasPassed && (left === null || left > 0);
    const isPassed = latest?.passed === true;
    const pending = latest?.status === "submitted";

    body = (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-10 text-center"
      >
        {latest ? (
          <>
            <div
              className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-5 ${
                isPassed
                  ? "bg-emerald-50 text-highlight-600 border border-highlight-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {isPassed ? <Award size={36} /> : <AlertTriangle size={36} />}
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                isPassed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {pending ? "Awaiting Grading" : isPassed ? "Assessment Passed" : canStart ? "Retake Required" : "Not Passed"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3">
              {pending ? "Submission received" : isPassed ? "Congratulations!" : "Passing Threshold Not Met"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto">
              {isPassed
                ? `You have passed ${title}.`
                : canStart
                ? "Review the course lessons and try again."
                : "You have used all allowed attempts for this assessment. Contact your agency administrator for help."}
            </p>

            <div className="my-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 max-w-xs mx-auto">
              <p className="text-xs text-gray-400 font-bold uppercase">Attempt {latest.attemptNo} Score</p>
              <p className="text-4xl font-black text-primary-900 mt-1">
                {latest.scorePercent !== null ? `${latest.scorePercent}%` : "—"}
              </p>
              {passedThreshold !== null && (
                <p className="text-[11px] text-gray-500 mt-0.5">Passing Score: {passedThreshold}%</p>
              )}
              {overview.bestScorePercent !== null && (
                <p className="text-[11px] text-gray-500 mt-0.5">Best Score: {overview.bestScorePercent}%</p>
              )}
            </div>

            {/* Per-question feedback (only present when the feedback mode allows it). */}
            {latest.questions.some((q) => q.results) && (
              <div className="text-left space-y-3 mb-6">
                <h3 className="text-sm font-black text-gray-900">Feedback</h3>
                {[...latest.questions]
                  .sort((a, b) => a.displayPosition - b.displayPosition)
                  .map((q, idx) => (
                    <div key={q.questionPublicId} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60">
                      <div className="flex items-start gap-3">
                        {q.results?.isCorrect ? (
                          <CheckCircle size={18} className="text-highlight-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-gray-500">Question {idx + 1}</span>
                            {q.results?.pointsAwarded != null && (
                              <span className="text-[11px] font-bold text-gray-500">
                                {q.results.pointsAwarded} / {q.pointsPossible} pts
                              </span>
                            )}
                          </div>
                          <div
                            className="text-xs font-semibold text-gray-900 mt-1"
                            dangerouslySetInnerHTML={{ __html: q.promptHtml }}
                          />
                          {q.results?.explanationHtml && (
                            <div
                              className="text-xs text-gray-600 mt-2"
                              dangerouslySetInnerHTML={{ __html: q.results.explanationHtml }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-5 bg-secondary-50 text-secondary-800 border border-secondary-200">
              <ClipboardList size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{title}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto">
              {overview.kind === "final" ? "Final exam" : "Module assessment"}
              {overview.maxAttempts !== null
                ? ` • ${overview.maxAttempts} attempt${overview.maxAttempts === 1 ? "" : "s"} allowed`
                : " • Unlimited attempts"}
              {new Date(overview.availableFrom).getTime() > Date.now()
                ? ` • Opens ${formatDate(overview.availableFrom)}`
                : ""}
            </p>
          </>
        )}

        {left !== null && !overview.hasPassed && (
          <p className="text-[11px] font-bold text-gray-500 mb-3">
            {left} of {overview.maxAttempts} attempt{overview.maxAttempts === 1 ? "" : "s"} remaining
          </p>
        )}

        {startMutation.isError && (
          <p className="mb-3 text-xs font-semibold text-red-600" role="alert">
            {errorMessage(startMutation.error)}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-gray-100">
          {overview.hasPassed ? (
            <>
              <Link
                href="/learner/certificates"
                className="bg-[#152A13] hover:bg-primary-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2"
              >
                <Award size={15} className="text-secondary-400" />
                <span>View Certificates</span>
              </Link>
              <Link
                href="/learner/courses"
                className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-5 py-3 rounded-xl text-xs transition-colors"
              >
                Return to My Courses
              </Link>
            </>
          ) : (
            <>
              {canStart && !pending && (
                <button
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  className="bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={14} />
                  {startMutation.isPending ? "Starting…" : latest ? "Retake Assessment" : "Start Assessment"}
                </button>
              )}
              <Link
                href={`/learner/courses/${enrollmentId}`}
                className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-5 py-3 rounded-xl text-xs transition-colors"
              >
                Review Course Lessons
              </Link>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between text-gray-900 selection:bg-secondary-500 selection:text-primary-950">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/learner/assessments" className="focus:outline-none">
            <Logo size="sm" showSubtitle={false} />
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <h1 className="text-xs sm:text-sm font-black text-gray-900">{assessmentId ? title : "Assessments"}</h1>
        </div>
        {attempt ? (
          <span className="text-xs font-bold text-gray-500">Attempt {attempt.attemptNo}</span>
        ) : (
          <button
            onClick={() => router.push("/learner/assessments")}
            className="text-xs font-bold text-gray-500 hover:text-primary-700 flex items-center gap-1"
          >
            <ChevronLeft size={14} /> All Assessments
          </button>
        )}
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-center">{body}</main>

      <footer className="py-4 text-center text-[10px] text-gray-400 border-t border-gray-200 bg-white">
        CPMI Assessment Engine • Graded server-side • Immutable Audit Trail Active
      </footer>
    </div>
  );
}
