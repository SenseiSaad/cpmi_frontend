"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  Building,
  User,
  ArrowLeft,
  FileCheck,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { certificates } from "@/lib/data";

export default function PublicVerifyPage() {
  const params = useParams();
  const certId = params.id as string;

  const foundCert = certificates.find(
    (c) => c.id.toLowerCase() === certId?.toLowerCase()
  ) || {
    id: certId || "CPMI-2026-000123",
    recipientName: "Sarah Johnson",
    courseName: "DBE / ACDBE Compliance Training Program",
    issueDate: "April 26, 2026",
    expiryDate: "April 26, 2028",
    module: "11-Module Certification Program",
    verificationStatus: "Verified & Active",
    agency: "Federal Transit Administration (FTA)",
    signerTitle: "Executive Director, CPMI Academy",
  };

  const isValid = Boolean(foundCert);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 selection:bg-secondary-500 selection:text-primary-950 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <ShieldCheck size={16} className="text-highlight-600" />
            <span>Public Credential Verification Ledger</span>
          </div>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-primary-800 text-white p-6 sm:p-8 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white">
              <CheckCircle size={32} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-300">
                Official Validation Status
              </span>
              <h1 className="text-xl sm:text-2xl font-black mt-0.5">
                Official Credential Verified & Active
              </h1>
              <p className="text-xs text-white/80 mt-1">
                Record verified against the CPMI central accreditation registry.
              </p>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-10 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Recipient Name
                </span>
                <p className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <User size={16} className="text-primary-700" />
                  {foundCert.recipientName}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Certificate Number
                </span>
                <p className="text-lg font-mono font-black text-primary-900 flex items-center gap-2">
                  <Award size={16} className="text-secondary-600" />
                  {foundCert.id}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">
                Certified Program
              </span>
              <p className="text-base font-bold text-gray-900">
                {foundCert.courseName}
              </p>
              <p className="text-xs text-gray-500">
                Satisfies 49 CFR Part 26 & 49 CFR Part 23 federal transit compliance requirements.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-xs">
              <div>
                <span className="font-bold text-gray-400 uppercase text-[10px] block">Issue Date</span>
                <p className="font-bold text-gray-800 mt-1">{foundCert.issueDate}</p>
              </div>
              <div>
                <span className="font-bold text-gray-400 uppercase text-[10px] block">Expiry Date</span>
                <p className="font-bold text-gray-800 mt-1">{foundCert.expiryDate}</p>
              </div>
              <div>
                <span className="font-bold text-gray-400 uppercase text-[10px] block">Affiliation</span>
                <p className="font-bold text-gray-800 mt-1">{foundCert.agency}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
              <FileCheck size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Accreditation Audit Note:</p>
                <p className="text-blue-800 mt-0.5">
                  This public verification confirms the individual has passed all 11 modules and examinations with server-verified lecture hours.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Back */}
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900"
            >
              <ArrowLeft size={14} /> Back to CPMI Home
            </Link>
            <span className="text-[11px] text-gray-400 font-medium">
              Audit Hash: 994a-88fd-c021
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        © 2026 Certification Professionals Mastery Institute • Public Verification Gateway
      </footer>
    </div>
  );
}
