"use client";

import { MailPlus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { BulkInviteDialog, InviteDialog } from "@/components/agency/invite-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api";
import { useAction } from "@/lib/api/hooks";
import { useDebounced, useInvitationsPage } from "@/lib/api/lists";
import type { Invitation } from "@/lib/api/types";
import { relativeDays } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function AgencyInvitationsPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(search.trim());

  const invitations = useInvitationsPage({ search: term, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const revoke = useAction(api.invitations.revoke, { invalidate: ["invitations"], success: "Invitation revoked" });

  const columns = useMemo<Column<Invitation>[]>(
    () => [
      {
        key: "email",
        header: "Email",
        width: "minmax(0,2fr)",
        cell: (inv) => <span className="truncate font-mono text-sm text-ink-900">{inv.emailNormalized}</span>,
      },
      { key: "role", header: "Role", width: "140px", cell: (inv) => <Badge tone="navy">{inv.roleCode.replace(/_/g, " ")}</Badge> },
      { key: "status", header: "Status", width: "120px", cell: () => <Badge tone="warn" dot>Pending</Badge> },
      {
        key: "expires",
        header: "Expires",
        width: "160px",
        cell: (inv) => <span className="text-ink-600">{inv.expiresAt ? relativeDays(inv.expiresAt) : "—"}</span>,
      },
      {
        key: "actions",
        header: "Actions",
        width: "120px",
        align: "right",
        cell: (inv) => (
          <Button
            variant="ghost"
            size="sm"
            loading={revoke.pending}
            onClick={() => {
              if (!window.confirm(`Revoke the invitation for ${inv.emailNormalized}?`)) return;
              void revoke.run(inv.id);
            }}
          >
            Revoke
          </Button>
        ),
      },
    ],
    [revoke],
  );

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Invitations"
        subtitle="Pending invitations to join your agency. Links expire automatically."
        actions={
          <>
            <Button icon={<UserPlus className="size-4" aria-hidden />} onClick={() => setInviteOpen(true)}>Invite member</Button>
            <Button variant="secondary" onClick={() => setBulkOpen(true)}>Bulk CSV</Button>
          </>
        }
      />

      <Panel>
        <div className="mb-4">
          <label htmlFor="invite-search" className="sr-only">Search invitations</label>
          <Input id="invite-search" type="search" autoComplete="off" placeholder="Search by email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <DataTable
          caption="Pending invitations"
          columns={columns}
          rows={invitations.data?.items}
          rowKey={(inv) => inv.id}
          loading={invitations.isPending}
          error={invitations.isError ? (invitations.error instanceof Error ? invitations.error.message : "Could not load invitations.") : undefined}
          onRetry={() => void invitations.refetch()}
          empty={{
            title: term ? "No invitation matches" : "No pending invitations",
            description: term ? "Try a different email." : "Invite a colleague and they will appear here until they accept.",
            action: <Button icon={<MailPlus className="size-4" aria-hidden />} onClick={() => setInviteOpen(true)}>Invite member</Button>,
          }}
        />
        <div className="mt-4"><Pagination page={page} pageCount={Math.max(1, Math.ceil((invitations.data?.total ?? 0) / PAGE_SIZE))} onChange={setPage} total={invitations.data?.total ?? 0} pageSize={PAGE_SIZE} /></div>
      </Panel>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <BulkInviteDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </>
  );
}
