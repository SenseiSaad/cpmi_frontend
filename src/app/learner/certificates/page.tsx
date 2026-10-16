"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Share2,
  Calendar,
  FileText,
} from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { LearnerSidebar } from "@/components/layout/SidebarNav";
import Logo from "@/components/shared/Logo";
import { certificates } from "@/lib/data";

export default function CertificatesPage() {
  const [activeCert, setActiveCert] = useState(certificates[0]);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardShell
      sidebar={<LearnerSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
            Official Certificates
          </h1>
          <p className="text-xs text-gray-500">
            Accredited credentials and verified compliance records
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Certificate Display Workspace (Matching Screen 6) */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: THE OFFICIAL CERTIFICATE CANVAS (Screen 6 Direct Reference) */}
          <div className="lg:col-span-9 bg-white rounded-3xl border border-gray-200/90 shadow-lg p-6 sm:p-12 print:p-0 print:border-none print:shadow-none overflow-hidden relative">
            {/* Elegant Double Border with Gold Inset */}
            <div className="border-4 border-double border-[#CFB112]/50 p-6 sm:p-10 rounded-2xl relative bg-gradient-to-br from-amber-50/20 via-white to-emerald-50/15">
              {/* Corner Ornaments */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-secondary-500" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-secondary-500" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-secondary-500" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-secondary-500" />

              {/* Certificate Header */}
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <Logo size="md" />
                </div>
                <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-gray-400">
                  Certification Professionals Mastery Institute
                </p>

                <h2 className="text-2xl sm:text-4xl font-serif font-black text-primary-950 tracking-wider pt-4">
                  CERTIFICATE OF COMPLETION
                </h2>
                <p className="text-xs text-gray-500 italic">This certifies that</p>
              </div>

              {/* Recipient Name (Sarah Johnson Reference) */}
              <div className="text-center my-6">
                <span className="text-3xl sm:text-4xl font-serif font-black text-gray-900 border-b-2 border-secondary-500 pb-1 px-8 inline-block">
                  {activeCert.recipientName}
                </span>
              </div>

              {/* Body Citation */}
              <div className="text-center max-w-xl mx-auto space-y-2">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  has successfully completed all requirements, statutory assessments, and comprehensive examinations for the
                </p>
                <p className="text-base sm:text-lg font-black text-primary-900 leading-tight">
                  {activeCert.courseName}
                </p>
              </div>

              {/* Details & Signature Footer with Gold Seal */}
              <div className="mt-12 pt-8 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Left Metadata */}
                <div className="text-left space-y-1.5 text-xs text-gray-600">
                  <p>
                    <span className="font-bold text-gray-400 uppercase text-[10px] block">Certificate ID:</span>
                    <span className="font-mono font-bold text-primary-900">{activeCert.id}</span>
                  </p>
                  <p>
                    <span className="font-bold text-gray-400 uppercase text-[10px] block">Issue Date:</span>
                    <span className="font-semibold text-gray-800">{activeCert.issueDate}</span>
                  </p>
                  <p>
                    <span className="font-bold text-gray-400 uppercase text-[10px] block">Expiry Date:</span>
                    <span className="font-semibold text-gray-800">{activeCert.expiryDate}</span>
                  </p>
                </div>

                {/* Center Gold Seal (Embossed CPMI Monogram) */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#b09208] via-[#CFB112] to-[#f4eb8a] p-1 shadow-md flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-dashed border-[#8c710a] flex flex-col items-center justify-center bg-[#CFB112] text-primary-950 shadow-inner">
                      <Award size={20} className="text-primary-950" />
                      <span className="text-[10px] font-black tracking-widest uppercase mt-0.5">CPMI</span>
                      <span className="text-[7px] font-bold tracking-wider uppercase opacity-80">SEAL</span>
                    </div>
                  </div>
                </div>

                {/* Right Signature */}
                <div className="text-center sm:text-right space-y-1">
                  <div className="font-serif italic text-xl font-bold text-primary-900 pb-1">
                    J. M. Franklin
                  </div>
                  <div className="w-40 h-px bg-gray-300 mx-auto sm:ml-auto" />
                  <p className="text-[10px] font-bold uppercase text-gray-500">Authorized Signature</p>
                  <p className="text-[9px] text-gray-400">Executive Director, CPMI</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ACTION CONTROLS (Screen 6 Direct Reference) */}
          <div className="lg:col-span-3 space-y-4 print:hidden">
            <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Certificate Actions
              </h3>

              {/* Download PDF (Green Primary Button) */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 bg-[#152A13] hover:bg-primary-800 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <Download size={15} className="text-secondary-400" />
                <span>{downloading ? "Preparing PDF..." : "Download PDF"}</span>
              </button>

              {/* Print Certificate */}
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-all"
              >
                <Printer size={15} />
                <span>Print Certificate</span>
              </button>

              {/* Verify Certificate Link */}
              <Link
                href={`/verify/${activeCert.id}`}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-all"
              >
                <ShieldCheck size={15} className="text-highlight-600" />
                <span>Verify Certificate</span>
              </Link>
            </div>

            {/* Audit Status Card */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-5 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-black text-emerald-950">
                <CheckCircle size={15} className="text-highlight-600" />
                <span>Tamper-Resistant Credential</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                This certificate is officially recorded in the CPMI immutable compliance registry. Any third-party or government auditor can verify validity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
