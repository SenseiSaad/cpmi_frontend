"use client";

import { LearnerDetailView } from "@/components/people/learner-detail";
import { Skeleton } from "@/components/ui/states";
import { useSession } from "@/lib/auth/session";

/** An agency administrator opens one of their own people. */
export default function AgencyLearnerPage({ params }: { params: { membershipId: string } }) {
  const { user } = useSession();
  const agencyId = user?.agency?.publicId;
  if (!agencyId) return <Skeleton className="h-64" />;
  return <LearnerDetailView agencyId={agencyId} membershipId={params.membershipId} backHref="/agency/members" backLabel="All members" canManage />;
}
