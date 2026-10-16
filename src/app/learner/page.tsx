"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  Award,
  User,
  LayoutDashboard,
  Play,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import DashboardShell from "@/components/layout/DashboardShell";
import { LearnerSidebar } from "@/components/layout/SidebarNav";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { learnerStats, learnerCourses, upcomingAssessments, modules } from "@/lib/data";

export default function LearnerDashboard() {
  const headerGreeting = (
    <div>
      <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
        Good morning, Sarah Johnson!
      </h1>
      <p className="text-xs text-gray-500 font-medium">
        Continue your learning journey. You&apos;re making great progress.
      </p>
    </div>
  );

  return (
    <DashboardShell sidebar={<LearnerSidebar />} headerContent={headerGreeting}>
      <div className="space-y-8">
        {/* TOP 4 KPI CARDS (Screen 3 Direct Reference) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              label: "Enrolled Courses",
              value: learnerStats.enrolled,
              icon: BookOpen,
              color: "text-primary-600",
              bg: "bg-primary-50",
            },
            {
              label: "Completed",
              value: learnerStats.completed,
              icon: CheckCircle,
              color: "text-highlight-600",
              bg: "bg-emerald-50",
            },
            {
              label: "In Progress",
              value: learnerStats.inProgress,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Certificates Earned",
              value: learnerStats.certificates,
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
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Course Thumbnail */}
                <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden bg-primary-900 flex-shrink-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&q=80')",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 to-transparent" />
                  <span className="absolute bottom-2 left-2 bg-secondary-500 text-primary-950 text-[10px] font-black px-2 py-0.5 rounded">
                    Module 4
                  </span>
                </div>

                {/* Course Details */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-secondary-600 uppercase tracking-wide">
                      In Progress • Lesson 2 of 8
                    </span>
                    <span className="text-xs font-black text-primary-700">60% Complete</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-gray-900 mt-1">
                    Module 4: DBE Program Requirements
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    Triennial overall goal setting, availability equations, and race-neutral measures.
                  </p>

                  <div className="mt-3">
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-highlight-500 h-full w-[60%] rounded-full transition-all" />
                    </div>
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="sm:self-center w-full sm:w-auto">
                  <Link
                    href="/learner/courses/4"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <Play size={13} className="text-secondary-400" />
                    <span>Continue</span>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Other Enrolled Courses Mini-List */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {learnerCourses
                .filter((c) => c.id !== 4)
                .map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl border border-gray-200/80 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-highlight-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{course.title}</p>
                        <p className="text-[10px] text-gray-500">{course.totalLessons} Lessons • 100% Passed</p>
                      </div>
                    </div>
                    <Link
                      href={`/learner/courses/${course.id}`}
                      className="text-xs font-bold text-gray-400 hover:text-primary-600"
                    >
                      Review
                    </Link>
                  </div>
                ))}
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
                {upcomingAssessments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-primary-200 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ClipboardList size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">{a.title}</p>
                        <p className="text-[11px] text-gray-500 mt-1">Due {a.dueDate}</p>
                      </div>
                    </div>
                    <Link
                      href={`/learner/assessments/${a.id}`}
                      className="px-2.5 py-1 bg-white border border-gray-200 hover:border-primary-500 text-primary-700 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap"
                    >
                      Start
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
              <h3 className="text-lg font-black mt-1">Certificates Earned: 1</h3>
              <p className="text-xs text-white/75 mt-2 leading-relaxed">
                DBE / ACDBE Compliance Training Program. Certificate ID: CPMI-2026-000123.
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

        {/* BOTTOM: "YOUR PROGRESS" 11 MODULE TRACKER (Screen 3 Direct Reference) */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-black text-gray-900">Your Progress Across All 11 Modules</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete all modules and passing assessments to receive your accredited credential.
              </p>
            </div>
            <span className="text-xs font-black text-primary-700 bg-primary-50 px-3 py-1 rounded-full self-start sm:self-center">
              42% Overall Course Progress
            </span>
          </div>

          {/* 11 Modules Bar Grid (M1 to M11) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
            {modules.map((m) => {
              const isCompleted = m.progress === 100;
              const isInProgress = m.progress > 0 && m.progress < 100;
              return (
                <Link
                  key={m.id}
                  href={`/learner/courses/${m.id}`}
                  className="group flex flex-col items-center p-3 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-gray-50 transition-all text-center focus:outline-none"
                >
                  <span className="text-xs font-black text-gray-800 group-hover:text-primary-700">{m.code}</span>
                  
                  {/* Mini status bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCompleted
                          ? "bg-highlight-500"
                          : isInProgress
                          ? "bg-secondary-500"
                          : "bg-transparent"
                      }`}
                      style={{ width: `${m.progress}%` }}
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
                    {m.progress}%
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
