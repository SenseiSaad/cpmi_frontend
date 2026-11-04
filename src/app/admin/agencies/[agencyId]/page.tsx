"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Award, Building2, ChevronLeft, GraduationCap, Mail, Percent, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge, StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import {
  setAgencyStatus,
  useAgencyActivity,
  useAgencyEntitlements,
  useAgencyLearners,
  useAgencyOrders,
  useAgencyProfile,
  useAgencyStats,
  type AgencyLearnerLine,
  type AuditLine,
} from "@/lib/api/people";
import type { Entitlement, Order } from "@/lib/api/types";
import { auditDetail, auditLabel } from "@/lib/audit-labels";
import { formatCurrency, formatNumber } from "@/lib/utils";

type Tab = "learners" | "orders" | "seats" | "activity";
const PAGE = 10;
const date = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");
const dateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

function PagedTable<T>({
  title,
  columns,
  query,
  page,
  setPage,
  rowKey,
  empty,
}: {
  title: string;
  columns: Column<T>[];
  query: { data?: { items: T[]; total: number } | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  page: number;
  setPage: (n: number) => void;
  rowKey: (row: T) => string;
  empty: { title: string; description: string };
}) {
  return (
    <>
      <DataTable
        caption={title}
        columns={columns}
        rows={query.data?.items}
        rowKey={rowKey}
        loading={query.isPending}
        error={query.isError ? errMsg(query.error, "Could not load this list.") : undefined}
        onRetry={() => void query.refetch()}
        empty={empty}
      />
      <div className="mt-4"><Pagination page={page} pageCount={Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE))} onChange={setPage} total={query.data?.total} pageSize={PAGE} /></div>
    </>
  );
}

export default function AdminAgencyDetailPage({ params }: { params: { agencyId: string } }) {
  const agencyId = params.agencyId;
  const qc = useQueryClient();
  const toast = useToast();
  const profile = useAgencyProfile(agencyId);
  const stats = useAgencyStats(agencyId);
  const [tab, setTab] = useState<Tab>("learners");
  const [pages, setPages] = useState({ learners: 1, orders: 1, seats: 1, activity: 1 });
  const setPage = (key: keyof typeof pages) => (n: number) => setPages((p) => ({ ...p, [key]: n }));
  const q = (key: keyof typeof pages) => ({ limit: PAGE, offset: (pages[key] - 1) * PAGE });

  const learners = useAgencyLearners(agencyId, q("learners"), tab === "learners");
  const orders = useAgencyOrders(agencyId, q("orders"), tab === "orders");
  const seats = useAgencyEntitlements(agencyId, q("seats"), tab === "seats");
  const activity = useAgencyActivity(agencyId, q("activity"), tab === "activity");

  const [statusDialog, setStatusDialog] = useState<"suspend" | "reactivate" | null>(null);
  const [entitlementDialog, setEntitlementDialog] = useState<{ ent: Entitlement; action: "suspend" | "reactivate" | "revoke" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const back = (
    <Link href="/admin/agencies" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-600 hover:text-brand-800">
      <ChevronLeft className="size-4" aria-hidden /> All agencies
    </Link>
  );

  if (profile.isError) {
    return (
      <>
        {back}
        <Panel><ErrorState message={errMsg(profile.error, "This agency could not be loaded.")} onRetry={() => void profile.refetch()} /></Panel>
      </>
    );
  }
  if (profile.isPending || !profile.data) {
    return (
      <>
        {back}
        <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-24" /><Skeleton className="h-64" /></div>
      </>
    );
  }
  const a = profile.data;
  const s = stats.data;

  async function changeAgency(action: "suspend" | "reactivate") {
    setBusy(true);
    try {
      await setAgencyStatus(agencyId, action === "suspend" ? "suspended" : "active");
      await Promise.all(["agency-detail", "agencies", "agency"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
      toast.success(action === "suspend" ? "Agency suspended" : "Agency reactivated");
      setStatusDialog(null);
    } catch (e) {
      toast.error("That didn't work", errMsg(e, ""));
    } finally {
      setBusy(false);
    }
  }
  async function changeEntitlement() {
    if (!entitlementDialog) return;
    setBusy(true);
    try {
      await api.platform.entitlementStatus(entitlementDialog.ent.id, entitlementDialog.action, note.trim());
      await qc.invalidateQueries({ queryKey: ["agency-detail", agencyId] });
      toast.success("Subscription updated");
      setEntitlementDialog(null);
      setNote("");
    } catch (e) {
      toast.error("That didn't work", errMsg(e, ""));
    } finally {
      setBusy(false);
    }
  }

  const learnerColumns: Column<AgencyLearnerLine>[] = [
    {
      key: "learner",
      header: "Learner",
      width: "minmax(0,1.6fr)",
      cell: (r) => (
        <div className="min-w-0">
          <Link href={`/admin/agencies/${agencyId}/learners/${r.membershipId}`} className="block truncate font-semibold text-ink-900 hover:text-brand-800 hover:underline">{r.learnerName}</Link>
          <p className="truncate font-mono text-xs text-ink-600">{r.email}</p>
        </div>
      ),
    },
    { key: "course", header: "Course", width: "minmax(0,1.4fr)", cell: (r) => <span className="truncate text-ink-700">{r.courseTitle}</span> },
    {
      key: "progress",
      header: "Progress",
      width: "minmax(0,1fr)",
      cell: (r) => (
        <div className="w-full">
          <p className="tnum text-sm font-semibold text-ink-900">{Math.round(r.progressPercent)}%</p>
          <ProgressBar value={r.progressPercent} label={`${r.learnerName} progress`} className="mt-1" />
        </div>
      ),
    },
    { key: "exams", header: "Exams passed", width: "110px", cell: (r) => <span className="tnum text-ink-700">{r.assessmentsPassed}/{r.assessmentsTotal}</span> },
    {
      key: "status",
      header: "Status",
      width: "130px",
      cell: (r) => <Badge tone={r.enrollmentStatus === "completed" ? "ok" : r.enrollmentStatus === "in_progress" ? "brand" : "neutral"} dot>{r.enrollmentStatus === "assigned" ? "Not started" : r.enrollmentStatus.replace(/_/g, " ")}</Badge>,
    },
  ];

  const orderColumns: Column<Order>[] = [
    { key: "date", header: "Date", width: "130px", cell: (o) => <span className="text-ink-700">{date(o.createdAt)}</span> },
    { key: "product", header: "Product", width: "minmax(0,1.6fr)", cell: (o) => <span className="truncate font-semibold text-ink-900">{o.item?.productName ?? "—"}</span> },
    { key: "seats", header: "Seats", width: "80px", cell: (o) => <span className="tnum text-ink-700">{o.item?.quantity ?? "—"}</span> },
    { key: "total", header: "Total", width: "120px", cell: (o) => <span className="tnum font-semibold">{formatCurrency(o.totalMinor / 100)}</span> },
    { key: "method", header: "Paid by", width: "140px", cell: (o) => <span className="text-ink-700">{o.paymentMethod === "card" ? "Card" : o.purchaseOrderNumber ? `PO ${o.purchaseOrderNumber}` : "Invoice"}</span> },
    { key: "status", header: "Status", width: "110px", cell: (o) => <StatusPill status={o.status} /> },
  ];

  const seatColumns: Column<Entitlement>[] = [
    { key: "product", header: "Product", width: "minmax(0,1.6fr)", cell: (e) => <span className="truncate font-semibold text-ink-900">{e.productName}</span> },
    { key: "status", header: "Status", width: "120px", cell: (e) => <StatusPill status={e.status} /> },
    {
      key: "seats",
      header: "Seats used",
      width: "minmax(0,1fr)",
      cell: (e) => (
        <div className="w-full">
          <p className="tnum text-sm font-semibold text-ink-900">{formatNumber(e.seatsUsed)} / {formatNumber(e.seatCapacity)}</p>
          <ProgressBar value={e.seatCapacity ? (e.seatsUsed / e.seatCapacity) * 100 : 0} label={`${e.productName} seats`} className="mt-1" />
        </div>
      ),
    },
    { key: "valid", header: "Valid until", width: "130px", cell: (e) => <span className="text-ink-700">{date(e.validUntil)}</span> },
    {
      key: "actions",
      header: "Actions",
      width: "210px",
      cell: (e) => (
        <div className="flex flex-wrap gap-1.5">
          {e.status === "active" ? <Button size="sm" variant="secondary" onClick={() => setEntitlementDialog({ ent: e, action: "suspend" })}>Suspend</Button> : null}
          {e.status === "suspended" ? <Button size="sm" variant="secondary" onClick={() => setEntitlementDialog({ ent: e, action: "reactivate" })}>Reactivate</Button> : null}
          {e.status === "active" || e.status === "suspended" ? <Button size="sm" variant="ghost" onClick={() => setEntitlementDialog({ ent: e, action: "revoke" })}>Revoke</Button> : null}
        </div>
      ),
    },
  ];

  const activityColumns: Column<AuditLine>[] = [
    { key: "when", header: "When", width: "170px", cell: (r) => <span className="text-ink-700">{dateTime(r.occurredAt)}</span> },
    {
      key: "what",
      header: "What happened",
      width: "minmax(0,2fr)",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{auditLabel(r.action)}</p>
          {auditDetail(r.action, r.metadata) ? <p className="truncate text-xs text-ink-600">{auditDetail(r.action, r.metadata)}</p> : null}
        </div>
      ),
    },
    { key: "by", header: "By", width: "110px", cell: (r) => <span className="capitalize text-ink-600">{r.actorType}</span> },
  ];

  return (
    <>
      {back}
      <header className="mb-6 rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04]">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy-900 text-brand-200" aria-hidden><Building2 className="size-6" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-navy-900">{a.name}</h1>
              <StatusPill status={a.status} />
            </div>
            <p className="mt-0.5 text-sm text-ink-600">{a.legalName !== a.name ? `${a.legalName} · ` : ""}<span className="font-mono">{a.slug}</span> · created {date(a.createdAt)}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-700">
              <span className="inline-flex items-center gap-1.5"><Mail className="size-4 text-ink-500" aria-hidden /> Billing: {a.billingEmail ?? "—"}</span>
              <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-ink-500" aria-hidden /> {a.admins.length === 0 ? "No administrator yet (waiting for the invitation to be accepted)" : `Administrator${a.admins.length === 1 ? "" : "s"}: ${a.admins.map((x) => `${x.name} (${x.email})`).join(", ")}`}</span>
            </p>
          </div>
          {a.status === "active" ? (
            <Button variant="secondary" onClick={() => setStatusDialog("suspend")}>Suspend agency</Button>
          ) : a.status === "suspended" ? (
            <Button onClick={() => setStatusDialog("reactivate")}>Reactivate agency</Button>
          ) : null}
        </div>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Learners" value={formatNumber(a.learners)} hint={`${formatNumber(a.activeMembers)} active of ${formatNumber(a.members)} people`} icon={Users} />
        <StatCard label="Seats in use" value={s ? `${formatNumber(s.seats.assigned)} / ${formatNumber(s.seats.capacity)}` : "…"} hint="Assigned of purchased" icon={Ticket} />
        <StatCard label="Courses completed" value={s ? `${formatNumber(s.enrollments.completed)} / ${formatNumber(s.enrollments.total)}` : "…"} hint={s?.enrollments.completionPercent != null ? `${Math.round(s.enrollments.completionPercent)}% complete` : "No enrollments yet"} icon={GraduationCap} />
        <StatCard label="Exam pass rate" value={s?.assessments.passRatePercent != null ? `${Math.round(s.assessments.passRatePercent)}%` : "—"} hint={s ? `${formatNumber(s.assessments.graded)} graded attempts` : undefined} icon={Percent} />
        <StatCard label="Certificates" value={s ? formatNumber(s.certificates.issued) : "…"} hint={s && s.certificates.revoked ? `${s.certificates.revoked} revoked` : "Issued to learners"} icon={Award} />
      </div>

      <div className="mb-4">
        <Tabs label="Agency sections" value={tab} onChange={setTab} items={[{ value: "learners", label: "Learners" }, { value: "orders", label: "Orders" }, { value: "seats", label: "Seats & subscriptions" }, { value: "activity", label: "Activity" }]} />
      </div>

      <Panel>
        {tab === "learners" ? (
          <PagedTable title="Learners" columns={learnerColumns} query={learners} page={pages.learners} setPage={setPage("learners")} rowKey={(r) => `${r.membershipId}-${r.courseTitle}-${r.assignedAt}`} empty={{ title: "No learners on a course yet", description: "When the agency assigns seats, its learners and their progress appear here." }} />
        ) : tab === "orders" ? (
          <PagedTable title="Orders" columns={orderColumns} query={orders} page={pages.orders} setPage={setPage("orders")} rowKey={(o) => o.publicId} empty={{ title: "No orders yet", description: "Purchases made by this agency appear here." }} />
        ) : tab === "seats" ? (
          <PagedTable title="Seats and subscriptions" columns={seatColumns} query={seats} page={pages.seats} setPage={setPage("seats")} rowKey={(e) => e.id} empty={{ title: "No subscriptions yet", description: "Once the agency buys a course, its seat pool appears here." }} />
        ) : (
          <PagedTable title="Activity" columns={activityColumns} query={activity} page={pages.activity} setPage={setPage("activity")} rowKey={(r) => r.id} empty={{ title: "No activity recorded", description: "Everything that happens in this agency is logged here permanently." }} />
        )}
      </Panel>

      <Modal
        open={!!statusDialog}
        onClose={() => setStatusDialog(null)}
        title={statusDialog === "suspend" ? `Suspend ${a.name}?` : `Reactivate ${a.name}?`}
        description={statusDialog === "suspend" ? "Nobody in this agency will be able to sign in until you reactivate it. Nothing is deleted." : "People in this agency will be able to sign in again."}
        footer={<><Button variant="ghost" onClick={() => setStatusDialog(null)}>Cancel</Button><Button variant={statusDialog === "suspend" ? "danger" : "primary"} loading={busy} onClick={() => statusDialog && void changeAgency(statusDialog)}>{statusDialog === "suspend" ? "Suspend agency" : "Reactivate agency"}</Button></>}
      >
        <p className="text-sm text-ink-700">This is recorded in the activity log.</p>
      </Modal>

      <Modal
        open={!!entitlementDialog}
        onClose={() => { setEntitlementDialog(null); setNote(""); }}
        title={entitlementDialog ? `${entitlementDialog.action === "suspend" ? "Suspend" : entitlementDialog.action === "reactivate" ? "Reactivate" : "Revoke"} ${entitlementDialog.ent.productName}` : ""}
        description={entitlementDialog?.action === "revoke" ? "Revoking ends this subscription's access for good. Use it for refunds or fraud." : entitlementDialog?.action === "suspend" ? "Learners keep their seats but cannot use the course until it is reactivated." : "Learners get their access back."}
        footer={<><Button variant="ghost" onClick={() => { setEntitlementDialog(null); setNote(""); }}>Cancel</Button><Button variant={entitlementDialog?.action === "revoke" ? "danger" : "primary"} loading={busy} disabled={note.trim().length < 3} onClick={() => void changeEntitlement()}>Confirm</Button></>}
      >
        <Field label="Reason" required hint="Kept in the permanent record.">
          {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </Modal>
    </>
  );
}
