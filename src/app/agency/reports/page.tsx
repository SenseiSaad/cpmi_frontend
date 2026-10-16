"use client";

import { useState } from "react";
import { BarChart3, Download, FileSpreadsheet, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { AgencySidebar } from "@/components/layout/SidebarNav";
import { agencyMembers } from "@/lib/data";

export default function AgencyReportsPage() {
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      window.print();
    }, 600);
  };

  return (
    <DashboardShell
      sidebar={<AgencySidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
            Agency Compliance Reports
          </h1>
          <p className="text-xs text-gray-500">
            Exportable team training transcripts and federal audit compliance packages
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Export Action Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900">FHWA / FTA Triennial Audit Package</span>
              <span className="text-[10px] bg-emerald-50 text-highlight-600 font-bold px-2 py-0.5 rounded-full">
                Audit Ready
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Includes individual employee scores, module completion timestamps, and certificate verification hashes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Downloading team roster CSV...")}
              className="inline-flex items-center gap-2 border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              <Download size={14} className="text-secondary-400" />
              <span>{exporting ? "Generating PDF..." : "Export Official PDF"}</span>
            </button>
          </div>
        </div>

        {/* Detailed Team Compliance Ledger Table */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">
            Team Member Compliance Records
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">Staff Member</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Completed Modules</th>
                  <th className="pb-3">Overall Progress</th>
                  <th className="pb-3">Exam Score</th>
                  <th className="pb-3">Certificate ID</th>
                  <th className="pb-3 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {agencyMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900">{m.name}</td>
                    <td className="py-4 font-mono text-[11px] text-gray-500">{m.email}</td>
                    <td className="py-4 font-semibold text-gray-800">
                      {m.progress === 100 ? "11 of 11 Modules" : m.progress > 0 ? "4 of 11 Modules" : "0 of 11 Modules"}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.progress === 100 ? "bg-highlight-500" : "bg-secondary-500"
                            }`}
                            style={{ width: `${m.progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px]">{m.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 font-bold text-gray-900">
                      {m.progress === 100 ? "96%" : m.progress > 0 ? "88%" : "Pending"}
                    </td>
                    <td className="py-4 font-mono text-[11px] text-primary-900 font-bold">
                      {m.progress === 100 ? "CPMI-2026-000089" : "In Progress"}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === "Active" ? "bg-emerald-50 text-highlight-600" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
