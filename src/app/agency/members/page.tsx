"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, MoreVertical } from "lucide-react";
import { memberName, useAgencyMembers, useUpdateMember, type AgencyMember } from "@/features/agency/api";
import { AgencyPage, Banner, Modal, Panel, StatusPill, initials, primaryBtn, outlineBtn, thCls, inputCls } from "@/features/agency/ui";
import { ErrorState, LoadingState, EmptyState, errorMessage } from "@/components/shared/QueryState";
import { formatDate } from "@/features/agency/api";

const PAGE_SIZE = 25;

export default function AgencyMembersPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AgencyMember | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const members = useAgencyMembers({ page, pageSize: PAGE_SIZE, q: q || undefined });
  const update = useUpdateMember();

  const run = (payload: { role?: string; status?: string }, done: string) => {
    if (!selected) return;
    update.mutate(
      { memberUuid: selected.uuid, ...payload },
      {
        onSuccess: () => {
          setNotice({ tone: "success", text: done });
          setSelected(null);
        },
        onError: (err) => setNotice({ tone: "error", text: errorMessage(err) })
      }
    );
  };

  const data = members.data;

  return (
    <AgencyPage title="Team Members">
      <div className="space-y-4">
        {notice && (
          <Banner tone={notice.tone} onClose={() => setNotice(null)}>
            {notice.text}
          </Banner>
        )}
        <Panel>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                aria-label="Search team members"
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <Link href="/agency/invitations" className={primaryBtn}>
              <UserPlus size={14} className="text-secondary-400" /> Invite Users
            </Link>
          </div>

          {members.isLoading ? (
            <LoadingState />
          ) : members.isError ? (
            <ErrorState error={members.error} onRetry={() => members.refetch()} />
          ) : !data?.items.length ? (
            <EmptyState title={q ? "No team members match your search." : "No team members yet"} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className={`${thCls} pl-2`}>Name</th>
                    <th className={thCls}>Email</th>
                    <th className={thCls}>Role</th>
                    <th className={thCls}>Joined</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right pr-2`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {data.items.map((m) => (
                    <tr key={m.uuid} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-900 text-secondary-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {initials(memberName(m))}
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">{memberName(m)}</span>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-[11px] text-gray-500">{m.email}</td>
                      <td className="py-4">
                        <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-md text-[10px]">
                          {m.role === "agency_admin" ? "Agency Admin" : "Learner"}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500">{formatDate(m.joined_at)}</td>
                      <td className="py-4">
                        <StatusPill status={m.status} />
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button
                          type="button"
                          onClick={() => setSelected(m)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label={`Manage ${memberName(m)}`}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.pages > 1 && (
                <div className="flex items-center justify-between pt-4 text-xs text-gray-500">
                  <span>
                    Page {data.page} of {data.pages} · {data.total} members
                  </span>
                  <div className="flex gap-2">
                    <button type="button" className={outlineBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </button>
                    <button type="button" className={outlineBtn} disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-gray-100 pr-6">
              <h4 className="text-sm font-black text-gray-900">Manage: {memberName(selected)}</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">{selected.email}</p>
            </div>
            <div>
              <label htmlFor="member-role" className="text-xs font-bold text-gray-700 block mb-1">
                Role
              </label>
              <select
                id="member-role"
                value={selected.role}
                disabled={update.isPending}
                onChange={(e) => run({ role: e.target.value }, `Role updated for ${memberName(selected)}.`)}
                className={inputCls}
              >
                <option value="learner">Learner</option>
                <option value="agency_admin">Agency Admin</option>
              </select>
            </div>
            <div className="space-y-2 text-xs">
              {selected.status === "active" && (
                <button
                  type="button"
                  disabled={update.isPending}
                  onClick={() => run({ status: "suspended" }, `${memberName(selected)} suspended.`)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 font-bold text-amber-700 border border-gray-100"
                >
                  Suspend member
                </button>
              )}
              {selected.status === "suspended" && (
                <button
                  type="button"
                  disabled={update.isPending}
                  onClick={() => run({ status: "active" }, `${memberName(selected)} reactivated.`)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 font-bold text-primary-900 border border-gray-100"
                >
                  Reactivate member
                </button>
              )}
              {selected.status !== "left" && (
                <button
                  type="button"
                  disabled={update.isPending}
                  onClick={() => {
                    if (window.confirm(`Remove ${memberName(selected)} from the agency?`)) {
                      run({ status: "removed" }, `${memberName(selected)} removed.`);
                    }
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-red-50 font-bold text-red-700 border border-gray-100"
                >
                  Remove from agency
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AgencyPage>
  );
}
