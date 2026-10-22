"use client";

import { FileSpreadsheet, Upload, UserPlus } from "lucide-react";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { useAction } from "@/lib/api/hooks";
import type { BulkInviteResult } from "@/lib/api/types";

interface DialogProps {
  open: boolean;
  onClose: () => void;
}

export function InviteDialog({ open, onClose }: DialogProps) {
  const [email, setEmail] = useState("");
  const invite = useAction(api.invitations.invite, { invalidate: ["invitations"], success: "Invitation sent" });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;
    void invite.run(value, "learner").then((ok) => {
      if (ok === undefined) return;
      setEmail("");
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a team member"
      description="They receive an email link to set a password and join your agency as a learner."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="invite-member-form" loading={invite.pending} icon={<UserPlus className="size-4" aria-hidden />}>Send invitation</Button>
        </>
      }
    >
      <form id="invite-member-form" className="space-y-4" onSubmit={submit}>
        <Field label="Work email">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              data-autofocus
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.gov"
            />
          )}
        </Field>
        <Field label="Role">
          {({ id }) => (
            <Select id={id} value="learner" disabled>
              <option value="learner">Learner</option>
            </Select>
          )}
        </Field>
        <p className="rounded-xl bg-canvas-soft p-3 text-xs text-ink-600">
          Only platform staff can create agency administrators. Contact the platform team if a second administrator is needed.
        </p>
      </form>
    </Modal>
  );
}

function parseCsv(text: string): { email: string; role: string }[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0]!.toLowerCase().split(",").map((h) => h.trim());
  const emailIndex = header.indexOf("email");
  const roleIndex = header.indexOf("role");
  const start = emailIndex >= 0 ? 1 : 0;
  const resolvedEmail = emailIndex >= 0 ? emailIndex : 0;

  return lines.slice(start).flatMap((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const email = cells[resolvedEmail]?.replace(/^"|"$/g, "") ?? "";
    if (!email || !email.includes("@")) return [];
    const role = roleIndex >= 0 ? cells[roleIndex] ?? "learner" : "learner";
    return [{ email, role: role === "agency_admin" ? "learner" : role || "learner" }];
  });
}

export function BulkInviteDialog({ open, onClose }: DialogProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<{ email: string; role: string }[]>([]);
  const [job, setJob] = useState<BulkInviteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | null) {
    setError(null);
    setJob(null);
    setRows([]);
    setFileName(file?.name ?? null);
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      setError("No valid email addresses were found. The file needs an email column.");
      return;
    }
    setRows(parsed);
  }

  async function upload() {
    if (rows.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      let result = await api.invitations.bulk(rows, false);
      setJob(result);
      for (let attempt = 0; attempt < 20 && result.importJobId && result.status !== "completed" && result.status !== "failed"; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        result = await api.invitations.bulkJob(result.importJobId);
        setJob(result);
      }
      setFileName(null);
      setRows([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (busy) return;
    setFileName(null);
    setRows([]);
    setJob(null);
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Bulk invite by CSV"
      description="Upload a CSV with an email column and an optional role column. Invitations are queued and processed in the background."
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>Close</Button>
          <Button onClick={() => void upload()} loading={busy} disabled={rows.length === 0} icon={<Upload className="size-4" aria-hidden />}>
            {rows.length > 0 ? `Invite ${rows.length} people` : "Upload & invite"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-line bg-canvas-soft p-6 text-center transition-colors hover:border-brand-600">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0] ?? null)} />
          <FileSpreadsheet className="mx-auto mb-2 size-6 text-ink-500" aria-hidden />
          <p className="text-sm font-semibold text-ink-900">{fileName ?? "Choose a CSV file"}</p>
          <p className="mt-1 text-xs text-ink-600">UTF-8, up to 1 MB. Example: email,role</p>
        </label>

        {rows.length > 0 ? <p className="text-sm text-ink-700"><strong>{rows.length}</strong> email{rows.length === 1 ? "" : "s"} ready to invite.</p> : null}
        {error ? <p role="alert" className="rounded-xl bg-bad-bg p-3 text-sm font-medium text-bad">{error}</p> : null}

        {job ? (
          <div className="rounded-2xl bg-canvas-soft p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={job.status === "failed" ? "bad" : job.status === "completed" ? "ok" : "warn"} dot>
                {job.status ?? "queued"}
              </Badge>
              <span className="tnum text-sm text-ink-700">{job.invited} invited · {job.failed} failed · {job.totalRows} rows</span>
            </div>
            {job.errors.length > 0 ? (
              <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-bad">
                {job.errors.map((rowError) => (
                  <li key={`${rowError.row}-${rowError.email}`}>Row {rowError.row}: {rowError.email} — {rowError.message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
