"use client";

import { useState } from "react";
import { Settings, DollarSign, Video, Mail, Shield, Check, Save } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { AdminSidebar } from "@/components/layout/SidebarNav";

export default function AdminSettingsPage() {
  const [annualSeatPrice, setAnnualSeatPrice] = useState("1495");
  const [modulePrice, setModulePrice] = useState("175");
  const [stripeConnected, setStripeConnected] = useState(true);
  const [vimeoConfigured, setVimeoConfigured] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardShell
      sidebar={<AdminSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
            Platform Configuration & Integrations
          </h1>
          <p className="text-xs text-gray-500">
            Configure pricing, Stripe Invoicing, Vimeo OTT streaming, and email notifications
          </p>
        </div>
      }
    >
      <div className="max-w-4xl space-y-6">
        {/* Pricing Configuration */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">
            Curriculum & Seat Pricing (Stripe Billing)
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Full 11-Module Annual License ($/seat/year)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    value={annualSeatPrice}
                    onChange={(e) => setAnnualSeatPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Single Module / Monthly Enrolled Price ($/module)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    value={modulePrice}
                    onChange={(e) => setModulePrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Updates will take effect immediately across Stripe Checkout and Stripe Invoicing.
              </span>
              <button
                type="submit"
                className="bg-[#152A13] hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
              >
                {saved ? "Saved ✓" : "Update Pricing"}
              </button>
            </div>
          </form>
        </div>

        {/* Integration Services (From Developer Spec Section 2) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
            Third-Party Infrastructure Services
          </h2>

          <div className="space-y-3">
            {[
              {
                service: "Stripe Billing & Invoicing",
                desc: "Handles card payments and purchase order invoice flow for government buyers.",
                status: "Connected & Active",
                icon: DollarSign,
              },
              {
                service: "Vimeo OTT Video Streaming",
                desc: "High-definition video hosting with verified server-side watch tracking.",
                status: "API Connected",
                icon: Video,
              },
              {
                service: "Transactional Email (Postmark/SendGrid)",
                desc: "Automated student onboarding invites, completion notifications, and renewal alerts.",
                status: "Operational",
                icon: Mail,
              },
            ].map((item) => (
              <div
                key={item.service}
                className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-900">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{item.service}</h3>
                    <p className="text-[11px] text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-highlight-600 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
