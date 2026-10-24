"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  FileCheck,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  Users,
  XCircle,
  Award,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Logo from "@/components/shared/Logo";
import { verifyCertificate, type CertificateVerification } from "@/lib/api/learner";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null): string {
  if (!iso) return "No expiry";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function kindLabel(type: "module" | "final"): string {
  return type === "final" ? "Program completion" : "Module completion";
}

/** Zed Screen: public verification ledger (header / body card / footer). */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F8F9FA] text-gray-900 selection:bg-secondary-500 selection:text-primary-950">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <ShieldCheck size={16} className="text-highlight-600" />
            <span>Public Credential Verification Ledger</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 justify-center px-4 py-12">
        {children}
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Certification Professionals Mastery Institute • Public Verification Gateway
      </footer>
    </div>
  );
}

function TokenForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const token = value.trim();
    if (token.length < 10) {
      setError("Paste the full verification token from the certificate PDF or verification link.");
      return;
    }
    setError(null);
    router.push(`/verify?token=${encodeURIComponent(token)}`);
  }

  return (
    <div className="w-full rounded-3xl border border-gray-200/90 bg-white p-6 shadow-xl sm:p-10">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-highlight-600 border border-highlight-200">
          <KeyRound size={28} aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 sm:text-2xl">Verify a credential</h1>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
            Enter the private verification token printed on the official certificate PDF.
          </p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <label htmlFor="verify-token" className="mb-1 block text-xs font-bold text-gray-700">
          Verification token
        </label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            id="verify-token"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Paste the token from the certificate"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "w-full rounded-xl border border-gray-200 py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
              error && "border-red-300",
            )}
            aria-invalid={Boolean(error) || undefined}
          />
        </div>
        {error ? (
          <p role="alert" className="text-xs font-medium text-red-600">{error}</p>
        ) : (
          <p className="text-[11px] text-gray-400">
            Tokens are case-sensitive and cannot be guessed from a certificate number.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-[#152A13] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-auto"
        >
          Verify Certificate
        </button>
      </form>

      <div className="mt-8 space-y-3 border-t border-gray-100 pt-6">
        {[
          {
            icon: FileCheck,
            title: "Open the official PDF",
            body: "The certificate PDF contains the verification link issued with the credential.",
          },
          {
            icon: KeyRound,
            title: "Copy the token",
            body: "Use the complete token from the link. For security it is stored only as a hash.",
          },
          {
            icon: ShieldCheck,
            title: "Get the registry result",
            body: "Verification is unauthenticated, rate-limited, and never reveals registry data.",
          },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon size={16} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
            <div>
              <p className="text-xs font-black text-gray-900">{item.title}</p>
              <p className="text-[11px] leading-relaxed text-gray-600">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBanner({
  tone,
  icon,
  eyebrow,
  title,
  description,
}: {
  tone: "ok" | "warn" | "bad";
  icon: "check" | "warn" | "bad";
  eyebrow: string;
  title: string;
  description: string;
}) {
  const BANNER = {
    ok: "from-emerald-600 to-primary-800 text-highlight-200 bg-white/10",
    warn: "from-amber-600 to-primary-900 text-amber-200 bg-white/10",
    bad: "from-red-700 to-primary-900 text-red-200 bg-white/10",
  } as const;
  const Icon = icon === "check" ? CheckCircle : icon === "warn" ? AlertTriangle : XCircle;
  return (
    <div className={cn("flex items-center gap-4 bg-gradient-to-r p-6 sm:p-8", BANNER[tone])}>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl backdrop-blur-md" aria-hidden>
        <Icon size={32} />
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{eyebrow}</span>
        <h1 className="mt-0.5 text-xl font-black sm:text-2xl">{title}</h1>
        <p className="mt-1 text-xs text-white/80">{description}</p>
      </div>
    </div>
  );
}

function DetailCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <span className="mb-1 block text-[10px] font-bold uppercase text-gray-400">{label}</span>
      {children}
    </div>
  );
}

function ResultView({ text, result }: { text: string; result: CertificateVerification }) {
  const cert = result.certificate;
  if (!result.found || !cert) {
    return (
      <div className="w-full overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-xl">
        <StatusBanner
          tone="warn"
          icon="warn"
          eyebrow="Official Validation Status"
          title="No certificate matches this token"
          description="Check that the full token was copied from the certificate PDF."
        />
        <div className="space-y-6 p-6 sm:p-10">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <p className="leading-relaxed">
              Verification uses a private token, so nothing can be looked up by certificate number. Open the official PDF and copy its
              verification link or token exactly.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
            <Link href="/verify" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900">
              <Search size={14} /> Try another token
            </Link>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900">
              Back to CPMI Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-xl">
      <StatusBanner
        tone={result.valid ? "ok" : "bad"}
        icon={result.valid ? "check" : "bad"}
        eyebrow="Official Validation Status"
        title={result.valid ? "Credential Verified & Active" : "Credential Revoked"}
        description={
          result.valid
            ? "This record is verified against the CPMI central enrollment registry."
            : "This credential exists in the registry but is no longer valid."
        }
      />

      <div className="space-y-6 p-6 sm:p-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <DetailCard label="Recipient Name">
            <p className="flex items-center gap-2 text-lg font-black text-gray-900">
              <Users size={16} className="text-primary-700" aria-hidden />
              {cert.learnerName}
            </p>
          </DetailCard>
          <DetailCard label="Certificate Number">
            <p className="flex items-center gap-2 font-mono text-lg font-black text-primary-900">
              <Award size={16} className="text-secondary-600" aria-hidden />
              {cert.certificateNumber}
            </p>
          </DetailCard>
        </div>

        <div className="space-y-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <span className="block text-[10px] font-bold uppercase text-gray-400">Certified Program</span>
          <p className="text-base font-bold text-gray-900">{cert.courseTitle ?? cert.moduleTitle ?? "Certification Program"}</p>
          {cert.moduleTitle && cert.courseTitle && cert.moduleTitle !== cert.courseTitle ? (
            <p className="text-xs text-gray-500">Module: {cert.moduleTitle}</p>
          ) : null}
          <p className="text-xs text-gray-500">
            {kindLabel(cert.certificateType)} · 49 CFR Part 26 & 49 CFR Part 23 compliance training.
          </p>
        </div>

        {result.revocation ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
            <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
            <div>
              <p className="font-bold">Revoked {formatDate(result.revocation.revokedAt)}</p>
              {result.revocation.reason ? <p className="mt-0.5 leading-relaxed">{result.revocation.reason}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs sm:grid-cols-3">
          <div>
            <span className="block text-[10px] font-bold uppercase text-gray-400">Issue Date</span>
            <p className="mt-1 flex items-center gap-1.5 font-bold text-gray-800">
              <Calendar size={13} aria-hidden /> {formatDate(cert.issuedAt)}
            </p>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase text-gray-400">Expiry Date</span>
            <p className="mt-1 font-bold text-gray-800">{formatDate(cert.expiresAt)}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase text-gray-400">Status</span>
            <p className="mt-1">
              {result.valid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle size={10} /> Verified & Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                  <XCircle size={10} /> Revoked
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900">
          <FileCheck size={18} className="mt-0.5 shrink-0 text-blue-600" aria-hidden />
          <div>
            <p className="font-bold">Accreditation Audit Note:</p>
            <p className="mt-0.5 leading-relaxed text-blue-800">
              This public confirmation reflects the official registry record. The signed PDF held by the learner remains the certificate of
              record. Token: {text.slice(0, 6)}…{text.slice(-4)}.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-6">
        <Link href="/verify" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900">
          <Search size={14} /> Verify another token
        </Link>
        <span className="text-[11px] font-medium text-gray-400">Unauthenticated · rate-limited · tamper-resistant</span>
      </div>
    </div>
  );
}

export function VerifyZed({ token }: { token: string | null }) {
  const cleanToken = token?.trim() ?? "";
  const query = useQuery({
    queryKey: ["certificate-verification", cleanToken],
    queryFn: () => verifyCertificate(cleanToken),
    enabled: cleanToken.length >= 10,
    retry: false,
  });

  if (!cleanToken) {
    return (
      <Frame>
        <TokenForm />
      </Frame>
    );
  }

  if (cleanToken.length < 10) {
    return (
      <Frame>
        <div className="w-full rounded-3xl border border-gray-200/90 bg-white p-6 shadow-xl sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 text-amber-600">
              <AlertTriangle size={28} aria-hidden />
            </div>
            <div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Incomplete token
              </span>
              <h1 className="mt-3 font-black text-gray-900 sm:text-2xl">That token looks incomplete</h1>
              <p className="mt-2 max-w-md text-xs text-gray-600 sm:text-sm">
                Copy the entire verification link or token from the certificate PDF and try again.
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-5">
            <Link href="/verify" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900">
              <Search size={14} /> Try another token
            </Link>
          </div>
        </div>
      </Frame>
    );
  }

  if (query.isPending) {
    return (
      <Frame>
        <div role="status" aria-live="polite" className="grid w-full place-items-center rounded-3xl border border-gray-200/90 bg-white px-6 py-20 text-center shadow-xl">
          <Loader2 className="size-8 animate-spin text-highlight-600" aria-hidden />
          <p className="mt-4 text-xs font-bold text-gray-500">Checking the CPMI verification registry…</p>
          <span className="sr-only">Loading</span>
        </div>
      </Frame>
    );
  }

  if (query.isError) {
    return (
      <Frame>
        <div role="alert" className="w-full rounded-3xl border border-gray-200/90 bg-white p-6 shadow-xl sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-red-200 bg-red-50 text-red-600">
              <XCircle size={28} aria-hidden />
            </div>
            <div>
              <h1 className="font-black text-gray-900 sm:text-2xl">We couldn&apos;t check this token</h1>
              <p className="mt-2 max-w-md text-xs text-gray-600 sm:text-sm">
                {query.error instanceof Error
                  ? query.error.message
                  : "The verification service is temporarily unavailable. Please try again."}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
            <button
              onClick={() => void query.refetch()}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Try again
            </button>
            <Link href="/verify" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900">
              <Search size={14} /> Use a different token
            </Link>
          </div>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <ResultView text={cleanToken} result={query.data!} />
    </Frame>
  );
}
