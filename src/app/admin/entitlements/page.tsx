"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";
import { platformApi, type PlatformEntitlement } from "@/features/platform/api";
import { AdminPage, btnDanger, btnLight, Pager, Panel, StatusPill, tdClass, thClass, useFlash } from "@/features/platform/ui";

type Action = "suspended" | "active" | "revoked";

const CONFIRM: Record<Action, (e: PlatformEntitlement) => string> = {
  suspended: (e) => `Suspend ${e.product?.name ?? "this entitlement"} for ${e.agency?.name ?? "this agency"}? Learners lose access until reactivated.`,
  active: () => "",
  revoked: (e) =>
    `Revoke ${e.product?.name ?? "this entitlement"} for ${e.agency?.name ?? "this agency"}? This is permanent; restoring access needs a new order.`
};

export default function AdminEntitlementsPage() {
  const queryClient = useQueryClient();
  const flash = useFlash();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const entitlements = useQuery({
    queryKey: ["platform", "entitlements", { page, search }],
    queryFn: () => platformApi.entitlements({ page, pageSize: 25, q: search.trim() || undefined })
  });

  const update = useMutation({
    mutationFn: (input: { id: string; status: Action }) => platformApi.updateEntitlement(input.id, { status: input.status }),
    onSuccess: async (_data, input) => {
      flash.success(input.status === "active" ? "Entitlement reactivated." : `Entitlement ${input.status}.`);
      await queryClient.invalidateQueries({ queryKey: ["platform", "entitlements"] });
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  const act = (e: PlatformEntitlement, status: Action) => {
    if (status !== "active" && !window.confirm(CONFIRM[status](e))) return;
    update.mutate({ id: e.uuid, status });
  };

  return (
    <AdminPage title="Entitlements" subtitle="Seat grants issued to agencies. Seat counts are fixed at purchase; more seats need a new order.">
      <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            aria-label="Search entitlements"
            placeholder="Search by agency or product…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>
      </div>

      {flash.node}

      <Panel title="All entitlements">
        {entitlements.isPending ? (
          <LoadingState />
        ) : entitlements.isError ? (
          <ErrorState error={entitlements.error} onRetry={() => void entitlements.refetch()} />
        ) : entitlements.data.items.length === 0 ? (
          <EmptyState title="No entitlements yet" description="Entitlements are created when an agency order is paid." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                    <th className={thClass}>Agency</th>
                    <th className={thClass}>Product</th>
                    <th className={`${thClass} text-right`}>Seats used / granted</th>
                    <th className={thClass}>Status</th>
                    <th className={`${thClass} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {entitlements.data.items.map((e) => (
                    <tr key={e.uuid}>
                      <td className={`${tdClass} font-bold text-gray-900`}>
                        {e.agency?.uuid ? (
                          <Link href={`/admin/agencies/${e.agency.uuid}`} className="hover:underline">
                            {e.agency.name}
                          </Link>
                        ) : (
                          e.agency?.name ?? "—"
                        )}
                      </td>
                      <td className={tdClass}>{e.product?.name ?? "—"}</td>
                      <td className={`${tdClass} text-right tabular-nums`}>
                        {e.seats_used ?? "—"} / {e.seats_granted}
                      </td>
                      <td className={tdClass}>
                        <StatusPill status={e.status} />
                      </td>
                      <td className={`${tdClass} text-right whitespace-nowrap space-x-2`}>
                        {e.status === "active" && (
                          <button type="button" className={btnLight} disabled={update.isPending} onClick={() => act(e, "suspended")}>
                            Suspend
                          </button>
                        )}
                        {e.status === "suspended" && (
                          <button type="button" className={btnLight} disabled={update.isPending} onClick={() => act(e, "active")}>
                            Reactivate
                          </button>
                        )}
                        {(e.status === "active" || e.status === "suspended") && (
                          <button type="button" className={btnDanger} disabled={update.isPending} onClick={() => act(e, "revoked")}>
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={entitlements.data.page} pages={entitlements.data.pages} total={entitlements.data.total} onChange={setPage} />
          </>
        )}
      </Panel>
    </AdminPage>
  );
}
