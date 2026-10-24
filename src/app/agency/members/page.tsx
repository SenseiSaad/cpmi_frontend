"use client";

import { Search, UserCog, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { BulkInviteDialog, InviteDialog } from "@/components/agency/invite-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Panel } from "@/components/ui/panel";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAction, useMembers } from "@/lib/api/hooks";
import type { MemberRow } from "@/lib/api/types";
import { initials, relativeDays } from "@/lib/utils";

const PAGE_SIZE = 20;
type StatusFilter = "all" | "active" | "invited" | "suspended" | "left";

function memberName(member: MemberRow): string {
  return `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;
}

export default function AgencyMembersPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selected, setSelected] = useState<MemberRow | null>(null);
  const [reference, setReference] = useState("");

  const members = useMembers({
    ...(status === "all" ? {} : { status }),
    ...(appliedSearch ? { search: appliedSearch } : {}),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const setMemberStatus = useAction(api.members.setStatus, { invalidate: ["members", "members-all", "agency-overview"], success: "Member updated" });
  const setEmployeeReference = useAction(api.members.setEmployeeReference, { invalidate: ["members", "members-all"], success: "Employee reference saved" });

  const pageCount = Math.max(1, Math.ceil((members.data?.total ?? 0) / PAGE_SIZE));

  const columns = useMemo<Column<MemberRow>[]>(
    () => [
      {
        key: "member",
        header: "Member",
        width: "minmax(0,2fr)",
        cell: (m) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-brand-200" aria-hidden>
              {initials(m.user.firstName, m.user.lastName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{memberName(m)}</p>
              <p className="truncate font-mono text-xs text-ink-600">{m.user.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "roles",
        header: "Roles",
        width: "150px",
        cell: (m) => (
          <div className="flex flex-wrap gap-1">
            {m.roles.length > 0 ? m.roles.map((role) => <Badge key={role} tone="navy">{role.replace(/_/g, " ")}</Badge>) : <span className="text-xs text-ink-500">—</span>}
          </div>
        ),
      },
      { key: "status", header: "Status", width: "120px", cell: (m) => <StatusPill status={m.membershipStatus} /> },
      {
        key: "reference",
        header: "Employee ref.",
        width: "150px",
        cell: (m) => <span className="truncate font-mono text-xs text-ink-600">{m.employeeReference ?? "—"}</span>,
      },
      { key: "joined", header: "Joined", width: "120px", cell: (m) => <span className="text-ink-600">{m.joinedAt ? relativeDays(m.joinedAt) : "Invited"}</span> },
      {
        key: "actions",
        header: "Actions",
        width: "110px",
        align: "right",
        cell: (m) => (
          <Button
            variant="secondary"
            size="sm"
            icon={<UserCog className="size-4" aria-hidden />}
            onClick={() => {
              setSelected(m);
              setReference(m.employeeReference ?? "");
            }}
          >
            Manage
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Team members"
        subtitle="Invite staff, review membership status and maintain employee references."
        actions={
          <>
            <Button icon={<UserPlus className="size-4" aria-hidden />} onClick={() => setInviteOpen(true)}>Invite member</Button>
            <Button variant="secondary" onClick={() => setBulkOpen(true)}>Bulk CSV</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label="Filter members by status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          items={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "invited", label: "Invited" },
            { value: "suspended", label: "Suspended" },
            { value: "left", label: "Removed" },
          ]}
        />
        <form
          className="flex w-full gap-2 sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setAppliedSearch(search.trim());
          }}
        >
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
            <Input aria-label="Search members" placeholder="Search name or email…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <Panel>
        <DataTable
          caption="Agency members"
          columns={columns}
          rows={members.data?.items}
          rowKey={(m) => m.membershipId}
          loading={members.isPending}
          error={members.isError ? (members.error instanceof Error ? members.error.message : "Could not load members.") : undefined}
          onRetry={() => void members.refetch()}
          empty={{ title: "No members in this view", description: "Invite a colleague to get started.", action: <Button icon={<Users className="size-4" aria-hidden />} onClick={() => setInviteOpen(true)}>Invite member</Button> }}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} total={members.data?.total} pageSize={PAGE_SIZE} />
      </Panel>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <BulkInviteDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Manage ${memberName(selected)}` : "Manage member"}
        description="Membership changes are recorded in the agency audit log."
      >
        {selected ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-canvas-soft p-4 text-sm">
              <p className="font-semibold text-ink-900">{selected.user.email}</p>
              <p className="mt-1 text-ink-600">Status: <span className="capitalize">{selected.membershipStatus}</span> · Joined {selected.joinedAt ? relativeDays(selected.joinedAt) : "pending"}</p>
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void setEmployeeReference.run(selected.membershipId, reference.trim() || null).then((ok) => {
                  if (ok === undefined) return;
                  setSelected(null);
                });
              }}
            >
              <Field label="Employee reference" hint="Optional internal identifier, for example an employee number.">
                {({ id, describedBy }) => (
                  <Input id={id} aria-describedby={describedBy} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} placeholder="EMP-1042" />
                )}
              </Field>
              <Button type="submit" variant="secondary" loading={setEmployeeReference.pending}>Save reference</Button>
            </form>

            <div className="space-y-2 border-t border-line pt-4">
              {selected.membershipStatus === "active" ? (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  loading={setMemberStatus.pending}
                  onClick={() => void setMemberStatus.run(selected.membershipId, "suspend").then((ok) => ok !== undefined && setSelected(null))}
                >
                  Suspend member
                </Button>
              ) : selected.membershipStatus === "suspended" ? (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  loading={setMemberStatus.pending}
                  onClick={() => void setMemberStatus.run(selected.membershipId, "reactivate").then((ok) => ok !== undefined && setSelected(null))}
                >
                  Reactivate member
                </Button>
              ) : null}
              {selected.membershipStatus !== "left" ? (
                <Button
                  variant="danger"
                  className="w-full justify-start"
                  loading={setMemberStatus.pending}
                  onClick={() => {
                    if (!window.confirm(`Remove ${memberName(selected)} from the agency? Their seats will be released.`)) return;
                    void setMemberStatus.run(selected.membershipId, "remove").then((ok) => ok !== undefined && setSelected(null));
                  }}
                >
                  Remove from agency
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
