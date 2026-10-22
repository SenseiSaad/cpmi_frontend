"use client";

import { MailPlus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { BulkInviteDialog, InviteDialog } from "@/components/agency/invite-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api";
import { useAction, useInvitations } from "@/lib/api/hooks";
import type { Invitation } from "@/lib/api/types";
import { relativeDays } from "@/lib/utils";

export default function AgencyInvitationsPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const invitations = useInvitations();
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
        <DataTable
          caption="Pending invitations"
          columns={columns}
          rows={invitations.data}
          rowKey={(inv) => inv.id}
          loading={invitations.isPending}
          error={invitations.isError ? (invitations.error instanceof Error ? invitations.error.message : "Could not load invitations.") : undefined}
          onRetry={() => void invitations.refetch()}
          empty={{
            title: "No pending invitations",
            description: "Invite a colleague and they will appear here until they accept.",
            action: <Button icon={<MailPlus className="size-4" aria-hidden />} onClick={() => setInviteOpen(true)}>Invite member</Button>,
          }}
        />
      </Panel>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <BulkInviteDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </>
  );
}
