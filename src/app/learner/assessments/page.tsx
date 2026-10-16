"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ClipboardList, Clock, Award, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { LearnerSidebar } from "@/components/layout/SidebarNav";

const assessmentsList = [
  {
    id: "m4-quiz",
    title: "Module 4 Assessment: DBE Program Requirements",
    questions: 10,
    duration: "25 min",
    dueDate: "Apr 20, 2026",
    status: "available",
    score: null,
    passingScore: 80,
    desc: "Tests understanding of triennial goal setting, availability base figures, and race-neutral measures.",
  },
  {
    id: "m5-quiz",
    title: "Module 5 Assessment: Compliance & Monitoring",
    questions: 15,
    duration: "30 min",
    dueDate: "Apr 28, 2026",
    status: "upcoming",
    score: null,
    passingScore: 80,
    desc: "Evaluates Commercially Useful Function (CUF) jobsite inspections and subcontractor payment rules.",
  },
  {
    id: "final-exam",
    title: "Final Comprehensive Certification Exam",
    questions: 50,
    duration: "90 min",
    dueDate: "May 15, 2026",
    status: "upcoming",
    score: null,
    passingScore: 80,
    desc: "Comprehensive 50-question exam covering all 11 modules required for official CPMI Certification.",
  },
  {
    id: "m1-quiz",
    title: "Module 1 Assessment: Introduction to DBE Program",
    questions: 10,
    duration: "20 min",
    dueDate: "Completed",
    status: "completed",
    score: 100,
    passingScore: 80,
    desc: "Foundations of 49 CFR Part 26, historical context, and DBELO responsibilities.",
  },
  {
    id: "m2-quiz",
    title: "Module 2 Assessment: Eligibility & PNW",
    questions: 12,
    duration: "25 min",
    dueDate: "Completed",
    status: "completed",
    score: 92,
    passingScore: 80,
    desc: "Personal Net Worth calculations, rebuttable presumptions, and small business size standards.",
  },
];

export default function AssessmentsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filtered = assessmentsList.filter((a) => {
    if (filter === "completed") return a.status === "completed";
    if (filter === "pending") return a.status !== "completed";
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

        {/* Assessment Cards */}
        <div className="space-y-4">
          {filtered.map((item) => {
            const isCompleted = item.status === "completed";
            return (
              <motion.div
                key={item.id}
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
                        {isCompleted ? `Passed • Score ${item.score}%` : `Due ${item.dueDate}`}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {item.questions} Questions • {item.duration}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-xl">{item.desc}</p>
                  </div>
                </div>

                <div className="sm:self-center w-full sm:w-auto">
                  <Link
                    href={`/learner/assessments/${item.id}`}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold px-6 py-2.5 rounded-xl text-xs transition-all ${
                      isCompleted
                        ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "bg-[#152A13] hover:bg-primary-800 text-white shadow-xs"
                    }`}
                  >
                    <span>{isCompleted ? "Review Results" : "Take Assessment"}</span>
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
