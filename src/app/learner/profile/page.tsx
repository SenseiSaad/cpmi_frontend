"use client";

import { useState } from "react";
import { User, Mail, Building, Shield, Award, Clock, Save, Check } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { LearnerSidebar } from "@/components/layout/SidebarNav";

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("Sarah");
  const [lastName, setLastName] = useState("Johnson");
  const [email, setEmail] = useState("learner@agency.gov");
  const [agency, setAgency] = useState("Federal Transit Administration (FTA)");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardShell
      sidebar={<LearnerSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">Learner Profile</h1>
          <p className="text-xs text-gray-500">Manage your agency credentials, compliance hours, and security settings</p>
        </div>
      }
    >
      <div className="max-w-4xl space-y-6">
        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#152A13] text-secondary-400 font-black text-2xl flex items-center justify-center shadow-xs">
              SJ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900">{firstName} {lastName}</h2>
                <span className="text-[10px] font-bold text-highlight-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active Learner
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{email}</p>
              <p className="text-xs text-primary-700 font-bold mt-1">{agency}</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5 font-bold text-gray-700">
              <Award size={14} className="text-secondary-600" /> 1 Verified Certificate
            </span>
            <span className="flex items-center gap-1.5 font-bold text-gray-700">
              <Clock size={14} className="text-primary-600" /> 14.5 Lecture Hours Logged
            </span>
          </div>
        </div>

        {/* Profile Information Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">
            Official Agency Information
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Agency Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl text-xs sm:text-sm cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1">Managed by your agency administrator.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Affiliated Agency / DOT</label>
                <input
                  type="text"
                  value={agency}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl text-xs sm:text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              {saved ? (
                <span className="text-xs font-bold text-highlight-600 flex items-center gap-1.5">
                  <Check size={14} /> Profile preferences updated successfully.
                </span>
              ) : (
                <span className="text-xs text-gray-400">All certificates will be issued to this legal name.</span>
              )}

              <button
                type="submit"
                className="bg-[#152A13] hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Save size={13} className="text-secondary-400" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
