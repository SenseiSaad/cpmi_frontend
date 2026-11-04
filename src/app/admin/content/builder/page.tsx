"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { StudioBuilder } from "@/components/studio/builder";

function BuilderRoute() {
  const course = useSearchParams().get("course");
  // Re-mount when switching between "new" and an existing course so state never leaks across.
  return <StudioBuilder key={course ?? "new"} courseUuid={course && /^[0-9a-f-]{36}$/i.test(course) ? course : null} />;
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/60" />}>
      <BuilderRoute />
    </Suspense>
  );
}
