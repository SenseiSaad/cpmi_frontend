import type { Metadata } from "next";
import { Suspense } from "react";

import ResetForm from "./ResetForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" aria-busy="true" />}>
      <ResetForm />
    </Suspense>
  );
}
