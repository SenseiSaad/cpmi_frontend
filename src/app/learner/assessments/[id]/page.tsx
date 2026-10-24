import { Suspense } from "react";

import { Skeleton } from "@/components/ui/states";

import { AssessmentRunner } from "./assessment-runner";

export default function AssessmentPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      }
    >
      <AssessmentRunner assessmentId={params.id} />
    </Suspense>
  );
}
