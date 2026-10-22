"use client";

import {
  Award,
  CheckCircle,
  Download,
  Loader2,
  Printer,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import Logo from "@/components/shared/Logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLearnerCertificates } from "@/lib/api/hooks";
import { downloadCertificatePdf, type MyCertificate } from "@/lib/api/learner";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null): string {
  if (!iso) return "No expiry";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function certificateTitle(cert: MyCertificate): string {
  return cert.moduleTitle ?? cert.courseTitle ?? "Certification";
}

function certificateKind(cert: MyCertificate): string {
  return cert.certificateType === "final" ? "Program Completion" : "Module Completion";
}

/** The official certificate canvas (Zed design) rendered with real registry data. */
function CertificateCanvas({ cert, learnerName }: { cert: MyCertificate; learnerName: string }) {
  return (
    <div className="certificate-print overflow-hidden rounded-3xl border border-gray-200/90 bg-white p-6 shadow-lg sm:p-12 print:border-none print:p-0 print:shadow-none">
      {/* Elegant Double Border with Gold Inset */}
      <div className="relative rounded-2xl border-4 border-double border-[#CFB112]/50 bg-gradient-to-br from-amber-50/20 via-white to-emerald-50/15 p-6 sm:p-10">
        {/* Corner Ornaments */}
        <div className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-secondary-500" aria-hidden />
        <div className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-secondary-500" aria-hidden />
        <div className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-secondary-500" aria-hidden />
        <div className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-secondary-500" aria-hidden />

        {/* Certificate Header */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
            Certification Professionals Mastery Institute
          </p>
          <h2 className="pt-4 font-serif text-2xl font-black tracking-wider text-primary-950 sm:text-4xl">
            CERTIFICATE OF COMPLETION
          </h2>
          <p className="text-xs italic text-gray-500">This certifies that</p>
        </div>

        {/* Recipient Name */}
        <div className="my-6 text-center">
          <span className="inline-block border-b-2 border-secondary-500 px-8 pb-1 font-serif text-3xl font-black text-gray-900 sm:text-4xl">
            {learnerName}
          </span>
        </div>

        {/* Body Citation */}
        <div className="mx-auto max-w-xl space-y-2 text-center">
          <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
            has successfully completed all requirements for the
          </p>
          <p className="text-base font-black leading-tight text-primary-900 sm:text-lg">{certificateTitle(cert)}</p>
          {cert.moduleTitle && cert.courseTitle && cert.moduleTitle !== cert.courseTitle ? (
            <p className="text-xs font-bold text-gray-500">{certificateKind(cert)} · {cert.courseTitle}</p>
          ) : (
            <p className="text-xs font-bold text-gray-500">{certificateKind(cert)}</p>
          )}
        </div>

        {/* Details & Signature Footer with Gold Seal */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-gray-200/80 pt-8 sm:flex-row">
          {/* Left Metadata */}
          <div className="space-y-1.5 text-left text-xs text-gray-600">
            <p>
              <span className="block text-[10px] font-bold uppercase text-gray-400">Certificate Number:</span>
              <span className="font-mono font-bold text-primary-900">{cert.certificateNumber}</span>
            </p>
            <p>
              <span className="block text-[10px] font-bold uppercase text-gray-400">Issue Date:</span>
              <span className="font-semibold text-gray-800">{formatDate(cert.issuedAt)}</span>
            </p>
            <p>
              <span className="block text-[10px] font-bold uppercase text-gray-400">Expiry Date:</span>
              <span className="font-semibold text-gray-800">{formatDate(cert.expiresAt)}</span>
            </p>
          </div>

          {/* Center Gold Seal (Embossed CPMI Monogram) */}
          <div className="flex flex-col items-center" aria-hidden>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#b09208] via-[#CFB112] to-[#f4eb8a] p-1 shadow-md">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-dashed border-[#8c710a] bg-[#CFB112] text-primary-950 shadow-inner">
                <Award size={20} className="text-primary-950" />
                <span className="mt-0.5 text-[10px] font-black uppercase tracking-widest">CPMI</span>
                <span className="text-[7px] font-bold uppercase tracking-wider opacity-80">SEAL</span>
              </div>
            </div>
          </div>

          {/* Right Signature */}
          <div className="space-y-1 text-center sm:text-right">
            <div className="pb-1 font-serif text-xl font-bold italic text-primary-900">Certification Academy</div>
            <div className="h-px w-40 bg-gray-300" />
            <p className="text-[10px] font-bold uppercase text-gray-500">Authorized Signing Authority</p>
            <p className="text-[9px] text-gray-400">Certification Professionals Mastery Institute</p>
          </div>
        </div>

        {cert.status === "revoked" ? (
          <div className="mt-8 rounded-xl bg-bad-bg px-4 py-3 text-xs font-medium text-bad">
            This certificate was revoked on {formatDate(cert.revokedAt)}
            {cert.revocationReason ? `: ${cert.revocationReason}` : ""}.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const certificates = useLearnerCertificates();
  const { user } = useSession();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const list = certificates.data ?? [];
  const selected = list.find((cert) => cert.uuid === selectedId) ?? list[0] ?? null;
  const learnerName = user ? `${user.firstName} ${user.lastName}` : "Certificate Holder";

  async function download(cert: MyCertificate) {
    setDownloading(cert.uuid);
    try {
      await downloadCertificatePdf(cert);
      toast.success("Certificate downloaded", `${cert.certificateNumber}.pdf`);
    } catch (error) {
      toast.error("Could not download the certificate", error instanceof Error ? error.message : undefined);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          eyebrow="Learner"
          title="Official Certificates"
          subtitle="Accredited credentials and verified compliance records"
          actions={<ButtonLink href="/learner/assessments" variant="secondary" size="sm">My assessments</ButtonLink>}
        />
      </div>

      {certificates.isError ? (
        <Panel>
          <div role="alert" className="grid place-items-center px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-bad-bg text-bad">
              <XCircle className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-base font-bold text-gray-900">We couldn&apos;t load your certificates</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-600">
              {certificates.error instanceof Error ? certificates.error.message : "Something went wrong. Please try again."}
            </p>
            <Button variant="secondary" size="sm" className="mt-5" onClick={() => void certificates.refetch()}>
              Try again
            </Button>
          </div>
        </Panel>
      ) : certificates.isPending ? (
        <div className="grid gap-8 lg:grid-cols-12">
          <Skeleton className="h-[28rem] lg:col-span-9" />
          <Skeleton className="h-72 lg:col-span-3" />
        </div>
      ) : !selected ? (
        <Panel className="max-w-3xl">
          <div className="grid place-items-center px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-highlight-600">
              <Award className="size-7" aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-black text-gray-900">No certificates yet</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-600">
              Certificates are issued automatically after you pass a required assessment. Keep working through your courses.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/learner/courses">Go to my courses</ButtonLink>
              <ButtonLink href="/verify" variant="secondary">Public verification</ButtonLink>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-12">
          {/* LEFT: THE OFFICIAL CERTIFICATE CANVAS (Zed Screen 6) */}
          <div className="lg:col-span-9">
            <CertificateCanvas cert={selected} learnerName={learnerName} />
          </div>

          {/* RIGHT: ACTION CONTROLS (Zed Screen 6) */}
          <div className="space-y-4 lg:col-span-3 no-print">
            {list.length > 0 ? (
              <div className="rounded-3xl border border-gray-200/90 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">Credentials ({list.length})</h3>
                <div className="thin-scroll max-h-64 space-y-2 overflow-y-auto pr-1">
                  {list.map((cert) => {
                    const active = cert.uuid === selected?.uuid;
                    return (
                      <button
                        key={cert.uuid}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedId(cert.uuid)}
                        className={cn(
                          "w-full rounded-2xl border p-3 text-left transition-all",
                          active
                            ? "border-highlight-500 bg-emerald-50/70 shadow-xs ring-1 ring-highlight-500"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50",
                        )}
                      >
                        <p className="truncate text-xs font-black text-gray-900">{certificateTitle(cert)}</p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500">{cert.certificateNumber}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                            {certificateKind(cert)}
                          </span>
                          {cert.status === "revoked" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-800">
                              <XCircle size={10} /> Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                              <CheckCircle size={10} /> Valid
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Certificate Actions */}
            <div className="space-y-3 rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">Certificate Actions</h3>

              <button
                onClick={() => void download(selected)}
                disabled={downloading === selected.uuid}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#152A13] py-3.5 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
              >
                {downloading === selected.uuid ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} className="text-secondary-400" />}
                <span>{downloading === selected.uuid ? "Preparing PDF..." : "Download PDF"}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50"
              >
                <Printer size={15} />
                <span>Print Certificate</span>
              </button>

              <Link
                href="/verify"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50"
              >
                <ShieldCheck size={15} className="text-highlight-600" />
                <span>Verify Certificate</span>
              </Link>
            </div>

            {/* Audit Status Card */}
            <div className="space-y-2 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-black text-emerald-950">
                <CheckCircle size={15} className="text-highlight-600" />
                <span>Registry-Recorded Credential</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Each credential is issued by the CPMI enrollment system with a unique number. Auditors verify validity with the token
                printed on the official PDF — certificate numbers alone are never used for lookup.
              </p>
            </div>
          </div>
        </div>
      )}

      {selected && !certificates.isPending ? (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-gray-500 no-print">
          <span>
            {selected.status === "revoked"
              ? "This credential is no longer valid."
              : `Issued ${formatDate(selected.issuedAt)} · expires ${formatDate(selected.expiresAt)}.`}
          </span>
          <Link href="/learner/assessments" className="font-bold text-primary-700 hover:text-primary-900">
            Looking for a certificate that is not listed? Check your assessments.
          </Link>
        </div>
      ) : null}
    </>
  );
}
