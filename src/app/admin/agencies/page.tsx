"use client";

import { Building2, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Panel } from "@/components/ui/panel";
import { Pagination } from "@/components/ui/pagination";
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
  const [form, setForm] = useState({ legalName: "", displayName: "", slug: "", billingEmail: "" });

  const query = useAgencies({ search: appliedSearch || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const create = useAction(api.platform.createAgency, {
    invalidate: ["agencies"],
    success: "Agency created",
  });
  const setStatus = useAction(api.platform.setAgencyStatus, { invalidate: ["agencies"] });

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
        width: "140px",
        align: "right",
        cell: (a) =>
          a.status === "closed" ? (
            <span className="text-xs text-ink-500">Closed</span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void setStatus.run(a.publicId, a.status === "suspended" ? "active" : "suspended")}
            >
              {a.status === "suspended" ? "Reactivate" : "Suspend"}
            </Button>
          ),
      },
    ],
    [setStatus],
  );

  function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    const displayName = form.displayName.trim();
    const legalName = form.legalName.trim() || displayName;
    const slug = form.slug.trim() || slugify(displayName);
    if (!displayName || !slug) return;
    void create
      .run({
        displayName,
        legalName,
        slug,
        ...(form.billingEmail.trim() ? { billingEmail: form.billingEmail.trim() } : {}),
      })
      .then((result) => {
        if (!result) return;
        setCreateOpen(false);
        setForm({ legalName: "", displayName: "", slug: "", billingEmail: "" });
      });
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
        description="Creates a tenant. Invite its first administrator from the agency's team page afterwards."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="new-agency-form" loading={create.pending} icon={<Building2 className="size-4" aria-hidden />}>
              Create agency
            </Button>
          </>
        }
      >
        <form id="new-agency-form" className="space-y-4" onSubmit={submitCreate}>
          <Field label="Display name">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                data-autofocus
                required
                value={form.displayName}
                onChange={(e) => {
                  const displayName = e.target.value;
                  setForm((f) => ({ ...f, displayName, slug: f.slug || slugify(displayName) }));
                }}
                placeholder="Texas Department of Transportation"
              />
            )}
          </Field>
          <Field label="Legal name" optional>
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} placeholder="Texas DOT" />
            )}
          </Field>
          <Field label="Slug" hint="Lowercase letters, numbers and single hyphens. Used in report filenames.">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="texas-dot" />
            )}
          </Field>
          <Field label="Billing email" optional>
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} type="email" value={form.billingEmail} onChange={(e) => setForm((f) => ({ ...f, billingEmail: e.target.value }))} placeholder="billing@agency.gov" />
            )}
          </Field>
        </form>
      </Modal>
    </>
  );
}
