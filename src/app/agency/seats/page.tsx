"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Armchair, Plus } from "lucide-react";
import {
  agencyApi,
  agencyApiExt,
  agencyKeys,
  formatDate,
  memberName,
  useAgencyMembers,
  useAgencyScope,
  type AgencyEntitlement,
  type AgencySeat
} from "@/features/agency/api";
import { AgencyPage, Banner, Modal, Panel, ProgressBar, StatusPill, primaryBtn, outlineBtn, inputCls, thCls } from "@/features/agency/ui";
import { ErrorState, LoadingState, EmptyState, errorMessage } from "@/components/shared/QueryState";

type Dialog = { kind: "assign"; entitlement: AgencyEntitlement } | { kind: "reassign"; seat: AgencySeat } | null;

export default function AgencySeatsPage() {
  const { agencyId } = useAgencyScope();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [memberId, setMemberId] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const entitlements = useQuery({
    queryKey: agencyKeys.entitlements(agencyId),
    queryFn: () => agencyApi.entitlements(agencyId as string),
    enabled: Boolean(agencyId)
  });
  const seats = useQuery({
    queryKey: agencyKeys.seats(agencyId),
    queryFn: () => agencyApiExt.seats(agencyId as string),
    enabled: Boolean(agencyId)
  });
  const members = useAgencyMembers({ page: 1, pageSize: 100 });
  const activeMembers = (members.data?.items ?? []).filter((m) => m.status === "active");

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: agencyKeys.entitlements(agencyId) }),
      queryClient.invalidateQueries({ queryKey: agencyKeys.seats(agencyId) }),
      queryClient.invalidateQueries({ queryKey: ["agency", agencyId, "reports"] })
    ]);
  };

  const onError = (err: unknown) => setNotice({ tone: "error", text: errorMessage(err) });
  const closeDialog = () => {
    setDialog(null);
    setMemberId("");
  };

  const assign = useMutation({
    mutationFn: ({ entitlementId, membershipId }: { entitlementId: string; membershipId: string }) =>
      agencyApiExt.assignSeat(agencyId as string, entitlementId, membershipId),
    onSuccess: async () => {
      setNotice({ tone: "success", text: "Seat assigned." });
      closeDialog();
      await refresh();
    }
  });
  const release = useMutation({
    mutationFn: (seat: AgencySeat) => agencyApi.releaseSeat(agencyId as string, seat.entitlement.uuid, seat.uuid),
    onSuccess: async () => {
      setNotice({ tone: "success", text: "Seat released." });
      await refresh();
    },
    onError
  });
  const reassign = useMutation({
    mutationFn: ({ seat, membershipId }: { seat: AgencySeat; membershipId: string }) =>
      agencyApi.reassignSeat(agencyId as string, seat.entitlement.uuid, seat.uuid, membershipId),
    onSuccess: async () => {
      setNotice({ tone: "success", text: "Seat reassigned." });
      closeDialog();
      await refresh();
    }
  });

  const entitlementIdOf = dialog?.kind === "assign" ? dialog.entitlement.uuid : dialog?.kind === "reassign" ? dialog.seat.entitlement.uuid : null;
  const holders = new Set(
    (seats.data?.items ?? []).filter((s) => s.entitlement.uuid === entitlementIdOf).map((s) => s.learner.membership_id)
  );
  const candidates = activeMembers.filter((m) => !holders.has(m.uuid));
  const pending = assign.isPending || reassign.isPending;
  const dialogError = assign.error ?? reassign.error;

  return (
    <AgencyPage title="Seat Licenses">
      <div className="space-y-6">
        {notice && (
          <Banner tone={notice.tone} onClose={() => setNotice(null)}>
            {notice.text}
          </Banner>
        )}

        <Panel title="Entitlements" action={<Link href="/agency/catalogue" className={primaryBtn}><Plus size={14} className="text-secondary-400" /> Purchase Seats</Link>}>
          {entitlements.isLoading ? (
            <LoadingState />
          ) : entitlements.isError ? (
            <ErrorState error={entitlements.error} onRetry={() => entitlements.refetch()} />
          ) : !entitlements.data?.items.length ? (
            <EmptyState title="No seat licenses yet" description="Purchase seats from the catalogue to start assigning training." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {entitlements.data.items.map((e) => {
                const free = Math.max(0, e.seats_total - e.seats_assigned);
                return (
                  <div key={e.uuid} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-gray-900">{e.product?.name}</p>
                        <p className="text-[11px] text-gray-500">Valid until {formatDate(e.expires_at)}</p>
                      </div>
                      <StatusPill status={e.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><span className="text-[10px] font-bold text-gray-400 uppercase">Total</span><p className="text-xl font-black text-primary-950">{e.seats_total}</p></div>
                      <div><span className="text-[10px] font-bold text-gray-400 uppercase">Assigned</span><p className="text-xl font-black text-gray-900">{e.seats_assigned}</p></div>
                      <div><span className="text-[10px] font-bold text-gray-400 uppercase">Available</span><p className="text-xl font-black text-highlight-600">{free}</p></div>
                    </div>
                    <ProgressBar value={e.seats_total ? (e.seats_assigned / e.seats_total) * 100 : 0} />
                    <button
                      type="button"
                      className={`${outlineBtn} w-full`}
                      disabled={free === 0 || e.status !== "active"}
                      onClick={() => {
                        assign.reset();
                        setDialog({ kind: "assign", entitlement: e });
                      }}
                    >
                      <Armchair size={14} /> Assign Seat
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Assigned Seats">
          {seats.isLoading ? (
            <LoadingState />
          ) : seats.isError ? (
            <ErrorState error={seats.error} onRetry={() => seats.refetch()} />
          ) : !seats.data?.items.length ? (
            <EmptyState title="No seats assigned yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className={`${thCls} pl-2`}>Learner</th>
                    <th className={thCls}>Product</th>
                    <th className={thCls}>Assigned</th>
                    <th className={`${thCls} text-right pr-2`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {seats.data.items.map((s) => (
                    <tr key={s.uuid} className="hover:bg-gray-50/70">
                      <td className="py-4 pl-2">
                        <p className="font-bold text-gray-900">{memberName(s.learner)}</p>
                        <p className="font-mono text-[10px] text-gray-500">{s.learner.email}</p>
                      </td>
                      <td className="py-4">{s.entitlement.name}</td>
                      <td className="py-4 text-gray-500">{formatDate(s.assigned_at)}</td>
                      <td className="py-4 text-right pr-2 space-x-3">
                        <button
                          type="button"
                          className="text-xs font-bold text-primary-800 hover:underline"
                          onClick={() => {
                            reassign.reset();
                            setDialog({ kind: "reassign", seat: s });
                          }}
                        >
                          Reassign
                        </button>
                        <button
                          type="button"
                          disabled={release.isPending}
                          className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                          onClick={() => window.confirm(`Release the seat held by ${memberName(s.learner)}?`) && release.mutate(s)}
                        >
                          Release
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Modal open={Boolean(dialog)} onClose={closeDialog}>
        {dialog && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!memberId) return;
              if (dialog.kind === "assign") assign.mutate({ entitlementId: dialog.entitlement.uuid, membershipId: memberId });
              else reassign.mutate({ seat: dialog.seat, membershipId: memberId });
            }}
          >
            <h3 className="text-lg font-black text-gray-900">{dialog.kind === "assign" ? "Assign Seat" : "Reassign Seat"}</h3>
            <p className="text-xs text-gray-500">
              {dialog.kind === "assign"
                ? `Assign a ${dialog.entitlement.product?.name ?? ""} seat to an active member.`
                : `Move the seat held by ${memberName(dialog.seat.learner)} to another active member.`}
            </p>
            {dialogError && <Banner tone="error">{errorMessage(dialogError)}</Banner>}
            <div>
              <label htmlFor="seat-member" className="text-xs font-bold text-gray-700 block mb-1">Member</label>
              {members.isLoading ? (
                <LoadingState label="Loading members…" />
              ) : (
                <select id="seat-member" required value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
                  <option value="">Select a member…</option>
                  {candidates.map((m) => (
                    <option key={m.uuid} value={m.uuid}>
                      {memberName(m)} ({m.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button type="button" onClick={closeDialog} className="px-4 py-2.5 text-xs font-bold text-gray-500">Cancel</button>
              <button type="submit" disabled={!memberId || pending} className={primaryBtn}>
                {pending ? "Saving..." : dialog.kind === "assign" ? "Assign" : "Reassign"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AgencyPage>
  );
}
