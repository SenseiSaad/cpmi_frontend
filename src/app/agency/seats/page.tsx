"use client";

import { ArrowLeftRight, Ticket, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { api } from "@/lib/api";
import { useAction, useAllMembers, useEntitlements, useSeats } from "@/lib/api/hooks";
import type { Seat } from "@/lib/api/types";
import { formatNumber, relativeDays } from "@/lib/utils";

function memberLabel(seat: Seat): string {
  if (!seat.member) return "Unassigned";
  return `${seat.member.firstName} ${seat.member.lastName}`.trim() || seat.member.email;
}

export default function AgencySeatsPage() {
  const entitlements = useEntitlements();
  const members = useAllMembers();
  const [entitlementId, setEntitlementId] = useState<string | null>(null);
  const seats = useSeats(entitlementId);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMembership, setAssignMembership] = useState("");
  const [reassignSeat, setReassignSeat] = useState<Seat | null>(null);
  const [reassignMembership, setReassignMembership] = useState("");

  const assign = useAction(api.seats.assign, { invalidate: ["entitlements", "seats", "agency-overview"], success: "Seat assigned" });
  const release = useAction(api.seats.release, { invalidate: ["entitlements", "seats", "agency-overview"], success: "Seat released" });
  const reassign = useAction(api.seats.reassign, { invalidate: ["entitlements", "seats", "agency-overview"], success: "Seat reassigned" });

  const entitlementList = entitlements.data ?? [];

  useEffect(() => {
    if (entitlementId) return;
    const first = entitlementList.find((ent) => ent.status === "active") ?? entitlementList[0];
    if (first) setEntitlementId(first.id);
  }, [entitlementId, entitlementList]);

  const selected = entitlementList.find((ent) => ent.id === entitlementId) ?? null;
  const activeMembers = useMemo(() => (members.data ?? []).filter((m) => m.membershipStatus === "active"), [members.data]);

  const columns = useMemo<Column<Seat>[]>(
    () => [
      { key: "slot", header: "Slot", width: "70px", cell: (seat) => <span className="tnum font-bold text-ink-900">#{seat.slotNo}</span> },
      {
        key: "member",
        header: "Assigned to",
        width: "minmax(0,2fr)",
        cell: (seat) =>
          seat.member ? (
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{memberLabel(seat)}</p>
              <p className="truncate font-mono text-xs text-ink-600">{seat.member.email}</p>
            </div>
          ) : (
            <span className="text-sm text-ink-500">Unassigned</span>
          ),
      },
      { key: "assigned", header: "Assigned", width: "130px", cell: (seat) => <span className="text-ink-600">{seat.assignedAt ? relativeDays(seat.assignedAt) : "—"}</span> },
      {
        key: "actions",
        header: "Actions",
        width: "190px",
        align: "right",
        cell: (seat) => (
          <div className="flex flex-wrap justify-start gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeftRight className="size-3.5" aria-hidden />}
              onClick={() => {
                setReassignSeat(seat);
                setReassignMembership("");
              }}
            >
              Reassign
            </Button>
            <Button
              variant="ghost"
              size="sm"
              loading={release.pending}
              onClick={() => {
                if (!entitlementId || !seat.assignmentId) return;
                if (!window.confirm(`Release seat #${seat.slotNo} from ${memberLabel(seat)}?`)) return;
                void release.run(entitlementId, seat.assignmentId);
              }}
            >
              Release
            </Button>
          </div>
        ),
      },
    ],
    [entitlementId, release],
  );

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Seats"
        subtitle="Assign licensed seats to active members and reassign them when staff changes."
        actions={<ButtonLink href="/agency/store" variant="primary" icon={<Ticket className="size-4" aria-hidden />}>Buy more seats</ButtonLink>}
      />

      {entitlements.isError ? (
        <Panel><ErrorState message={entitlements.error instanceof Error ? entitlements.error.message : undefined} onRetry={() => void entitlements.refetch()} /></Panel>
      ) : entitlements.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : entitlementList.length === 0 ? (
        <Panel>
          <div className="py-10 text-center">
            <p className="text-lg font-bold text-ink-900">No seat entitlements yet</p>
            <p className="mt-1 text-sm text-ink-600">Purchase a program to create a seat pool for your agency.</p>
            <ButtonLink href="/agency/store" className="mt-5">Visit the store</ButtonLink>
          </div>
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {entitlementList.map((ent) => {
              const active = ent.id === entitlementId;
              const pct = ent.seatCapacity > 0 ? (ent.seatsUsed / ent.seatCapacity) * 100 : 0;
              return (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => setEntitlementId(ent.id)}
                  aria-pressed={active}
                  className={`rounded-3xl p-5 text-left shadow-card ring-1 transition-all ${active ? "bg-white ring-2 ring-brand-700" : "bg-white ring-navy-900/[0.04] hover:ring-navy-300"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-ink-900">{ent.productName}</p>
                    <StatusPill status={ent.status} />
                  </div>
                  <p className="tnum mt-3 text-2xl font-extrabold text-ink-900">
                    {formatNumber(ent.seatsUsed)} <span className="text-base font-medium text-ink-500">/ {formatNumber(ent.seatCapacity)} seats</span>
                  </p>
                  <ProgressBar value={pct} label={`${ent.productName} seats used`} className="mt-2" />
                  <p className="mt-2 text-xs text-ink-600">Valid until {ent.validUntil ? new Date(ent.validUntil).toLocaleDateString() : "—"}</p>
                </button>
              );
            })}
          </div>

          <Panel className="mt-6">
            <PanelHeader
              title={selected ? `${selected.productName} — assigned seats` : "Assigned seats"}
              description={selected ? `${formatNumber(selected.seatsUsed)} of ${formatNumber(selected.seatCapacity)} seats assigned.` : undefined}
              action={
                <Button
                  icon={<UserPlus className="size-4" aria-hidden />}
                  disabled={!selected || selected.status !== "active" || selected.seatsUsed >= selected.seatCapacity}
                  onClick={() => {
                    setAssignMembership("");
                    setAssignOpen(true);
                  }}
                >
                  Assign seat
                </Button>
              }
            />
            <DataTable
              caption="Seat assignments"
              columns={columns}
              rows={seats.data}
              rowKey={(seat) => seat.assignmentId ?? `slot-${seat.slotNo}`}
              loading={seats.isPending}
              error={seats.isError ? (seats.error instanceof Error ? seats.error.message : "Could not load seats.") : undefined}
              onRetry={() => void seats.refetch()}
              empty={{ title: "No seats assigned", description: "Assign a licensed seat to an active member of your team." }}
            />
          </Panel>
        </>
      )}

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign a seat"
        description={selected ? `${selected.productName} · ${selected.seatCapacity - selected.seatsUsed} seats available` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              loading={assign.pending}
              disabled={!assignMembership}
              onClick={() => {
                if (!entitlementId || !assignMembership) return;
                void assign.run(entitlementId, assignMembership).then((ok) => ok !== undefined && setAssignOpen(false));
              }}
            >
              Assign seat
            </Button>
          </>
        }
      >
        <Field label="Member">
          {({ id }) => (
            <Select id={id} data-autofocus value={assignMembership} onChange={(e) => setAssignMembership(e.target.value)}>
              <option value="">Choose an active member…</option>
              {activeMembers.map((member) => (
                <option key={member.membershipId} value={member.membershipId}>
                  {`${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email} — {member.user.email}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {members.isPending ? <p className="mt-2 text-xs text-ink-600">Loading members…</p> : null}
        {members.isError ? <p className="mt-2 text-xs text-bad">Could not load members.</p> : null}
      </Modal>

      <Modal
        open={!!reassignSeat}
        onClose={() => setReassignSeat(null)}
        title={reassignSeat ? `Reassign seat #${reassignSeat.slotNo}` : "Reassign seat"}
        description={reassignSeat ? `Currently assigned to ${memberLabel(reassignSeat)}.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReassignSeat(null)}>Cancel</Button>
            <Button
              loading={reassign.pending}
              disabled={!reassignMembership}
              onClick={() => {
                if (!entitlementId || !reassignSeat?.assignmentId || !reassignMembership) return;
                void reassign.run(entitlementId, reassignSeat.assignmentId, reassignMembership).then((ok) => ok !== undefined && setReassignSeat(null));
              }}
            >
              Reassign
            </Button>
          </>
        }
      >
        <Field label="New member">
          {({ id }) => (
            <Select id={id} data-autofocus value={reassignMembership} onChange={(e) => setReassignMembership(e.target.value)}>
              <option value="">Choose an active member…</option>
              {activeMembers
                .filter((member) => member.membershipId !== reassignSeat?.membershipId)
                .map((member) => (
                  <option key={member.membershipId} value={member.membershipId}>
                    {`${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email} — {member.user.email}
                  </option>
                ))}
            </Select>
          )}
        </Field>
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-600">
          <Badge tone="warn">Heads up</Badge>
          Reassigning releases the current holder immediately.
        </p>
      </Modal>
    </>
  );
}
