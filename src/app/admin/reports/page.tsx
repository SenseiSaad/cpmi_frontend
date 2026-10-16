"use client";

import { BarChart3, Download, TrendingUp, CheckCircle, Award, Shield, FileText } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { AdminSidebar } from "@/components/layout/SidebarNav";
import { modules, adminStats } from "@/lib/data";

export default function AdminReportsPage() {
  return (
    <DashboardShell
      sidebar={<AdminSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
            Accreditation & Analytics Reports
          </h1>
          <p className="text-xs text-gray-500">
            Module completion rates, exam pass/fail curves, and audit trails for Q2 2027 Accreditation
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
          <div>
            <span className="text-xs font-black text-gray-900">FHWA / FTA Compliance Audit Package</span>
            <p className="text-[11px] text-gray-500">Includes immutable verification hashes and timestamp logs</p>
          </div>
          <button
            onClick={() => alert("Generating Official Federal Accreditation Audit PDF...")}
            className="inline-flex items-center gap-2 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Download size={14} className="text-secondary-400" />
            <span>Generate Official Audit Report (PDF)</span>
          </button>
        </div>

        {/* Module Completion Rates Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">
            Module-Level Completion & Pass Distribution
          </h2>

          <div className="space-y-3.5">
            {modules.map((m) => {
              const passRate = 85 + (m.id % 12);
              return (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 sm:w-72">
                    <span className="w-8 h-8 rounded-lg bg-primary-900 text-secondary-400 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {m.code}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate">{m.title}</p>
                      <p className="text-[10px] text-gray-400">{m.regulatoryRef}</p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md mx-4">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                      <span>Pass Rate: {passRate}%</span>
                      <span>Target: &gt;80%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-highlight-500 h-full rounded-full" style={{ width: `${passRate}%` }} />
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full self-start sm:self-center">
                    Audited • Valid
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
