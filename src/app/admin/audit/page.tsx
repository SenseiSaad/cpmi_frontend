"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/QueryState";
import { platformApi } from "@/features/platform/api";
import { AdminPage, btnDark, btnLight, Field, formatDateTime, Pager, Panel, tdClass, thClass } from "@/features/platform/ui";

interface Filters {
  agencyPublicId: string;
  action: string;
  from: string;
  to: string;
}

const EMPTY: Filters = { agencyPublicId: "", action: "", from: "", to: "" };

export default function AdminAuditPage() {
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);

  // Agency picker options (first 100 agencies).
  const agencies = useQuery({
    queryKey: ["platform", "agencies", { page: 1, pageSize: 100 }],
    queryFn: () => platformApi.agencies({ page: 1, pageSize: 100 })
  });

  const audit = useQuery({
    queryKey: ["platform", "audit", filters, page],
    queryFn: () =>
      platformApi.auditLog({
        page,
        pageSize: 50,
        agencyPublicId: filters.agencyPublicId || undefined,
        action: filters.action.trim() || undefined,
        // Date inputs are local calendar days; send inclusive day bounds as ISO instants.
        from: filters.from ? new Date(`${filters.from}T00:00:00`).toISOString() : undefined,
        to: filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : undefined
      })
  });

  const apply = (event: FormEvent) => {
    event.preventDefault();
    setFilters(draft);
    setPage(1);
  };

  return (
    <AdminPage title="Audit & Compliance Log" subtitle="Append-only, hash-chained record of who changed what, when, and in which agency">
      <Panel>
        <form onSubmit={apply} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Field label="Agency" htmlFor="audit-agency">
            <select
              id="audit-agency"
              className="input"
              value={draft.agencyPublicId}
              onChange={(e) => setDraft({ ...draft, agencyPublicId: e.target.value })}
            >
              <option value="">All agencies</option>
              {(agencies.data?.items ?? []).map((a) => (
                <option key={a.uuid} value={a.uuid}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Action prefix" htmlFor="audit-action">
            <input
              id="audit-action"
              className="input font-mono"
              placeholder="e.g. agency. or certificate."
              value={draft.action}
              maxLength={100}
              onChange={(e) => setDraft({ ...draft, action: e.target.value })}
            />
          </Field>
          <Field label="From" htmlFor="audit-from">
            <input id="audit-from" type="date" className="input" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
          </Field>
          <Field label="To" htmlFor="audit-to">
            <input id="audit-to" type="date" className="input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <button type="submit" className={btnDark}>
              Apply
            </button>
            <button
              type="button"
              className={btnLight}
              onClick={() => {
                setDraft(EMPTY);
                setFilters(EMPTY);
                setPage(1);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Events">
        {audit.isPending ? (
          <LoadingState />
        ) : audit.isError ? (
          <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
        ) : audit.data.items.length === 0 ? (
          <EmptyState title="No audit entries" description="State-changing actions appear here after the audit worker appends them." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                    <th className={thClass}>When</th>
                    <th className={thClass}>Action</th>
                    <th className={thClass}>Actor</th>
                    <th className={thClass}>Subject</th>
                    <th className={thClass}>Agency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {audit.data.items.map((entry) => (
                    <tr key={entry.id}>
                      <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(entry.occurredAt)}</td>
                      <td className={`${tdClass} font-mono text-[11px] text-gray-900`}>{entry.action}</td>
                      <td className={tdClass}>
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{entry.actorType}</span>
                      </td>
                      <td className={tdClass}>
                        {entry.subjectType}
                        {entry.subjectPublicId && (
                          <span className="ml-1 font-mono text-gray-400" title={entry.subjectPublicId}>
                            {entry.subjectPublicId.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>{entry.agency?.name ?? "Platform"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={audit.data.page} pages={audit.data.pages} total={audit.data.total} onChange={setPage} />
          </>
        )}
      </Panel>

      <p className="flex items-start gap-2 text-xs text-gray-500">
        <ScrollText size={14} className="mt-0.5 shrink-0" />
        Events are appended by the audit worker from the transactional outbox; check queue depth under Settings.
      </p>
    </AdminPage>
  );
}
