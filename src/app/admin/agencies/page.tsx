"use client";

import { Building2, MailPlus, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Panel } from "@/components/ui/panel";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useAction, useAgencies } from "@/lib/api/hooks";
import type { AgencySummary } from "@/lib/api/types";
import { formatNumber, relativeDays } from "@/lib/utils";

const PAGE_SIZE = 10;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function AdminAgenciesPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ legalName: "", displayName: "", slug: "", adminEmail: "" });
  const [slugEdited, setSlugEdited] = useState(false);
  const [inviteFor, setInviteFor] = useState<AgencySummary | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const toast = useToast();

  const query = useAgencies({ search: appliedSearch || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const create = useAction(api.platform.createAgency, {
    invalidate: ["agencies"],
    success: "Agency created",
  });
  const setStatus = useAction(api.platform.setAgencyStatus, { invalidate: ["agencies"] });
  const inviteAdmin = useAction(api.platform.inviteAgencyAdmin, { success: "Invitation sent" });

  const pageCount = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));

  const columns = useMemo<Column<AgencySummary>[]>(
    () => [
      {
        key: "name",
        header: "Agency",
        width: "minmax(0,2fr)",
        cell: (a) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{a.displayName}</p>
            <p className="truncate font-mono text-xs text-ink-600">{a.slug}</p>
          </div>
        ),
      },
      {
        key: "members",
        header: "Members",
        width: "100px",
        align: "right",
        cell: (a) => <span className="tnum font-semibold">{formatNumber(a.memberCount)}</span>,
      },
      {
        key: "seats",
        header: "Seats",
        width: "120px",
        align: "right",
        cell: (a) => (
          <span className="tnum font-semibold">
            {formatNumber(a.seatsUsed)}
            <span className="font-normal text-ink-500"> / {formatNumber(a.seatCapacity)}</span>
          </span>
        ),
      },
      { key: "status", header: "Status", width: "120px", cell: (a) => <StatusPill status={a.status} /> },
      { key: "created", header: "Onboarded", width: "130px", cell: (a) => <span className="text-ink-600">{a.createdAt ? relativeDays(a.createdAt) : "—"}</span> },
      {
        key: "actions",
        header: "Actions",
        width: "270px",
        cell: (a) =>
          a.status === "closed" ? (
            <span className="text-xs text-ink-500">Closed</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <Button variant="soft" size="sm" icon={<MailPlus className="size-4" aria-hidden />} onClick={() => { setInviteEmail(""); setInviteFor(a); }}>
                Invite admin
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void setStatus.run(a.publicId, a.status === "suspended" ? "active" : "suspended")}>
                {a.status === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
            </div>
          ),
      },
    ],
    [setStatus],
  );

  function resetForm() {
    setForm({ legalName: "", displayName: "", slug: "", adminEmail: "" });
    setSlugEdited(false);
  }

  async function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    const displayName = form.displayName.trim();
    const legalName = form.legalName.trim() || displayName;
    const slug = form.slug.trim() || slugify(displayName);
    const adminEmail = form.adminEmail.trim().toLowerCase();
    if (!displayName || !slug || !adminEmail) return;
    const created = await create.run({ displayName, legalName, slug, billingEmail: adminEmail });
    if (!created || created === true) return;
    setCreateOpen(false);
    resetForm();
    const invited = await inviteAdmin.run(created.publicId, adminEmail);
    if (invited === undefined) {
      toast.error("Agency created, but the invitation was not sent", "Use \"Invite admin\" on the agency row to try again.");
    }
  }

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!inviteFor || !email) return;
    const ok = await inviteAdmin.run(inviteFor.publicId, email);
    if (ok === undefined) return;
    setInviteFor(null);
    setInviteEmail("");
  }

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Agencies"
        subtitle="Provision tenants, monitor membership and manage access."
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreateOpen(true)}>
            New agency
          </Button>
        }
      />

      <Panel>
        <form
          className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setAppliedSearch(search.trim());
          }}
        >
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
            <Input
              aria-label="Search agencies"
              placeholder="Search by name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
          {appliedSearch ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          ) : null}
          <span className="tnum ml-auto text-sm text-ink-600">{formatNumber(query.data?.total ?? 0)} agencies</span>
        </form>

        <DataTable
          caption="Agencies"
          columns={columns}
          rows={query.data?.items}
          rowKey={(a) => a.publicId}
          loading={query.isPending}
          error={query.isError ? (query.error instanceof Error ? query.error.message : "Could not load agencies.") : undefined}
          onRetry={() => void query.refetch()}
          empty={{
            title: appliedSearch ? "No agencies match that search" : "No agencies yet",
            description: appliedSearch ? "Try a different name or slug." : "Create the first agency to get started.",
          }}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} total={query.data?.total} pageSize={PAGE_SIZE} />
      </Panel>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New agency"
        description="Creates the agency and emails its administrator a link to set their own password. They then sign in with that email."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="new-agency-form" loading={create.pending || inviteAdmin.pending} icon={<Building2 className="size-4" aria-hidden />}>
              Create agency &amp; send invitation
            </Button>
          </>
        }
      >
        <form id="new-agency-form" className="space-y-4" onSubmit={(e) => void submitCreate(e)}>
          <Field label="Agency name">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                data-autofocus
                required
                value={form.displayName}
                onChange={(e) => {
                  const displayName = e.target.value;
                  setForm((f) => ({ ...f, displayName, slug: slugEdited ? f.slug : slugify(displayName) }));
                }}
                placeholder="Texas Department of Transportation"
              />
            )}
          </Field>
          <Field label="Administrator email" hint="The person who will run this agency. They receive the invitation here and use this email to sign in.">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} type="email" required autoComplete="off" value={form.adminEmail} onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@agency.gov" />
            )}
          </Field>
          <Field label="Legal name" optional hint="Defaults to the agency name.">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} placeholder="Texas DOT" />
            )}
          </Field>
          <Field label="Slug" hint="Lowercase letters, numbers and single hyphens. Used in report filenames.">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} required minLength={2} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => { setSlugEdited(true); setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() })); }} placeholder="texas-dot" />
            )}
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!inviteFor}
        onClose={() => setInviteFor(null)}
        title={inviteFor ? `Invite an administrator — ${inviteFor.displayName}` : "Invite an administrator"}
        description="They get an email with a link to choose a password, then sign in with this email address."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteFor(null)}>Cancel</Button>
            <Button type="submit" form="invite-admin-form" loading={inviteAdmin.pending} icon={<MailPlus className="size-4" aria-hidden />}>
              Send invitation
            </Button>
          </>
        }
      >
        <form id="invite-admin-form" className="space-y-4" onSubmit={(e) => void submitInvite(e)}>
          <Field label="Administrator email">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} data-autofocus type="email" required autoComplete="off" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="admin@agency.gov" />
            )}
          </Field>
        </form>
      </Modal>
    </>
  );
}
