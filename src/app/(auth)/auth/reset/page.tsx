import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetView } from "./reset-view";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetView />
    </Suspense>
  );
}
