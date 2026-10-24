"use client";

import { ArrowRight, MailPlus, Ticket, TrendingUp, UserPlus, Users } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusPill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useAgencyOverview, useAgencyReport, useOrders } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { formatCurrency, formatNumber, relativeDays } from "@/lib/utils";

export default function AgencyDashboardPage() {
  const { user } = useSession();
  const overview = useAgencyOverview(true);
  const report = useAgencyReport(true);
  const orders = useOrders({ limit: 5 });

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title={user?.agency?.displayName ?? "Agency overview"}
        subtitle="Membership, seat usage and recent purchases for your agency."
        actions={
          <>
            <ButtonLink href="/agency/store" variant="primary" icon={<Ticket className="size-4" aria-hidden />}>Buy seats</ButtonLink>
            <ButtonLink href="/agency/members" variant="secondary" icon={<UserPlus className="size-4" aria-hidden />}>Invite member</ButtonLink>
          </>
        }
      />

      {overview.isError ? (
        <Panel><ErrorState message={overview.error instanceof Error ? overview.error.message : undefined} onRetry={() => void overview.refetch()} /></Panel>
      ) : overview.isPending || !overview.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active members" value={formatNumber(overview.data.members)} hint="Learners and administrators" icon={Users} tone="brand" />
          <StatCard label="Pending invitations" value={formatNumber(overview.data.pending_invitations)} hint="Awaiting acceptance" icon={MailPlus} tone="warn" />
          <StatCard label="Available seats" value={formatNumber(overview.data.seats_available)} hint="Ready to assign" icon={Ticket} tone="ok" />
          <StatCard label="Orders (30 days)" value={formatNumber(overview.data.recent_orders)} hint="Purchases and invoices" icon={TrendingUp} tone="info" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-5">
          <PanelHeader
            title="Training activity"
            description="Enrollment and assessment outcomes for your team."
            action={<Link href="/agency/reports" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Reports</Link>}
          />
          {report.isError ? (
            <ErrorState message={report.error instanceof Error ? report.error.message : undefined} onRetry={() => void report.refetch()} />
          ) : report.isPending || !report.data ? (
            <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-700">Enrollments</span>
                  <span className="tnum text-ink-600">{formatNumber(report.data.enrollments.completed)} / {formatNumber(report.data.enrollments.total)} completed</span>
                </div>
                <ProgressBar value={report.data.enrollments.completionPercent ?? 0} label="Enrollment completion" showValue />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-canvas-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Pass rate</p>
                  <p className="tnum mt-1 text-2xl font-extrabold text-ink-900">{report.data.assessments.passRatePercent === null ? "—" : `${report.data.assessments.passRatePercent}%`}</p>
                  <p className="text-xs text-ink-600">{formatNumber(report.data.assessments.graded)} graded attempts</p>
                </div>
                <div className="rounded-2xl bg-canvas-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Certificates</p>
                  <p className="tnum mt-1 text-2xl font-extrabold text-ink-900">{formatNumber(report.data.certificates.issued)}</p>
                  <p className="text-xs text-ink-600">{report.data.certificates.revoked} revoked</p>
                </div>
                <div className="rounded-2xl bg-canvas-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Seats assigned</p>
                  <p className="tnum mt-1 text-2xl font-extrabold text-ink-900">{formatNumber(report.data.seats.assigned)}</p>
                  <p className="text-xs text-ink-600">of {formatNumber(report.data.seats.capacity)}</p>
                </div>
                <div className="rounded-2xl bg-canvas-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Avg. score</p>
                  <p className="tnum mt-1 text-2xl font-extrabold text-ink-900">{report.data.assessments.averageScorePercent === null ? "—" : `${report.data.assessments.averageScorePercent}%`}</p>
                  <p className="text-xs text-ink-600">{formatNumber(report.data.assessments.attempts)} attempts</p>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel className="lg:col-span-7">
          <PanelHeader
            title="Recent orders"
            description="Seat purchases and invoices for this agency."
            action={<Link href="/agency/orders" className="text-sm font-semibold text-brand-700 hover:text-brand-800">All orders</Link>}
          />
          {orders.isError ? (
            <ErrorState message={orders.error instanceof Error ? orders.error.message : undefined} onRetry={() => void orders.refetch()} />
          ) : orders.isPending ? (
            <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (orders.data?.items.length ?? 0) === 0 ? (
            <div className="rounded-2xl bg-canvas-soft p-8 text-center">
              <p className="text-sm font-semibold text-ink-900">No orders yet</p>
              <p className="mt-1 text-sm text-ink-600">Buy seats to onboard your team.</p>
              <ButtonLink href="/agency/store" variant="primary" size="sm" className="mt-4" icon={<ArrowRight className="size-4" aria-hidden />}>Visit the store</ButtonLink>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {orders.data?.items.map((order) => (
                <li key={order.publicId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{order.item?.productName ?? "Order"}</p>
                    <p className="truncate font-mono text-xs text-ink-600">{order.publicId}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tnum text-sm font-semibold text-ink-900">{formatCurrency(order.totalMinor / 100)}</span>
                    <StatusPill status={order.status} />
                    <span className="text-xs text-ink-500">{order.createdAt ? relativeDays(order.createdAt) : ""}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="navy">Seat pool licence</Badge>
            <Badge tone="brand">Agency-scoped data</Badge>
          </div>
        </Panel>
      </div>
    </>
  );
}
