"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  TrendingUp,
  Building2,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  Award,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardShell from "@/components/layout/DashboardShell";
import { AdminSidebar } from "@/components/layout/SidebarNav";
import Card from "@/components/ui/Card";
import { adminStats, agencies, revenueData, topAgenciesData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState("Apr 1, 2026 - Apr 30, 2026");

  const adminHeader = (
    <div className="flex items-center gap-4">
      <div>
        <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
          Super Admin Dashboard
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Platform-wide telemetry, multi-agency subscriptions, and accreditation metrics
        </p>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700">
        <Calendar size={13} className="text-secondary-600" />
        <span>{dateRange}</span>
      </div>
    </div>
  );

  const kpis = [
    {
      label: "Total Revenue",
      value: formatCurrency(adminStats.totalRevenue),
      trend: `+${adminStats.revenueGrowth}%`,
      icon: DollarSign,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Enrollments",
      value: adminStats.totalLearners.toLocaleString(),
      trend: `+${adminStats.learnersGrowth}%`,
      icon: Users,
      color: "text-primary-700",
      bg: "bg-primary-50",
    },
    {
      label: "Course Completion",
      value: `${adminStats.completionRate}%`,
      trend: `+${adminStats.completionChange}%`,
      icon: TrendingUp,
      color: "text-secondary-700",
      bg: "bg-secondary-50",
    },
    {
      label: "Total Agencies",
      value: adminStats.totalAgencies,
      trend: `+${adminStats.agenciesChange}%`,
      icon: Building2,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
  ];

  return (
    <DashboardShell sidebar={<AdminSidebar />} headerContent={adminHeader}>
      <div className="space-y-8">
        {/* TOP 4 KPI CARDS (Screen 7 Direct Reference) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {kpis.map(({ label, value, trend, icon: Icon, color, bg }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500">{label}</span>
                <span className="text-xs font-bold text-highlight-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {trend}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">{value}</p>
            </motion.div>
          ))}
        </div>

        {/* CHARTS ROW: Revenue Overview (Left 8 Cols) & Top Agencies (Right 4 Cols) */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Revenue Overview (Screen 7 Reference) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-black text-gray-900">Revenue Overview</h2>
                <p className="text-xs text-gray-500 mt-0.5">Stripe Card & PO Invoicing trends (Jan – Dec)</p>
              </div>
              <span className="text-xs font-bold text-secondary-600 bg-secondary-50 px-2.5 py-1 rounded-lg">
                FY 2026
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2A5025" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2A5025" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2A5025"
                    strokeWidth={3}
                    fill="url(#revenueGreen)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Agencies Breakdown (Screen 7 Reference: Texas DOT 342, Caltrans 298, FDOT 187...) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-black text-gray-900">Top Agencies</h2>
              <span className="text-xs text-gray-400 font-medium">Enrolled</span>
            </div>

            <div className="space-y-3.5">
              {topAgenciesData.map((agency) => (
                <div key={agency.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: agency.fill }}
                    />
                    <span className="font-bold text-gray-800">{agency.name}</span>
                  </div>
                  <span className="font-black text-gray-900 text-sm">{agency.learners}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Link
                href="/admin/agencies"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-primary-700 hover:text-primary-900 bg-primary-50 rounded-xl transition-colors"
              >
                <span>View All 12 Government Agencies</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* AGENCY ROSTER TABLE */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-black text-gray-900">Active Agency Subscriptions</h3>
              <p className="text-xs text-gray-500">Tenant-isolated instances with strict agencyId scoping</p>
            </div>
            <button
              onClick={() => alert("Exporting all agency reports...")}
              className="inline-flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <Download size={14} /> Export CSV Ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="pb-3">Agency Name</th>
                  <th className="pb-3">Learners Enrolled</th>
                  <th className="pb-3">Licensed Seats</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Onboarded</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {agencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 font-bold text-gray-900">{agency.name}</td>
                    <td className="py-3.5">{agency.learners}</td>
                    <td className="py-3.5">{agency.seats}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-highlight-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <CheckCircle size={10} /> {agency.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-400">{agency.joined}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => alert(`Managing agency: ${agency.name}`)}
                        className="text-primary-700 hover:text-primary-900 font-bold hover:underline"
                      >
                        Manage
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
