"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Upload, FileSpreadsheet, Download } from "lucide-react";
import { agencyApi, agencyKeys, formatDate, useAgencyScope, type AgencyInvitation } from "@/features/agency/api";
import { AgencyPage, Banner, Modal, Panel, StatusPill, primaryBtn, outlineBtn, inputCls, thCls } from "@/features/agency/ui";
import { ErrorState, LoadingState, EmptyState, errorMessage } from "@/components/shared/QueryState";

const SAMPLE_CSV = "email,role\njane.doe@agency.gov,learner\n";

export default function AgencyInvitationsPage() {
  const { agencyId } = useAgencyScope();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "revoked">("pending");
  const [showInvite, setShowInvite] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("learner");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const list = useQuery({
    queryKey: agencyKeys.invitations(agencyId, tab),
    queryFn: () => agencyApi.invitations(agencyId as string, tab),
    enabled: Boolean(agencyId)
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["agency", agencyId, "invitations"] });

  const invite = useMutation({
    mutationFn: () => agencyApi.invite(agencyId as string, { email: email.trim(), role }),
    onSuccess: async () => {
      setNotice({ tone: "success", text: `Invitation sent to ${email.trim()}.` });
      setEmail("");
      setShowInvite(false);
      await refresh();
    }
  });

  const revoke = useMutation({
    mutationFn: (inv: AgencyInvitation) => agencyApi.revokeInvitation(agencyId as string, inv.uuid),
    onSuccess: async (_d, inv) => {
      setNotice({ tone: "success", text: `Invitation for ${inv.email} revoked.` });
      await refresh();
    },
    onError: (err) => setNotice({ tone: "error", text: errorMessage(err) })
  });

  return (
    <AgencyPage title="Invitations">
      <div className="space-y-4">
        {notice && (
          <Banner tone={notice.tone} onClose={() => setNotice(null)}>
            {notice.text}
          </Banner>
        )}
        <Panel>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="inline-flex rounded-xl border border-gray-200 p-1 text-xs font-bold" role="tablist">
              {(["pending", "revoked"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg capitalize ${tab === t ? "bg-primary-900 text-white" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { invite.reset(); setShowInvite(true); }} className={primaryBtn}>
                <UserPlus size={14} className="text-secondary-400" /> Invite User
              </button>
              <button type="button" onClick={() => setShowCsv(true)} className={outlineBtn}>
                <Upload size={14} /> Upload CSV
              </button>
            </div>
          </div>

          {list.isLoading ? (
            <LoadingState />
          ) : list.isError ? (
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          ) : !list.data?.items.length ? (
            <EmptyState title={`No ${tab} invitations`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className={`${thCls} pl-2`}>Email</th>
                    <th className={thCls}>Role</th>
                    <th className={thCls}>Invited</th>
                    <th className={thCls}>Expires</th>
                    <th className={thCls}>Status</th>
                    {tab === "pending" && <th className={`${thCls} text-right pr-2`}>Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {list.data.items.map((inv) => (
                    <tr key={inv.uuid} className="hover:bg-gray-50/70">
                      <td className="py-4 pl-2 font-mono text-[11px] text-gray-700">{inv.email}</td>
                      <td className="py-4">
                        <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-md text-[10px]">
                          {inv.role === "agency_admin" ? "Agency Admin" : "Learner"}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500">{formatDate(inv.invited_at)}</td>
                      <td className="py-4 text-gray-500">{formatDate(inv.expires_at)}</td>
                      <td className="py-4"><StatusPill status={inv.status} /></td>
                      {tab === "pending" && (
                        <td className="py-4 text-right pr-2">
                          <button
                            type="button"
                            disabled={revoke.isPending}
                            onClick={() => window.confirm(`Revoke the invitation for ${inv.email}?`) && revoke.mutate(inv)}
                            className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Modal open={showInvite} onClose={() => setShowInvite(false)}>
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
          <UserPlus size={20} />
        </div>
        <h3 className="text-lg font-black text-gray-900">Invite Team Member</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">An invitation link will be emailed to this address.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) invite.mutate();
          }}
          className="space-y-4"
        >
          {invite.isError && <Banner tone="error">{errorMessage(invite.error)}</Banner>}
          <div>
            <label htmlFor="invite-email" className="text-xs font-bold text-gray-700 block mb-1">Email</label>
            <input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="invite-role" className="text-xs font-bold text-gray-700 block mb-1">Role</label>
            <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
              <option value="learner">Learner</option>
              <option value="agency_admin">Agency Admin</option>
            </select>
          </div>
          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={invite.isPending} className={primaryBtn}>
              {invite.isPending ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </Modal>

      <BulkUploadModal open={showCsv} onClose={() => setShowCsv(false)} agencyId={agencyId as string} onDone={refresh} />
    </AgencyPage>
  );
}

function BulkUploadModal({ open, onClose, agencyId, onDone }: { open: boolean; onClose: () => void; agencyId: string; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (f: File) => agencyApi.bulkInvite(agencyId, await f.text()),
    onSuccess: (job) => setJobId(job.importJobId)
  });

  const job = useQuery({
    queryKey: ["agency", agencyId, "bulk-invite", jobId],
    queryFn: async ({ signal }) => {
      const result = await agencyApi.bulkInviteJob(agencyId, jobId as string, signal);
      if (result.status === "completed" || result.status === "failed") onDone();
      return result;
    },
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "completed" || s === "failed" ? false : 2000;
    }
  });

  const close = () => {
    setFile(null);
    setJobId(null);
    upload.reset();
    onClose();
  };

  const j = job.data;
  const running = upload.isPending || (Boolean(jobId) && (!j || j.status === "queued" || j.status === "processing"));

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitations-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={close}>
      <div className="w-10 h-10 rounded-xl bg-secondary-50 text-secondary-800 flex items-center justify-center mb-4">
        <FileSpreadsheet size={20} />
      </div>
      <h3 className="text-lg font-black text-gray-900">Bulk CSV Invitations</h3>
      <p className="text-xs text-gray-500 mt-1 mb-4">
        Upload a CSV with an <code>email</code> column and an optional <code>role</code> column. Invitations are processed in the background.
      </p>

      {!jobId ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 hover:border-primary-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50"
          >
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            {file ? (
              <p className="text-xs font-bold text-primary-900">{file.name}</p>
            ) : (
              <>
                <p className="text-xs font-bold text-gray-700">Click to select CSV roster file</p>
                <p className="text-[10px] text-gray-400 mt-1">UTF-8 format, max 1MB</p>
              </>
            )}
          </button>
          {upload.isError && <div className="mt-4"><Banner tone="error">{errorMessage(upload.error)}</Banner></div>}
        </>
      ) : (
        <div className="space-y-3 text-xs">
          {job.isError ? (
            <Banner tone="error">{errorMessage(job.error)}</Banner>
          ) : !j ? (
            <LoadingState label="Queued…" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Import status</span>
                <StatusPill status={j.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <div><span className="text-[10px] font-bold text-gray-400 uppercase">Rows</span><p className="text-xl font-black text-gray-900">{j.totalRows}</p></div>
                <div><span className="text-[10px] font-bold text-gray-400 uppercase">Invited</span><p className="text-xl font-black text-highlight-600">{j.invited}</p></div>
                <div><span className="text-[10px] font-bold text-gray-400 uppercase">Failed</span><p className="text-xl font-black text-red-600">{j.failed}</p></div>
              </div>
              {j.errors.length > 0 && (
                <ul className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-red-100 bg-red-50 p-3 text-[11px] text-red-700">
                  {j.errors.map((e) => (
                    <li key={`${e.row}-${e.email}`}>Row {e.row} ({e.email || "no email"}): {e.message}</li>
                  ))}
                  {j.errorsTruncated && <li className="font-bold">More errors not shown.</li>}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <div className="pt-6 flex items-center justify-between">
        <button type="button" onClick={downloadSample} className="text-xs font-bold text-secondary-600 hover:underline flex items-center gap-1">
          <Download size={13} /> Sample CSV Template
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={close} className="px-3 py-2 text-xs font-bold text-gray-500">
            {jobId && !running ? "Close" : "Cancel"}
          </button>
          {!jobId && (
            <button type="button" disabled={!file || running} onClick={() => file && upload.mutate(file)} className={primaryBtn}>
              {upload.isPending ? "Uploading..." : "Upload & Invite"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
