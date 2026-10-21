"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Award, User, ArrowLeft, FileCheck, Search } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { ErrorState, LoadingState } from "@/components/shared/QueryState";
import { extractToken, formatDate, isPlausibleToken, publicApi, type CertificateVerification } from "./api";

/** Full-page public certificate verification, shared by `/verify?token=` and `/verify/[id]`. */
export default function VerifyCertificateView({ token }: { token: string | null }) {
  const trimmed = token?.trim() ?? "";
  const plausible = isPlausibleToken(trimmed);

  const query = useQuery({
    queryKey: ["public", "certificate-verify", trimmed],
    queryFn: ({ signal }) => publicApi.verifyCertificate(trimmed, signal),
    enabled: plausible,
    retry: false,
    staleTime: 60_000,
  });

  let body: React.ReactNode;
  if (!trimmed) body = <TokenEntry />;
  else if (!plausible) body = <NotFound />;
  else if (query.isPending) body = <div className="p-10"><LoadingState label="Verifying certificate…" /></div>;
  else if (query.isError) body = <div className="p-6 sm:p-10"><ErrorState error={query.error} onRetry={() => void query.refetch()} /></div>;
  else if (!query.data.found || !query.data.certificate) body = <NotFound />;
  else body = <Result data={query.data} />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 selection:bg-secondary-500 selection:text-primary-950 flex flex-col justify-between">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <ShieldCheck size={16} className="text-highlight-600" />
            <span>Public Credential Verification</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden">
          {body}
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900">
              <ArrowLeft size={14} /> Back to CPMI Home
            </Link>
            {trimmed && (
              <Link href="/verify" className="text-xs font-bold text-primary-700 hover:text-primary-900">
                Verify another certificate
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        © 2026 Certification Professionals Mastery Institute • Public Verification Gateway
      </footer>
    </div>
  );
}

function Banner({ tone, title, subtitle }: { tone: "valid" | "revoked" | "missing"; title: string; subtitle: string }) {
  const styles = {
    valid: "from-emerald-600 to-primary-800",
    revoked: "from-red-700 to-red-900",
    missing: "from-gray-600 to-gray-800",
  }[tone];
  const Icon = tone === "valid" ? CheckCircle : tone === "revoked" ? AlertTriangle : XCircle;
  return (
    <div className={`bg-gradient-to-r ${styles} text-white p-6 sm:p-8 flex items-center gap-4`}>
      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0">
        <Icon size={32} />
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-300">Official Validation Status</span>
        <h1 className="text-xl sm:text-2xl font-black mt-0.5">{title}</h1>
        <p className="text-xs text-white/80 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <>
      <Banner tone="missing" title="Certificate Not Found" subtitle="No certificate matches this verification link." />
      <div className="p-6 sm:p-10 text-sm text-gray-600 space-y-4">
        <p>Check that the full verification link or token was copied exactly as printed on the certificate.</p>
        <TokenForm />
      </div>
    </>
  );
}

function TokenEntry() {
  return (
    <>
      <Banner tone="valid" title="Verify a CPMI Certificate" subtitle="Enter the verification token or link printed on the certificate." />
      <div className="p-6 sm:p-10">
        <TokenForm />
      </div>
    </>
  );
}

export function TokenForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = extractToken(value);
    if (!isPlausibleToken(token)) {
      setError("Please enter the full verification token or link from the certificate.");
      return;
    }
    router.push(`/verify?token=${encodeURIComponent(token)}`);
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="verify-token" className="label">Verification token or link</label>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input id="verify-token" value={value} onChange={(e) => { setValue(e.target.value); setError(""); }} className="input pl-10 text-sm" placeholder="Paste verification token or link" />
        </div>
        <button type="submit" className="btn-primary text-sm">Verify</button>
      </div>
      {error && <p className="text-xs text-red-700" role="alert">{error}</p>}
    </form>
  );
}

function Result({ data }: { data: CertificateVerification }) {
  const cert = data.certificate!;
  return (
    <>
      {data.valid ? (
        <Banner tone="valid" title="Official Credential Verified & Active" subtitle="Record verified against the CPMI certificate registry." />
      ) : (
        <Banner tone="revoked" title="Certificate Revoked" subtitle={data.revocation ? `Revoked on ${formatDate(data.revocation.revokedAt)}.` : "This certificate is no longer valid."} />
      )}
      <div className="p-6 sm:p-10 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Recipient Name</span>
            <p className="text-lg font-black text-gray-900 flex items-center gap-2">
              <User size={16} className="text-primary-700" />
              {cert.learnerName}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Certificate Number</span>
            <p className="text-lg font-mono font-black text-primary-900 flex items-center gap-2 break-all">
              <Award size={16} className="text-secondary-600 flex-shrink-0" />
              {cert.certificateNumber}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Certified Program</span>
          <p className="text-base font-bold text-gray-900">{cert.courseTitle}</p>
          {cert.moduleTitle && <p className="text-xs text-gray-500">Module: {cert.moduleTitle}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-xs">
          <div>
            <span className="font-bold text-gray-400 uppercase text-[10px] block">Issue Date</span>
            <p className="font-bold text-gray-800 mt-1">{formatDate(cert.issuedAt)}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400 uppercase text-[10px] block">Expiry Date</span>
            <p className="font-bold text-gray-800 mt-1">{formatDate(cert.expiresAt)}</p>
          </div>
          <div>
            <span className="font-bold text-gray-400 uppercase text-[10px] block">Status</span>
            <p className={`font-bold mt-1 ${data.valid ? "text-highlight-600" : "text-red-700"}`}>{data.valid ? "Valid" : "Revoked"}</p>
          </div>
        </div>

        {!data.valid && data.revocation?.reason && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800">
            <p className="font-bold">Revocation reason</p>
            <p className="mt-0.5">{data.revocation.reason}</p>
          </div>
        )}

        {data.valid && (
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
            <FileCheck size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800">This public record confirms the certificate above was issued by CPMI and has not been revoked.</p>
          </div>
        )}
      </div>
    </>
  );
}
