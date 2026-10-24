import type { Metadata } from "next";

import { VerifyZed } from "./verify-view";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Verify a Certification Academy credential using the private token printed on the official PDF.",
};

export default function VerifyPage({
  searchParams,
}: {
  searchParams?: { token?: string | string[] };
}) {
  const raw = searchParams?.token;
  const token = Array.isArray(raw) ? raw[0] ?? null : raw ?? null;
  return <VerifyZed token={token} />;
}
