import type { Metadata } from "next";
import { Suspense } from "react";

import AcceptForm from "./AcceptForm";

export const metadata: Metadata = { title: "Accept your invitation" };

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" aria-busy="true" />}>
      <AcceptForm />
    </Suspense>
  );
}
