"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";
import { platformApi } from "@/features/platform/api";
import {
  AdminPage,
  btnDark,
  btnLight,
  Field,
  formatDate,
  Modal,
  Notice,
  Pager,
  Panel,
  StatusPill,
  tdClass,
  thClass,
  useFlash
} from "@/features/platform/ui";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function AdminAgenciesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const flash = useFlash();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const agencies = useQuery({
    queryKey: ["platform", "agencies", { page, search }],
    queryFn: () => platformApi.agencies({ page, pageSize: 25, q: search.trim() || undefined })
  });

  const setStatus = useMutation({
    mutationFn: (input: { uuid: string; status: "active" | "suspended" }) => platformApi.setAgencyStatus(input.uuid, input.status),
    onSuccess: async () => {
      flash.success("Agency status updated.");
      await queryClient.invalidateQueries({ queryKey: ["platform", "agencies"] });
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  return (
    <AdminPage title="Government Agencies Directory" subtitle="Provision agencies, invite agency administrators and manage tenant status">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            aria-label="Search agencies"
            placeholder="Search by name or slug…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className={btnDark}>
          <Plus size={14} className="text-secondary-400" /> Onboard new agency
        </button>
      </div>

      {flash.node}

      <Panel title="Agencies" description="Seat usage counts active seat assignments">
        {agencies.isPending ? (
          <LoadingState />
        ) : agencies.isError ? (
          <ErrorState error={agencies.error} onRetry={() => void agencies.refetch()} />
        ) : agencies.data.items.length === 0 ? (
          <EmptyState title={search ? "No agencies match your search" : "No agencies yet"} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                    <th className={thClass}>Agency</th>
                    <th className={thClass}>Slug</th>
                    <th className={thClass}>Status</th>
                    <th className={`${thClass} text-right`}>Members</th>
                    <th className={`${thClass} text-right`}>Seats used</th>
                    <th className={thClass}>Created</th>
                    <th className={`${thClass} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {agencies.data.items.map((agency) => (
                    <tr key={agency.uuid} className="hover:bg-gray-50/80">
                      <td className={`${tdClass} font-bold text-gray-900`}>
                        <Link href={`/admin/agencies/${agency.uuid}`} className="hover:underline">
                          {agency.name}
                        </Link>
                      </td>
                      <td className={`${tdClass} font-mono text-[11px]`}>{agency.slug ?? "—"}</td>
                      <td className={tdClass}>
                        <StatusPill status={agency.status} />
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`}>{agency.member_count ?? "—"}</td>
                      <td className={`${tdClass} text-right tabular-nums`}>{agency.seats_used ?? "—"}</td>
                      <td className={`${tdClass} text-gray-400`}>{formatDate(agency.created_at)}</td>
                      <td className={`${tdClass} text-right whitespace-nowrap space-x-2`}>
                        {agency.status === "active" ? (
                          <button
                            type="button"
                            className={btnLight}
                            disabled={setStatus.isPending}
                            onClick={() => {
                              if (window.confirm(`Suspend ${agency.name}? All members lose access until reactivated.`)) {
                                setStatus.mutate({ uuid: agency.uuid, status: "suspended" });
                              }
                            }}
                          >
                            Suspend
                          </button>
                        ) : agency.status === "suspended" ? (
                          <button
                            type="button"
                            className={btnLight}
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ uuid: agency.uuid, status: "active" })}
                          >
                            Reactivate
                          </button>
                        ) : null}
                        <Link href={`/admin/agencies/${agency.uuid}`} className="text-primary-700 hover:text-primary-900 font-bold hover:underline">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={agencies.data.page} pages={agencies.data.pages} total={agencies.data.total} onChange={setPage} />
          </>
        )}
      </Panel>

      <CreateAgencyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async (publicId) => {
          setCreateOpen(false);
          await queryClient.invalidateQueries({ queryKey: ["platform", "agencies"] });
          router.push(`/admin/agencies/${publicId}`);
        }}
      />
    </AdminPage>
  );
}

function CreateAgencyModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (publicId: string) => void | Promise<void>;
}) {
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [billingEmail, setBillingEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      platformApi.createAgency({
        legalName: legalName.trim(),
        displayName: displayName.trim(),
        slug,
        billingEmail: billingEmail.trim() || undefined
      }),
    onSuccess: async (result) => {
      setLegalName("");
      setDisplayName("");
      setSlug("");
      setSlugTouched(false);
      setBillingEmail("");
      await onCreated(result.agency.publicId);
    },
    onError: (error) => setFormError(errorMessage(error))
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!legalName.trim() || !displayName.trim()) return setFormError("Legal and display names are required.");
    if (slug.length < 2 || !SLUG.test(slug)) return setFormError("Slug must be lowercase letters, numbers and single hyphens.");
    setFormError(null);
    create.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Onboard new agency" description="Creates the tenant. Invite its administrator on the next screen.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Legal name" htmlFor="agency-legal">
          <input id="agency-legal" className="input" value={legalName} maxLength={200} onChange={(e) => setLegalName(e.target.value)} />
        </Field>
        <Field label="Display name" htmlFor="agency-display">
          <input
            id="agency-display"
            className="input"
            value={displayName}
            maxLength={200}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="Slug" htmlFor="agency-slug" hint="Lowercase, e.g. texas-dot. Cannot be changed later.">
          <input
            id="agency-slug"
            className="input font-mono"
            value={slug}
            maxLength={100}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
          />
        </Field>
        <Field label="Billing email (optional)" htmlFor="agency-billing">
          <input id="agency-billing" type="email" className="input" value={billingEmail} maxLength={320} onChange={(e) => setBillingEmail(e.target.value)} />
        </Field>
        {formError && <Notice tone="error">{formError}</Notice>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnLight} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnDark} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create agency"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
