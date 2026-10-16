"use client";

import { useState } from "react";
import { Settings, CreditCard, Shield, Plus, Download, CheckCircle, FileText, Building2 } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { AgencySidebar } from "@/components/layout/SidebarNav";

export default function AgencySettingsPage() {
  const [totalSeats, setTotalSeats] = useState(12);
  const [agencyName, setAgencyName] = useState("Texas Department of Transportation (TxDOT)");
  const [poNumber, setPoNumber] = useState("TXDOT-PO-2026-8841");
  const [billingContact, setBillingContact] = useState("procurement@txdot.gov");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardShell
      sidebar={<AgencySidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
            Agency Seats & Invoicing
          </h1>
          <p className="text-xs text-gray-500">
            Manage licensed employee seats, Stripe Billing, and Purchase Order (PO) invoicing
          </p>
        </div>
      }
    >
      <div className="max-w-4xl space-y-6">
        {/* Seat Licensing Overview */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-secondary-600 uppercase tracking-wider bg-secondary-50 px-2.5 py-0.5 rounded-full border border-secondary-200">
                Seat Pool License
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-2">
                Licensed Seat Allocation
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Seats can be freely reassigned to new agency personnel when staff turn over.
              </p>
            </div>

            <button
              onClick={() => {
                setTotalSeats((prev) => prev + 5);
                alert("Added 5 additional seats via Stripe PO Invoice.");
              }}
              className="inline-flex items-center gap-1.5 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              <Plus size={14} className="text-secondary-400" />
              <span>Purchase Additional Seats</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total Licensed</span>
              <p className="text-3xl font-black text-primary-950 mt-0.5">{totalSeats}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Assigned Staff</span>
              <p className="text-3xl font-black text-gray-900 mt-0.5">5</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Available Slots</span>
              <p className="text-3xl font-black text-highlight-600 mt-0.5">{totalSeats - 5}</p>
            </div>
          </div>
        </div>

        {/* PO-Based Stripe Invoicing Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">
            Government Purchase Order & Billing
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Agency Name</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Active PO Number</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Procurement Email</label>
                <input
                  type="email"
                  value={billingContact}
                  onChange={(e) => setBillingContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Payment Method</label>
                <div className="px-3.5 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} className="text-secondary-600" /> Stripe PO Invoicing (Net 30)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Invoices and receipts are automatically synced with your Stripe account.
              </span>
              <button
                type="submit"
                className="bg-[#152A13] hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
              >
                {saved ? "Saved ✓" : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
