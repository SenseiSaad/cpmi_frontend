import type { Metadata } from "next";
import { Suspense } from "react";

import { AcceptView } from "./accept-view";

export const metadata: Metadata = { title: "Accept your invitation" };

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptView />
    </Suspense>
  );
}
