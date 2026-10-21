"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Search } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { LearnerSidebar } from "@/components/layout/SidebarNav";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/QueryState";
import { learnerKeys, listEnrollments } from "@/features/learner/api";
import { formatDate } from "@/features/learner/format";

export default function CoursesPage() {
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: learnerKeys.enrollments,
    queryFn: listEnrollments,
  });
  const enrollments = data ?? [];

  const q = search.toLowerCase();
  const filtered = enrollments.filter((m) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && m.status === "completed") ||
      (filter === "in-progress" && m.status === "in_progress");
    const matchesSearch =
      m.course.title.toLowerCase().includes(q) ||
      (m.course.description ?? "").toLowerCase().includes(q) ||
      m.agency.name.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <DashboardShell
      sidebar={<LearnerSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">My Courses</h1>
          <p className="text-xs text-gray-500">Courses assigned to you by your agency</p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 self-stretch sm:self-auto bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "all" ? "bg-white text-primary-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({enrollments.length})
            </button>
            <button
              onClick={() => setFilter("in-progress")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "in-progress" ? "bg-white text-primary-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "completed" ? "bg-white text-primary-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {isLoading && <LoadingState label="Loading your courses…" />}
        {isError && <ErrorState error={error} onRetry={() => refetch()} />}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            title={enrollments.length ? "No matching courses" : "No courses yet"}
            description={
              enrollments.length
                ? "Try a different search or filter."
                : "Courses assigned by your agency will appear here."
            }
          />
        )}

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((module) => {
            const isCompleted = module.status === "completed";
            const isInProgress = module.status === "in_progress";
            return (
              <motion.div
                key={module.uuid}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg">
                      {module.agency.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? "bg-emerald-50 text-highlight-600"
                          : isInProgress
                          ? "bg-secondary-50 text-secondary-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-gray-900 leading-snug mb-1">
                    {module.course.title}
                  </h3>
                  {module.course.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{module.course.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>Progress</span>
                      <span className="text-primary-700">{module.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCompleted
                            ? "bg-highlight-500"
                            : isInProgress
                            ? "bg-secondary-500"
                            : "bg-transparent"
                        }`}
                        style={{ width: `${module.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {isCompleted ? "Completed" : `Due ${formatDate(module.due_at)}`}
                  </span>
                  <Link
                    href={`/learner/courses/${module.uuid}`}
                    className="inline-flex items-center gap-1.5 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    <Play size={12} className="text-secondary-400" />
                    <span>{isCompleted ? "Review" : isInProgress ? "Continue" : "Launch"}</span>
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
