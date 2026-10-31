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

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AgencyForm {
  legalName: string;
  displayName: string;
  slug: string;
  billingEmail: string;
  adminEmail: string;
}
type FormErrors = Partial<Record<keyof AgencyForm, string>>;

const EMPTY_FORM: AgencyForm = { legalName: "", displayName: "", slug: "", billingEmail: "", adminEmail: "" };

function emailError(value: string, what: string): string | undefined {
  if (!value.trim()) return `Enter ${what}`;
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email address, like name@agency.gov";
  return undefined;
}

export default function AdminAgenciesPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<AgencyForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const [adminEdited, setAdminEdited] = useState(false);
  // Set once the agency exists, so a failed invitation can be retried without creating it twice.
  const [createdAgency, setCreatedAgency] = useState<AgencySummary | null>(null);

  const query = useAgencies({ search: appliedSearch || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const create = useAction(api.platform.createAgency, {
    invalidate: ["agencies"],
    success: "Agency created",
  });
  const invite = useAction(api.platform.inviteAgencyAdmin, { invalidate: ["agencies"] });
  const toast = useToast();
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

  function closeCreate() {
    setCreateOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSlugEdited(false);
    setAdminEdited(false);
    setCreatedAgency(null);
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const displayName = form.displayName.trim();
    const slug = form.slug.trim() || slugify(displayName);

    const found: FormErrors = {};
    if (!displayName) found.displayName = "Enter the agency name";
    if (slug.length < 2 || !SLUG_PATTERN.test(slug)) found.slug = "Use at least 2 characters: lowercase letters, numbers and single hyphens";
    const billing = emailError(form.billingEmail, "the billing email address");
    if (billing) found.billingEmail = billing;
    const admin = emailError(form.adminEmail, "the administrator's email address");
    if (admin) found.adminEmail = admin;
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move the cursor to the first field that needs attention.
      window.setTimeout(() => formEl.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    let agency = createdAgency;
    if (!agency) {
      const created = await create.run({
        displayName,
        legalName: form.legalName.trim() || displayName,
        slug,
        billingEmail: form.billingEmail.trim(),
      });
      if (!created || created === true) return;
      agency = created;
      setCreatedAgency(created);
    }

    const sent = await invite.run(agency.publicId, form.adminEmail.trim());
    if (!sent) return; // The agency exists; the dialog stays open so the invitation can be retried.
    toast.success("Invitation sent", `${form.adminEmail.trim()} will receive an email to create their account.`);
    closeCreate();
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
          <span className="tnum text-sm text-ink-600">{formatNumber(query.data?.total ?? 0)} agencies</span>
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
        onClose={closeCreate}
        title="New agency"
        description="Creates the agency and emails its administrator an invitation to create their account."
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>{createdAgency ? "Close" : "Cancel"}</Button>
            <Button type="submit" form="new-agency-form" loading={create.pending || invite.pending} icon={<Building2 className="size-4" aria-hidden />}>
              {createdAgency ? "Retry invitation" : "Create agency & send invitation"}
            </Button>
          </>
        }
      >
        <form id="new-agency-form" className="space-y-4 text-left" onSubmit={submitCreate} noValidate>
          {createdAgency ? (
            <p role="alert" className="rounded-xl bg-warn-bg p-3 text-sm font-medium text-warn">
              <strong>{createdAgency.displayName}</strong> was created, but the invitation email could not be sent. Check the address
              below and retry. The agency will not be created again.
            </p>
          ) : null}
          <Field label="Agency name" required error={errors.displayName}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                data-autofocus
                autoComplete="organization"
                disabled={!!createdAgency}
                value={form.displayName}
                onChange={(e) => {
                  const displayName = e.target.value;
                  setForm((f) => ({ ...f, displayName, slug: slugEdited ? f.slug : slugify(displayName) }));
                  setErrors((er) => ({ ...er, displayName: undefined }));
                }}
                placeholder="Texas Department of Transportation"
              />
            )}
          </Field>
          <Field label="Legal name" optional hint="Leave blank to use the agency name.">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} disabled={!!createdAgency} value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} placeholder="Texas DOT" />
            )}
          </Field>
          <Field label="Slug" required hint="Lowercase letters, numbers and single hyphens. Used in report filenames." error={errors.slug}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                disabled={!!createdAgency}
                autoCapitalize="none"
                spellCheck={false}
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }));
                  setErrors((er) => ({ ...er, slug: undefined }));
                }}
                placeholder="texas-dot"
              />
            )}
          </Field>
          <Field label="Billing email" required hint="Invoices and payment notices go here." error={errors.billingEmail}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={!!createdAgency}
                value={form.billingEmail}
                onChange={(e) => {
                  const billingEmail = e.target.value;
                  // Until it is edited by hand, the administrator's address follows the billing address.
                  setForm((f) => ({ ...f, billingEmail, adminEmail: adminEdited ? f.adminEmail : billingEmail }));
                  setErrors((er) => ({ ...er, billingEmail: undefined, ...(adminEdited ? {} : { adminEmail: undefined }) }));
                }}
                placeholder="billing@agency.gov"
              />
            )}
          </Field>
          <Field label="Administrator email" required hint="This person gets an email with a link to create their account and sign in with this address." error={errors.adminEmail}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={form.adminEmail}
                onChange={(e) => {
                  setAdminEdited(true);
                  setForm((f) => ({ ...f, adminEmail: e.target.value }));
                  setErrors((er) => ({ ...er, adminEmail: undefined }));
                }}
                placeholder="director@agency.gov"
              />
            )}
          </Field>
        </form>
      </Modal>
    </>
  );
}
