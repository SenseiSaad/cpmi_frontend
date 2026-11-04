"use client";

import { LearnerDetailView } from "@/components/people/learner-detail";

/** Platform staff open one person inside any agency. */
export default function AdminLearnerPage({ params }: { params: { agencyId: string; membershipId: string } }) {
  return <LearnerDetailView agencyId={params.agencyId} membershipId={params.membershipId} backHref={`/admin/agencies/${params.agencyId}`} backLabel="Back to the agency" canManage />;
}
