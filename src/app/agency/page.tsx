"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, ShoppingCart, BarChart3 } from "lucide-react";
import { agencyApi, agencyKeys, memberName, useAgencyMembers, useAgencyScope } from "@/features/agency/api";
import { AgencyPage, Panel, StatTile, StatusPill, ProgressBar, initials, primaryBtn, outlineBtn, thCls } from "@/features/agency/ui";
import { ErrorState, LoadingState, EmptyState } from "@/components/shared/QueryState";

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v)}%`);

export default function AgencyDashboardPage() {
  const { agencyId } = useAgencyScope();
  const reports = useQuery({
    queryKey: ["agency", agencyId, "reports"],
    queryFn: () => agencyApi.reportsOverview(agencyId as string),
    enabled: Boolean(agencyId)
  });
  const entitlements = useQuery({
    queryKey: agencyKeys.entitlements(agencyId),
    queryFn: () => agencyApi.entitlements(agencyId as string),
    enabled: Boolean(agencyId)
  });
  const members = useAgencyMembers({ page: 1, pageSize: 5 });

  const r = reports.data;
  const seats = r?.seats;
  const available = seats ? Math.max(0, seats.capacity - seats.assigned) : undefined;

  return (
    <AgencyPage title="Agency Overview">
      <div className="space-y-6">
        {reports.isLoading ? (
          <LoadingState />
        ) : reports.isError ? (
          <ErrorState error={reports.error} onRetry={() => reports.refetch()} />
        ) : r ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Assigned Seats" value={seats?.assigned ?? 0} sub={`${seats?.assigned ?? 0} of ${seats?.capacity ?? 0} used`} />
            <StatTile label="Active Members" value={r.members.active} />
            <StatTile label="Completion" value={pct(r.enrollments.completionPercent)} sub={`${r.enrollments.completed} of ${r.enrollments.total} enrollments`} />
            <StatTile label="Available Seats" value={available ?? 0} sub="Ready for assignment" />
            <StatTile label="In Progress" value={r.enrollments.inProgress} />
            <StatTile label="Pass Rate" value={pct(r.assessments.passRatePercent)} sub={`${r.assessments.passed} of ${r.assessments.graded} graded`} />
            <StatTile label="Avg Score" value={pct(r.assessments.averageScorePercent)} />
            <StatTile label="Certificates" value={r.certificates.issued} sub={r.certificates.revoked ? `${r.certificates.revoked} revoked` : undefined} />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link href="/agency/invitations" className={primaryBtn}>
            <UserPlus size={14} className="text-secondary-400" /> Invite Users
          </Link>
          <Link href="/agency/catalogue" className={outlineBtn}>
            <ShoppingCart size={14} /> Buy Seats
          </Link>
          <Link href="/agency/reports" className={outlineBtn}>
            <BarChart3 size={14} /> Reports
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Seat Licenses" action={<Link href="/agency/seats" className="text-xs font-bold text-secondary-600 hover:underline">Manage seats</Link>}>
            {entitlements.isLoading ? (
              <LoadingState />
            ) : entitlements.isError ? (
              <ErrorState error={entitlements.error} onRetry={() => entitlements.refetch()} />
            ) : !entitlements.data?.items.length ? (
              <EmptyState title="No seat licenses yet" description="Purchase seats from the catalogue to start assigning training." />
            ) : (
              <ul className="space-y-4">
                {entitlements.data.items.map((e) => (
                  <li key={e.uuid}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-gray-900">{e.product?.name}</span>
                      <span className="text-gray-500 font-semibold">
                        {e.seats_assigned} / {e.seats_total} seats
                      </span>
                    </div>
                    <ProgressBar value={e.seats_total ? (e.seats_assigned / e.seats_total) * 100 : 0} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Team Members" action={<Link href="/agency/members" className="text-xs font-bold text-secondary-600 hover:underline">View all</Link>}>
            {members.isLoading ? (
              <LoadingState />
            ) : members.isError ? (
              <ErrorState error={members.error} onRetry={() => members.refetch()} />
            ) : !members.data?.items.length ? (
              <EmptyState title="No members yet" description="Invite your staff to get started." />
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className={`${thCls} pl-2`}>Name</th>
                    <th className={thCls}>Role</th>
                    <th className={`${thCls} text-right pr-2`}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {members.data.items.map((m) => (
                    <tr key={m.uuid}>
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-900 text-secondary-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {initials(memberName(m))}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{memberName(m)}</p>
                            <p className="font-mono text-[10px] text-gray-500">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-md text-[10px]">
                          {m.role === "agency_admin" ? "Admin" : "Learner"}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2">
                        <StatusPill status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>
    </AgencyPage>
  );
}
