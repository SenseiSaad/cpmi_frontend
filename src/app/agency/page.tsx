"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  LayoutDashboard,
  BarChart3,
  Settings,
  Search,
  Upload,
  UserPlus,
  MoreVertical,
  CheckCircle,
  Clock,
  X,
  FileSpreadsheet,
  Check,
  Mail,
  User,
  Shield,
  Download,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { AgencySidebar } from "@/components/layout/SidebarNav";
import { agencyMembers as initialMembers, AgencyMember } from "@/lib/data";

export default function AgencyDashboardPage() {
  const [members, setMembers] = useState<AgencyMember[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [selectedActionMember, setSelectedActionMember] = useState<AgencyMember | null>(null);

  // Invite Form State
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Learner");

  // CSV State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvUploaded, setCsvUploaded] = useState(false);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newMember: AgencyMember = {
      id: `mem_${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      progress: 0,
      status: "Pending",
      enrolled: "Just now",
    };

    setMembers([newMember, ...members]);
    setInviteName("");
    setInviteEmail("");
    setShowInviteModal(false);
  };

  const handleCsvUpload = () => {
    if (!csvFileName) return;
    setCsvUploaded(true);
    setTimeout(() => {
      // Simulate adding 3 bulk onboarded members
      const bulkUsers: AgencyMember[] = [
        { id: `csv_1`, name: "Anthony Clark", email: "anthony@agency.com", role: "Learner", progress: 0, status: "Pending", enrolled: "Bulk CSV" },
        { id: `csv_2`, name: "Maria Garcia", email: "maria@agency.com", role: "Learner", progress: 0, status: "Pending", enrolled: "Bulk CSV" },
      ];
      setMembers([...bulkUsers, ...members]);
      setCsvUploaded(false);
      setShowCsvModal(false);
      setCsvFileName(null);
    }, 1000);
  };

  const agencyHeader = (
    <div>
      <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
        Team Management
      </h1>
      <p className="text-xs text-gray-500 font-medium">
        Texas Department of Transportation (TxDOT) • 12 Available Licensed Seats
      </p>
    </div>
  );

  return (
    <DashboardShell sidebar={<AgencySidebar />} headerContent={agencyHeader}>
      <div className="space-y-6">
        {/* TEAM STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Assigned Seats", value: members.length, sub: "5 of 12 Used", color: "text-primary-700", bg: "bg-primary-50" },
            { label: "Active Learners", value: members.filter((m) => m.status === "Active").length, sub: "In Compliance Training", color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Avg Progress", value: "48%", sub: "+6% This Month", color: "text-secondary-700", bg: "bg-secondary-50" },
            { label: "Available Seats", value: "7", sub: "Ready for Reassignment", color: "text-blue-700", bg: "bg-blue-50" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">{item.label}</span>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{item.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* TEAM MANAGEMENT TOOLBAR (Screen 8 Direct Reference) */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* Action Buttons (Screen 8: Invite Users & Upload CSV) */}
            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <UserPlus size={14} className="text-secondary-400" />
                <span>Invite Users</span>
              </button>

              <button
                onClick={() => setShowCsvModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-all focus:outline-none"
              >
                <Upload size={14} />
                <span>Upload CSV</span>
              </button>
            </div>
          </div>

          {/* TEAM MEMBERS TABLE (Screen 8 Direct Reference) */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="pb-3.5 pl-2">Name</th>
                  <th className="pb-3.5">Email</th>
                  <th className="pb-3.5">Role</th>
                  <th className="pb-3.5 w-48">Progress</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* User Name with Avatar */}
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-900 text-secondary-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">
                          {member.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 font-mono text-[11px] text-gray-500">
                      {member.email}
                    </td>

                    {/* Role */}
                    <td className="py-4">
                      <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-md text-[10px]">
                        {member.role}
                      </span>
                    </td>

                    {/* Progress Bar + % (Screen 8 Reference) */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              member.progress === 100
                                ? "bg-highlight-500"
                                : member.progress > 0
                                ? "bg-secondary-500"
                                : "bg-transparent"
                            }`}
                            style={{ width: `${member.progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-800 text-[11px] w-8 text-right">
                          {member.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Status Pill (Active / Pending) */}
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          member.status === "Active"
                            ? "bg-emerald-50 text-highlight-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.status === "Active" ? "bg-highlight-500" : "bg-amber-500"
                          }`}
                        />
                        {member.status}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => setSelectedActionMember(member)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Member Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMembers.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400">
                No team members match your search query.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVITE USERS MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>

              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
                <UserPlus size={20} />
              </div>

              <h3 className="text-lg font-black text-gray-900">Invite Team Member</h3>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                Assign an authorized agency seat. An activation invitation link will be sent to their government email.
              </p>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Agency Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. marcus.vance@txdot.gov"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-500 bg-white"
                  >
                    <option value="Learner">Learner (Full 11 Modules)</option>
                    <option value="Agency Coordinator">Agency Coordinator</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#152A13] hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK CSV UPLOAD MODAL (Dev Spec Section 4.4 Reference) */}
      <AnimatePresence>
        {showCsvModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowCsvModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>

              <div className="w-10 h-10 rounded-xl bg-secondary-50 text-secondary-800 flex items-center justify-center mb-4">
                <FileSpreadsheet size={20} />
              </div>

              <h3 className="text-lg font-black text-gray-900">Bulk User CSV Onboarding</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Onboard 15+ staff at once. Upload a CSV with columns: <code>name, email, role</code>.
              </p>

              <div
                onClick={() => setCsvFileName("txdot-civil-rights-cohort-2026.csv")}
                className="border-2 border-dashed border-gray-300 hover:border-primary-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50"
              >
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                {csvFileName ? (
                  <p className="text-xs font-bold text-primary-900">{csvFileName}</p>
                ) : (
                  <>
                    <p className="text-xs font-bold text-gray-700">Click to select CSV roster file</p>
                    <p className="text-[10px] text-gray-400 mt-1">UTF-8 format, max 2MB</p>
                  </>
                )}
              </div>

              <div className="pt-6 flex items-center justify-between">
                <button
                  onClick={() => alert("Downloading CSV roster template...")}
                  className="text-xs font-bold text-secondary-600 hover:underline flex items-center gap-1"
                >
                  <Download size={13} /> Sample CSV Template
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="px-3 py-2 text-xs font-bold text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCsvUpload}
                    disabled={!csvFileName || csvUploaded}
                    className="bg-[#152A13] hover:bg-primary-800 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs"
                  >
                    {csvUploaded ? "Importing Roster..." : "Upload & Invite"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEMBER ACTION SHEET / MODAL */}
      <AnimatePresence>
        {selectedActionMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="text-sm font-black text-gray-900">Manage Seat: {selectedActionMember.name}</h4>
                <button
                  onClick={() => setSelectedActionMember(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => {
                    alert(`Seat for ${selectedActionMember.name} reassigned to an available pool slot.`);
                    setSelectedActionMember(null);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 font-bold text-primary-900 border border-gray-100"
                >
                  🔄 Reassign Seat to New Staff Member
                </button>
                <button
                  onClick={() => {
                    alert(`Invitation resent to ${selectedActionMember.email}.`);
                    setSelectedActionMember(null);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 font-bold text-gray-700 border border-gray-100"
                >
                  ✉️ Resend Activation Email
                </button>
                <button
                  onClick={() => {
                    alert(`Exporting individual compliance transcript for ${selectedActionMember.name}.`);
                    setSelectedActionMember(null);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 font-bold text-gray-700 border border-gray-100"
                >
                  📄 Export Compliance Audit Transcript
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
