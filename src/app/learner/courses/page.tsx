"use client";

import { BookOpen, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useEnrollments } from "@/lib/api/hooks";
import type { EnrollmentStatus } from "@/lib/api/learner";

type Filter = "all" | EnrollmentStatus;

export default function LearnerCoursesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const enrollments = useEnrollments();

  const rows = (enrollments.data ?? []).filter((enrollment) => filter === "all" || enrollment.status === filter);

  return (
    <>
      <PageHeader
        eyebrow="Learner"
        title="My courses"
        subtitle="Every course assigned to you, with progress and due dates."
      />

      <div className="mb-4">
        <Tabs
          label="Filter courses"
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "All", count: enrollments.data?.length },
            { value: "in_progress", label: "In progress" },
            { value: "assigned", label: "Assigned" },
            { value: "completed", label: "Completed" },
          ]}
        />
      </div>

      {enrollments.isError ? (
        <Panel><ErrorState message={enrollments.error instanceof Error ? enrollments.error.message : undefined} onRetry={() => void enrollments.refetch()} /></Panel>
      ) : enrollments.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-60" />)}
        </div>
      ) : rows.length === 0 ? (
        <Panel>
          <div className="py-12 text-center">
            <BookOpen className="mx-auto size-8 text-ink-400" aria-hidden />
            <p className="mt-3 text-lg font-bold text-ink-900">No courses in this view</p>
            <p className="mt-1 text-sm text-ink-600">Your agency administrator assigns courses through seat entitlements.</p>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((enrollment) => (
            <Link
              key={enrollment.uuid}
              href={`/learner/courses/${enrollment.uuid}`}
              className="group flex flex-col rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-2">
                <Badge tone={enrollment.status === "completed" ? "ok" : enrollment.status === "in_progress" ? "brand" : "neutral"} dot>
                  {enrollment.status.replace(/_/g, " ")}
                </Badge>
                <ChevronRight className="size-4 text-ink-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
              <h2 className="mt-3 line-clamp-2 text-base font-bold tracking-tight text-ink-900">{enrollment.course.title}</h2>
              {enrollment.course.description ? <p className="mt-1 line-clamp-2 text-sm text-ink-600">{enrollment.course.description}</p> : null}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-600">
                <CalendarDays className="size-3.5" aria-hidden />
                {enrollment.due_at ? `Due ${new Date(enrollment.due_at).toLocaleDateString()}` : "No due date"}
              </p>
              <div className="mt-auto pt-5">
                <ProgressBar value={enrollment.progress_percent} label={`${enrollment.course.title} progress`} showValue />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-canvas-soft p-5 text-sm text-ink-600 ring-1 ring-line">
        <p className="font-semibold text-ink-900">Need another course?</p>
        <p className="mt-1">Courses and seats are assigned by your agency administrator. Contact them if a required program is missing.</p>
        <ButtonLink href="/learner/assessments" variant="secondary" size="sm" className="mt-3">View assessments</ButtonLink>
      </div>
    </>
  );
}
