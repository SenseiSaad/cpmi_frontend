"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock, CheckCircle, ArrowRight } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { LearnerSidebar } from "@/components/layout/SidebarNav";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/QueryState";
import { learnerKeys, listAllAssessments, listEnrollments, type EnrollmentAssessment } from "@/features/learner/api";
import { formatDate } from "@/features/learner/format";

function statusLabel(a: EnrollmentAssessment): string {
  if (a.hasPassed) return `Passed • Best ${a.bestScorePercent ?? 0}%`;
  if (a.inProgressAttemptId) return "Attempt in progress";
  if (a.maxAttempts !== null && a.attemptsUsed >= a.maxAttempts) return "No attempts remaining";
  if (a.bestScorePercent !== null) return `Best ${a.bestScorePercent}% • Retake available`;
  if (new Date(a.availableFrom).getTime() > Date.now()) return `Opens ${formatDate(a.availableFrom)}`;
  return `Due ${formatDate(a.enrollment.due_at)}`;
}

export default function AssessmentsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const enrollmentsQ = useQuery({ queryKey: learnerKeys.enrollments, queryFn: listEnrollments });
  const enrollments = enrollmentsQ.data ?? [];
  const assessmentsQ = useQuery({
    queryKey: [...learnerKeys.allAssessments, "with-completed", enrollments.map((e) => e.uuid).join(",")],
    queryFn: () => listAllAssessments(enrollments),
    enabled: enrollmentsQ.isSuccess,
  });
  const all = assessmentsQ.data ?? [];
  const query = enrollmentsQ.isError ? enrollmentsQ : assessmentsQ;
  const loading = enrollmentsQ.isLoading || (enrollmentsQ.isSuccess && assessmentsQ.isLoading);

  const filtered = all.filter((a) => {
    if (filter === "completed") return a.hasPassed;
    if (filter === "pending") return !a.hasPassed;
    return true;
  });

  return (
    <DashboardShell
      sidebar={<LearnerSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">Assessments & Exams</h1>
          <p className="text-xs text-gray-500">Rigorous randomized testing for accredited DBE compliance certification</p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-primary-700" />
            <span className="text-xs font-bold text-gray-700">Official Evaluation Engine</span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "all" ? "bg-white text-primary-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Tests
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "pending" ? "bg-white text-primary-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "completed" ? "bg-white text-primary-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Passed
            </button>
          </div>
        </div>

        {loading && <LoadingState label="Loading assessments…" />}
        {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
        {!loading && !query.isError && filtered.length === 0 && (
          <EmptyState
            title={all.length ? "Nothing here" : "No assessments yet"}
            description={
              all.length
                ? "No assessments match this filter."
                : "Assessments for your enrolled courses will appear here."
            }
          />
        )}

        {/* Assessment Cards */}
        <div className="space-y-4">
          {filtered.map((item) => {
            const isCompleted = item.hasPassed;
            const exhausted =
              !item.hasPassed && !item.inProgressAttemptId && item.maxAttempts !== null && item.attemptsUsed >= item.maxAttempts;
            return (
              <motion.div
                key={`${item.enrollment.uuid}:${item.assessmentPublicId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? "bg-emerald-50 text-highlight-600"
                        : "bg-secondary-50 text-secondary-800"
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={22} /> : <Clock size={22} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? "bg-emerald-50 text-highlight-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {statusLabel(item)}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {item.kind === "final" ? "Final Exam" : "Module Assessment"} • Attempts {item.attemptsUsed}
                        {item.maxAttempts !== null ? ` of ${item.maxAttempts}` : ""}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-xl">{item.enrollment.course.title}</p>
                  </div>
                </div>

                <div className="sm:self-center w-full sm:w-auto">
                  <Link
                    href={`/learner/assessments/${item.enrollment.uuid}?assessment=${item.assessmentPublicId}`}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold px-6 py-2.5 rounded-xl text-xs transition-all ${
                      isCompleted
                        ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "bg-[#152A13] hover:bg-primary-800 text-white shadow-xs"
                    }`}
                  >
                    <span>
                      {isCompleted || exhausted
                        ? "View Results"
                        : item.inProgressAttemptId
                        ? "Resume Attempt"
                        : item.attemptsUsed > 0
                        ? "Retake Assessment"
                        : "Take Assessment"}
                    </span>
                    <ArrowRight size={13} className="text-secondary-400" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
