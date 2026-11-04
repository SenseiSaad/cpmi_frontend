"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ReportsWorkspace } from "@/components/reports/workspace";

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Reports"
        subtitle="Courses, completions, students, agency accounts, revenue and subscriptions across every agency. Pick a report, choose the period, and download it as a spreadsheet."
      />
      <ReportsWorkspace scope="platform" />
    </>
  );
}
