"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import VerifyCertificateView from "@/features/public/VerifyCertificateView";

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyFromQuery />
    </Suspense>
  );
}

function VerifyFromQuery() {
  const searchParams = useSearchParams();
  return <VerifyCertificateView token={searchParams.get("token")} />;
}
