"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  Award,
  Play,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import DashboardShell from "@/components/layout/DashboardShell";
import { LearnerSidebar } from "@/components/layout/SidebarNav";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/QueryState";
import { useSession } from "@/features/auth/session-context";
import {
  learnerKeys,
  listAllAssessments,
  listCertificates,
  listEnrollments,
} from "@/features/learner/api";
import { formatDate, greeting } from "@/features/learner/format";

export default function LearnerDashboard() {
  const { user } = useSession();
  const enrollmentsQ = useQuery({ queryKey: learnerKeys.enrollments, queryFn: listEnrollments });
  const certificatesQ = useQuery({ queryKey: learnerKeys.certificates, queryFn: listCertificates });
  const enrollments = enrollmentsQ.data ?? [];
  const assessmentsQ = useQuery({
    queryKey: [...learnerKeys.allAssessments, enrollments.map((e) => e.uuid).join(",")],
    queryFn: () => listAllAssessments(enrollments.filter((e) => e.status !== "completed")),
    enabled: enrollmentsQ.isSuccess,
  });
  const certificates = (certificatesQ.data ?? []).filter((c) => c.status === "valid");
  const completedCount = enrollments.filter((e) => e.status === "completed").length;
  const inProgressCount = enrollments.filter((e) => e.status === "in_progress").length;
  const featured =
    enrollments.find((e) => e.status === "in_progress") ?? enrollments.find((e) => e.status === "assigned");
  const others = enrollments.filter((e) => e.uuid !== featured?.uuid);
  const upcoming = (assessmentsQ.data ?? []).filter((a) => !a.hasPassed).slice(0, 4);
  const overall = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percent, 0) / enrollments.length)
    : 0;
  const latestCert = certificates[0];

  const headerGreeting = (
    <div>
      <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
        {greeting()}{user ? `, ${user.first_name} ${user.last_name}` : ""}!
      </h1>
      <p className="text-xs text-gray-500 font-medium">
        Continue your learning journey. You&apos;re making great progress.
      </p>
    </div>
  );

  return (
    <DashboardShell sidebar={<LearnerSidebar />} headerContent={headerGreeting}>
      {enrollmentsQ.isLoading ? (
        <LoadingState label="Loading your dashboard…" />
      ) : enrollmentsQ.isError ? (
        <ErrorState error={enrollmentsQ.error} onRetry={() => enrollmentsQ.refetch()} />
      ) : (
      <div className="space-y-8">
        {/* TOP 4 KPI CARDS (Screen 3 Direct Reference) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              label: "Enrolled Courses",
              value: enrollments.length,
              icon: BookOpen,
              color: "text-primary-600",
              bg: "bg-primary-50",
            },
            {
              label: "Completed",
              value: completedCount,
              icon: CheckCircle,
              color: "text-highlight-600",
              bg: "bg-emerald-50",
            },
            {
              label: "In Progress",
              value: inProgressCount,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Certificates Earned",
              value: certificates.length,
              icon: Award,
              color: "text-secondary-600",
              bg: "bg-secondary-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500">{label}</span>
                <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900">{value}</p>
            </motion.div>
          ))}
        </div>

        {/* TWO-COLUMN LAYOUT: Continue Learning (Left) & Upcoming Assessments (Right) */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Continue Learning (Screen 3 Reference) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-gray-900 tracking-tight">Continue Learning</h2>
              <Link
                href="/learner/courses"
                className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {/* Featured Active Course Card */}
            {featured ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Course Thumbnail */}
                <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden bg-primary-900 flex-shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 to-transparent" />
                  <BookOpen size={32} className="relative text-secondary-400" />
                  <span className="absolute bottom-2 left-2 bg-secondary-500 text-primary-950 text-[10px] font-black px-2 py-0.5 rounded">
                    {featured.agency.name}
                  </span>
                </div>

                {/* Course Details */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-secondary-600 uppercase tracking-wide">
                      {featured.status === "in_progress" ? "In Progress" : "Not Started"} • Due {formatDate(featured.due_at)}
                    </span>
                    <span className="text-xs font-black text-primary-700">{featured.progress_percent}% Complete</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-gray-900 mt-1">
                    {featured.course.title}
                  </h3>
                  {featured.course.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{featured.course.description}</p>
                  )}

                  <div className="mt-3">
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-highlight-500 h-full rounded-full transition-all"
                        style={{ width: `${featured.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="sm:self-center w-full sm:w-auto">
                  <Link
                    href={`/learner/courses/${featured.uuid}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <Play size={13} className="text-secondary-400" />
                    <span>{featured.status === "in_progress" ? "Continue" : "Start"}</span>
                  </Link>
                </div>
              </div>
            </motion.div>
            ) : (
              <EmptyState
                title={enrollments.length ? "All caught up" : "No courses yet"}
                description={
                  enrollments.length
                    ? "You have completed every assigned course."
                    : "Courses assigned by your agency will appear here."
                }
              />
            )}

            {/* Other Enrolled Courses Mini-List */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {others.map((course) => {
                  const done = course.status === "completed";
                  return (
                  <div
                    key={course.uuid}
                    className="bg-white rounded-xl border border-gray-200/80 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          done ? "bg-emerald-50 text-highlight-600" : "bg-secondary-50 text-secondary-800"
                        }`}
                      >
                        {done ? <CheckCircle size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{course.course.title}</p>
                        <p className="text-[10px] text-gray-500">
                          {done ? "Completed" : `${course.progress_percent}% complete • Due ${formatDate(course.due_at)}`}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/learner/courses/${course.uuid}`}
                      className="text-xs font-bold text-gray-400 hover:text-primary-600"
                    >
                      {done ? "Review" : "Open"}
                    </Link>
                  </div>
                  );
                })}
            </div>
          </div>

          {/* RIGHT: Upcoming Assessments & Certificates Card (Screen 3 Reference) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-gray-900 tracking-tight">Upcoming Assessments</h2>
                <Link
                  href="/learner/assessments"
                  className="text-xs font-bold text-primary-600 hover:text-primary-800"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {assessmentsQ.isLoading && <LoadingState label="Loading assessments…" />}
                {assessmentsQ.isError && (
                  <ErrorState error={assessmentsQ.error} onRetry={() => assessmentsQ.refetch()} />
                )}
                {assessmentsQ.isSuccess && upcoming.length === 0 && (
                  <p className="text-xs text-gray-500">No pending assessments.</p>
                )}
                {upcoming.map((a) => (
                  <div
                    key={`${a.enrollment.uuid}:${a.assessmentPublicId}`}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-primary-200 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ClipboardList size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">{a.title}</p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {a.enrollment.course.title} • Due {formatDate(a.enrollment.due_at)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/learner/assessments/${a.enrollment.uuid}?assessment=${a.assessmentPublicId}`}
                      className="px-2.5 py-1 bg-white border border-gray-200 hover:border-primary-500 text-primary-700 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap"
                    >
                      {a.inProgressAttemptId ? "Resume" : "Start"}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificates Banner Card */}
            <div className="bg-gradient-to-br from-[#152A13] to-primary-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-secondary-500/20 text-secondary-400 flex items-center justify-center mb-4">
                <Award size={20} />
              </div>
              <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider">Official Credential</p>
              <h3 className="text-lg font-black mt-1">Certificates Earned: {certificates.length}</h3>
              <p className="text-xs text-white/75 mt-2 leading-relaxed">
                {latestCert
                  ? `${latestCert.courseTitle ?? latestCert.moduleTitle ?? "Certificate"}. Certificate ID: ${latestCert.certificateNumber}.`
                  : "Complete a course and pass its assessments to earn your credential."}
              </p>
              <Link
                href="/learner/certificates"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-secondary-400 hover:text-secondary-300"
              >
                View & Download Certificate <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM: PROGRESS TRACKER ACROSS ENROLLMENTS */}
        {enrollments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-black text-gray-900">Your Progress Across All Courses</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete all lessons and pass the assessments to receive your accredited credential.
              </p>
            </div>
            <span className="text-xs font-black text-primary-700 bg-primary-50 px-3 py-1 rounded-full self-start sm:self-center">
              {overall}% Overall Progress
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {enrollments.map((m) => {
              const isCompleted = m.status === "completed" || m.progress_percent === 100;
              const isInProgress = !isCompleted && m.progress_percent > 0;
              return (
                <Link
                  key={m.uuid}
                  href={`/learner/courses/${m.uuid}`}
                  className="group flex flex-col items-center p-3 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-gray-50 transition-all text-center focus:outline-none"
                >
                  <span className="text-xs font-black text-gray-800 group-hover:text-primary-700 line-clamp-2">
                    {m.course.title}
                  </span>

                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCompleted ? "bg-highlight-500" : isInProgress ? "bg-secondary-500" : "bg-transparent"
                      }`}
                      style={{ width: `${m.progress_percent}%` }}
                    />
                  </div>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isCompleted
                        ? "bg-emerald-50 text-highlight-600"
                        : isInProgress
                        ? "bg-secondary-50 text-secondary-800"
                        : "text-gray-400"
                    }`}
                  >
                    {m.progress_percent}%
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        )}
      </div>
      )}
    </DashboardShell>
  );
}
