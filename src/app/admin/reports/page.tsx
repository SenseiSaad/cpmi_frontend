"use client";

import { CompletionPanel, OverviewTiles, PassRatePanel, RevenuePanel } from "@/features/platform/reports";
import { AdminPage } from "@/features/platform/ui";

export default function AdminReportsPage() {
  return (
    <AdminPage title="Accreditation & Analytics Reports" subtitle="Revenue, course completion and assessment pass rates across all agencies">
      <OverviewTiles />
      <RevenuePanel />
      <CompletionPanel />
      <PassRatePanel />
    </AdminPage>
  );
}
