"use client";

import { useState } from "react";
import { Building2, Search, Plus, Download, CheckCircle, Mail, ExternalLink, Shield } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { AdminSidebar } from "@/components/layout/SidebarNav";
import { agencies as initialAgencies } from "@/lib/data";

export default function AdminAgenciesPage() {
  const [agenciesList, setAgenciesList] = useState(initialAgencies);
  const [search, setSearch] = useState("");

  const filtered = agenciesList.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell
      sidebar={<AdminSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
            Government Agencies Directory
          </h1>
          <p className="text-xs text-gray-500">
            Tenant management, seat allocation, and PO invoicing for state & federal DOTs
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search agencies or contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Add Agency Onboarding Modal")}
              className="inline-flex items-center gap-2 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
            >
              <Plus size={14} className="text-secondary-400" />
              <span>Onboard New Agency</span>
            </button>
            <button
              onClick={() => alert("Exporting agency directory...")}
              className="inline-flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              <span>Export Roster</span>
            </button>
          </div>
        </div>

        {/* Agency Table */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">Agency Name</th>
                  <th className="pb-3">Point of Contact</th>
                  <th className="pb-3">Learners</th>
                  <th className="pb-3">Seat Pool</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Joined Date</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filtered.map((agency) => (
                  <tr key={agency.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900 text-xs sm:text-sm">
                      {agency.name}
                    </td>
                    <td className="py-4">
                      <span className="font-mono text-[11px] text-gray-500 flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" /> {agency.contact}
                      </span>
                    </td>
                    <td className="py-4 font-black text-primary-900 text-xs sm:text-sm">
                      {agency.learners}
                    </td>
                    <td className="py-4">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        {agency.seats} Seats
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-highlight-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <CheckCircle size={10} /> {agency.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">{agency.joined}</td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => alert(`Configuring agency tenant: ${agency.name}`)}
                        className="text-xs font-bold text-primary-700 hover:text-primary-900 hover:underline"
                      >
                        Configure
                      </button>
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
