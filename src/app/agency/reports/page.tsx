"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ReportsWorkspace } from "@/components/reports/workspace";
import { Skeleton } from "@/components/ui/states";
import { useSession } from "@/lib/auth/session";

export default function AgencyReportsPage() {
  const { user } = useSession();
  const agencyId = user?.agency?.publicId;
  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Reports"
        subtitle="How your team is doing: who is learning, who has finished, who has gone quiet, and when your subscriptions renew. Every table can be downloaded as a spreadsheet."
      />
      {agencyId ? <ReportsWorkspace scope="agency" agencyId={agencyId} /> : <Skeleton className="h-64" />}
    </>
  );
}
