"use client";

import { useParams } from "next/navigation";
import VerifyCertificateView from "@/features/public/VerifyCertificateView";

/** `/verify/<token>`: the path segment is treated as the verification token. */
export default function PublicVerifyPage() {
  const params = useParams<{ id: string }>();
  const raw = params?.id ?? "";
  let token = raw;
  try {
    token = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  return <VerifyCertificateView token={token} />;
}
