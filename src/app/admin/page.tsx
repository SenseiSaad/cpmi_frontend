"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Building2, ExternalLink, ShieldAlert, Tags } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/shared/QueryState";
import { platformApi } from "@/features/platform/api";
import { CompletionPanel, OverviewTiles, PassRatePanel, RevenuePanel } from "@/features/platform/reports";
import { AdminPage, money, Panel, StatTile } from "@/features/platform/ui";

const QUICK_LINKS = [
  { href: "/admin/agencies", label: "Agencies", desc: "Provision agencies and invite admins", icon: Building2 },
  { href: "/admin/courses", label: "Catalog authoring", desc: "Courses, modules, lessons, assessments", icon: BookOpen },
  { href: "/admin/products", label: "Products & pricing", desc: "Link content, activate, set prices", icon: Tags },
  { href: "/admin/audit", label: "Audit log", desc: "Immutable record of state changes", icon: ShieldAlert }
];

export default function AdminDashboardPage() {
  const stats = useQuery({ queryKey: ["platform", "stats"], queryFn: () => platformApi.stats() });

  return (
    <AdminPage title="Platform Dashboard" subtitle="Platform-wide agencies, catalog, revenue and accreditation metrics">
      {stats.isPending ? (
        <LoadingState label="Loading platform statistics…" />
      ) : stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatTile label="Total agencies" value={stats.data.agencies_total ?? 0} hint={`${stats.data.agencies_active ?? 0} active`} />
          <StatTile label="Published courses" value={stats.data.courses_published ?? 0} />
          <StatTile label="Enrollments" value={(stats.data.enrollments_total ?? 0).toLocaleString()} hint={`${stats.data.products_total ?? 0} products`} />
          <StatTile label="Total revenue" value={money(stats.data.revenue_cents ?? 0)} />
        </div>
      )}

      <OverviewTiles />

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <RevenuePanel />
        </div>
        <div className="lg:col-span-4">
          <Panel title="Quick actions">
            <div className="space-y-2.5">
              {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-primary-50 transition-colors"
                >
                  <span className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-800">
                    <Icon size={16} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-xs font-bold text-gray-900">{label}</span>
                    <span className="block text-[11px] text-gray-500">{desc}</span>
                  </span>
                  <ExternalLink size={13} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <CompletionPanel limit={8} />
        <PassRatePanel limit={8} />
      </div>
    </AdminPage>
  );
}
