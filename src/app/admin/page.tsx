"use client";

import { Building2, DollarSign, GraduationCap, TrendingUp } from "lucide-react";
import Link from "next/link";

import { AreaChart } from "@/components/charts/charts";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusPill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useAgencies, useAllOrders, useKpis } from "@/lib/api/hooks";
import type { AgencySummary, Order } from "@/lib/api/types";
import { formatCurrency, formatNumber, relativeDays } from "@/lib/utils";

const agencyColumns: Column<AgencySummary>[] = [
  {
    key: "name",
    header: "Agency",
    width: "minmax(0,2fr)",
    cell: (a) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink-900">{a.displayName}</p>
        <p className="truncate text-xs text-ink-600">{a.slug}</p>
      </div>
    ),
  },
  { key: "members", header: "Members", width: "100px", align: "right", cell: (a) => <span className="tnum font-semibold">{formatNumber(a.memberCount)}</span> },
  { key: "seats", header: "Seats used", width: "110px", align: "right", cell: (a) => <span className="tnum font-semibold">{formatNumber(a.seatsUsed)}</span> },
  { key: "status", header: "Status", width: "120px", cell: (a) => <StatusPill status={a.status} /> },
  { key: "created", header: "Onboarded", width: "130px", cell: (a) => <span className="text-ink-600">{a.createdAt ? relativeDays(a.createdAt) : "—"}</span> },
];

const orderColumns: Column<Order>[] = [
  {
    key: "order",
    header: "Order",
    width: "minmax(0,1.6fr)",
    cell: (o) => (
      <div>
        <p className="font-semibold text-ink-900">{o.item?.productName ?? "Order"}</p>
        <p className="font-mono text-xs text-ink-600">{o.publicId.slice(0, 13)}…</p>
      </div>
    ),
  },
  { key: "agency", header: "Agency", width: "minmax(0,1.2fr)", cell: (o) => <span className="truncate text-ink-700">{o.agencyName ?? "—"}</span> },
  { key: "total", header: "Total", width: "100px", align: "right", cell: (o) => <span className="tnum font-semibold">{formatCurrency(o.totalMinor / 100)}</span> },
  { key: "status", header: "Status", width: "110px", cell: (o) => <StatusPill status={o.status} /> },
  { key: "created", header: "Created", width: "120px", cell: (o) => <span className="text-ink-600">{o.createdAt ? relativeDays(o.createdAt) : "—"}</span> },
];

export default function AdminDashboardPage() {
  const kpis = useKpis();
  const agencies = useAgencies({ limit: 5 });
  const orders = useAllOrders({ limit: 5 });

  const series = (kpis.data?.revenueSeries ?? []).map((point) => ({
    label: point.label.slice(5) === "" ? point.label : new Date(`${point.label}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short" }),
    value: point.value / 100,
  }));

  const topAgencies = [...(agencies.data?.items ?? [])].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Operations overview"
        subtitle="Platform-wide revenue, agency activity and learner outcomes."
        actions={<ButtonLink href="/admin/reports" variant="secondary">View reports</ButtonLink>}
      />

      {kpis.isError ? (
        <Panel><ErrorState message={kpis.error instanceof Error ? kpis.error.message : undefined} onRetry={() => void kpis.refetch()} /></Panel>
      ) : kpis.isPending || !kpis.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Paid revenue" value={formatCurrency(kpis.data.revenueMinor / 100)} hint={`${kpis.data.revenueDeltaPct >= 0 ? "+" : ""}${kpis.data.revenueDeltaPct}% month over month`} icon={DollarSign} tone="ok" />
          <StatCard label="Enrollments" value={formatNumber(kpis.data.activeLearners)} hint="Across every agency" icon={GraduationCap} tone="brand" />
          <StatCard label="Completion rate" value={`${kpis.data.completionRate}%`} hint={`${kpis.data.passRate}% assessment pass rate`} icon={TrendingUp} tone="info" />
          <StatCard label="Agencies" value={formatNumber(kpis.data.agencies)} hint="Active tenants on the platform" icon={Building2} tone="navy" />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelHeader
            title="Revenue"
            description="Paid orders over the last twelve months."
            action={<Badge tone="brand">USD</Badge>}
          />
          {kpis.isPending ? <Skeleton className="h-56 w-full" /> : <AreaChart data={series} ariaLabel="Monthly paid revenue" format={(n) => formatCurrency(n)} />}
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelHeader title="Top agencies" description="By active members." action={<Link href="/admin/agencies" className="text-sm font-semibold text-brand-700 hover:text-brand-800">View all</Link>} />
          {agencies.isPending ? (
            <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : agencies.isError ? (
            <ErrorState message={agencies.error instanceof Error ? agencies.error.message : undefined} onRetry={() => void agencies.refetch()} />
          ) : topAgencies.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-600">No agencies yet.</p>
          ) : (
            <ol className="space-y-3">
              {topAgencies.map((agency, index) => (
                <li key={agency.publicId} className="flex items-center gap-3">
                  <span className="tnum grid size-7 shrink-0 place-items-center rounded-lg bg-navy-900/[0.06] text-xs font-bold text-navy-800">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{agency.displayName}</p>
                    <p className="truncate text-xs text-ink-600">{agency.status}</p>
                  </div>
                  <span className="tnum text-sm font-bold text-ink-900">{formatNumber(agency.memberCount)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelHeader
          title="Recent orders"
          description="Latest purchases across agencies."
          action={<Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:text-brand-800">All orders</Link>}
        />
        <DataTable
          caption="Recent platform orders"
          columns={orderColumns}
          rows={orders.data?.items}
          rowKey={(o) => o.publicId}
          loading={orders.isPending}
          error={orders.isError ? (orders.error instanceof Error ? orders.error.message : "Could not load orders.") : undefined}
          onRetry={() => void orders.refetch()}
          empty={{ title: "No orders yet", description: "Seat purchases will appear here." }}
        />
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="Agency subscriptions"
          description="Tenant-isolated agencies with their current seat usage."
          action={<ButtonLink href="/admin/agencies" variant="secondary" size="sm">Manage agencies</ButtonLink>}
        />
        <DataTable
          caption="Recent agencies"
          columns={agencyColumns}
          rows={agencies.data?.items}
          rowKey={(a) => a.publicId}
          loading={agencies.isPending}
          error={agencies.isError ? (agencies.error instanceof Error ? agencies.error.message : "Could not load agencies.") : undefined}
          onRetry={() => void agencies.refetch()}
          empty={{ title: "No agencies yet" }}
        />
      </Panel>
    </>
  );
}
