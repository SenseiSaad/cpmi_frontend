"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, HelpCircle, Menu, X, Shield } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { useSession } from "@/features/auth/session-context";
import { useAgency } from "@/features/auth/agency-context";
import { ROLE_LABELS } from "@/features/auth/roles";

interface DashboardShellProps {
  children: ReactNode;
  sidebar: ReactNode;
  headerContent?: ReactNode;
}

export default function DashboardShell({
  children,
  sidebar,
  headerContent,
}: DashboardShellProps) {
  const router = useRouter();
  const { user, signOut } = useSession();
  const { activeAgency } = useAgency();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const firstName = user?.first_name || user?.email || "";
  const lastName = user?.last_name || "";
  const primaryRole = user?.roles[0];
  const roleDisplay = [primaryRole ? ROLE_LABELS[primaryRole] : "", activeAgency?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Dark Forest Green Executive Sidebar (Screens 3, 4, 7, 8 Reference) */}
      <aside
        className={`w-64 min-h-screen bg-[#152A13] text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out border-r border-[#1e3b1c] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="focus:outline-none">
            <Logo variant="light" size="sm" />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/70 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation Links (Passed via props) */}
        <div className="flex-1 overflow-y-auto py-4">{sidebar}</div>

        {/* Bottom Actions: Help & Support + Log Out (Matching Reference Screens) */}
        <div className="px-4 py-4 border-t border-white/10 space-y-1 mt-auto">
          <Link
            href="/#overview"
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <HelpCircle size={16} className="text-secondary-400" />
            <span>Help & Support</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-xl transition-colors text-left"
          >
            <LogOut size={16} className="text-red-400" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        {/* Sticky Executive Top Bar */}
        <header className="bg-white border-b border-gray-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              <Menu size={20} />
            </button>
            {headerContent ? (
              headerContent
            ) : (
              <div className="hidden sm:block">
                <span className="text-xs font-bold text-secondary-600 uppercase tracking-wider bg-secondary-50 px-2.5 py-0.5 rounded-md border border-secondary-200">
                  CPMI Compliance Portal
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-xl text-gray-500 hover:text-primary-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="View notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            <div className="h-5 w-px bg-gray-200 hidden sm:block" />

            {/* User Profile Pill with Avatar (Direct Reference Design) */}
            <div className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
              <div className="w-8 h-8 rounded-full bg-primary-900 text-secondary-400 font-bold flex items-center justify-center text-xs shadow-xs border border-secondary-500/30">
                {(firstName[0] ?? "").toUpperCase()}
                {(lastName[0] ?? "").toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {firstName} {lastName}
                </p>
                <p className="text-[10px] text-gray-500 font-medium capitalize">
                  {roleDisplay}
                </p>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
