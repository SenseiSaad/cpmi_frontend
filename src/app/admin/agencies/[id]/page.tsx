"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";
import { ApiError } from "@/lib/api/error";
import { platformApi } from "@/features/platform/api";
import {
  AdminPage,
  btnDark,
  btnDanger,
  btnLight,
  Field,
  formatDate,
  money,
  Panel,
  StatTile,
  StatusPill,
  tdClass,
  thClass,
  useFlash
} from "@/features/platform/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminAgencyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const valid = UUID.test(id);
  const queryClient = useQueryClient();
  const flash = useFlash();

  const agency = useQuery({
    queryKey: ["platform", "agencies", id],
    queryFn: () => platformApi.agency(id),
    enabled: valid,
    retry: false
  });
  const overview = useQuery({
    queryKey: ["platform", "agencies", id, "overview"],
    queryFn: () => platformApi.agencyOverview(id),
    enabled: valid && agency.isSuccess
  });
  const invitations = useQuery({
    queryKey: ["platform", "agencies", id, "invitations"],
    queryFn: () => platformApi.agencyInvitations(id, "pending"),
    enabled: valid && agency.isSuccess
  });
  const orders = useQuery({
    queryKey: ["platform", "agencies", id, "orders"],
    queryFn: () => platformApi.agencyOrders(id, { limit: 25 }),
    enabled: valid && agency.isSuccess
  });

  const setStatus = useMutation({
    mutationFn: (status: "active" | "suspended") => platformApi.setAgencyStatus(id, status),
    onSuccess: async () => {
      flash.success("Agency status updated.");
      await queryClient.invalidateQueries({ queryKey: ["platform", "agencies"] });
    },
    onError: (error) => flash.error(errorMessage(error))
  });

  const [email, setEmail] = useState("");
  const [roleCode, setRoleCode] = useState<"agency_admin" | "learner">("agency_admin");
  const invite = useMutation({
    mutationFn: () => platformApi.inviteAgencyMember(id, { email: email.trim(), roleCode }),
    onSuccess: async (result) => {
      flash.success(`Invitation sent to ${result.invitation.email}.`);
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["platform", "agencies", id] });
    },
    onError: (error) => flash.error(errorMessage(error))
  });
  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    invite.mutate();
  };

  const back = (
    <Link href="/admin/agencies" className={btnLight}>
      <ArrowLeft size={13} /> Back to agencies
    </Link>
  );

  if (!valid) {
    return (
      <AdminPage title="Agency">
        <EmptyState title="Agency not found" description="No agency matches that reference." action={back} />
      </AdminPage>
    );
  }
  if (agency.isPending) {
    return (
      <AdminPage title="Agency">
        <LoadingState />
      </AdminPage>
    );
  }
  if (agency.isError) {
    const notFound = agency.error instanceof ApiError && agency.error.status === 404;
    return (
      <AdminPage title="Agency">
        {notFound ? <EmptyState title="Agency not found" action={back} /> : <ErrorState error={agency.error} onRetry={() => void agency.refetch()} />}
      </AdminPage>
    );
  }

  const data = agency.data;

  return (
    <AdminPage title={data.name} subtitle={`Slug: ${data.slug ?? "—"} · Created ${formatDate(data.created_at)}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <div className="flex items-center gap-3">
          <StatusPill status={data.status} />
          {data.status === "active" ? (
            <button
              type="button"
              className={btnDanger}
              disabled={setStatus.isPending}
              onClick={() => {
                if (window.confirm(`Suspend ${data.name}? All members immediately lose access. Data is retained.`)) setStatus.mutate("suspended");
              }}
            >
              Suspend agency
            </button>
          ) : data.status === "suspended" ? (
            <button type="button" className={btnDark} disabled={setStatus.isPending} onClick={() => setStatus.mutate("active")}>
              Reactivate agency
            </button>
          ) : null}
        </div>
      </div>

      {flash.node}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatTile label="Active members" value={overview.data?.members ?? data.member_count ?? "—"} />
        <StatTile label="Seats in use" value={data.seats_used ?? "—"} hint={overview.data ? `${overview.data.seats_available} available` : undefined} />
        <StatTile label="Pending invitations" value={overview.data?.pending_invitations ?? "—"} />
        <StatTile label="Orders (30 days)" value={overview.data?.recent_orders ?? "—"} />
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <Panel title="Invite a member" description="Only platform staff can invite agency administrators.">
            <form onSubmit={submitInvite} className="space-y-4">
              <Field label="Email" htmlFor="invite-email">
                <input id="invite-email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Role" htmlFor="invite-role">
                <select id="invite-role" className="input" value={roleCode} onChange={(e) => setRoleCode(e.target.value as "agency_admin" | "learner")}>
                  <option value="agency_admin">Agency administrator</option>
                  <option value="learner">Learner</option>
                </select>
              </Field>
              <button type="submit" className={btnDark} disabled={invite.isPending}>
                <Mail size={14} className="text-secondary-400" /> {invite.isPending ? "Sending…" : "Send invitation"}
              </button>
            </form>
          </Panel>
        </div>
        <div className="lg:col-span-7">
          <Panel title="Pending invitations">
            {invitations.isPending ? (
              <LoadingState />
            ) : invitations.isError ? (
              <ErrorState error={invitations.error} onRetry={() => void invitations.refetch()} />
            ) : invitations.data.invitations.length === 0 ? (
              <EmptyState title="No pending invitations" />
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                    <th className={thClass}>Email</th>
                    <th className={thClass}>Role</th>
                    <th className={thClass}>Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {invitations.data.invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className={`${tdClass} font-bold text-gray-900`}>{inv.emailNormalized}</td>
                      <td className={`${tdClass} capitalize`}>{inv.roleCode.replace(/_/g, " ")}</td>
                      <td className={tdClass}>{formatDate(inv.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Orders">
        {orders.isPending ? (
          <LoadingState />
        ) : orders.isError ? (
          <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
        ) : orders.data.orders.length === 0 ? (
          <EmptyState title="No orders yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className={thClass}>Created</th>
                  <th className={thClass}>Product</th>
                  <th className={`${thClass} text-right`}>Seats</th>
                  <th className={thClass}>Method</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {orders.data.orders.map((order) => (
                  <tr key={order.publicId}>
                    <td className={tdClass}>{formatDate(order.createdAt)}</td>
                    <td className={`${tdClass} font-bold text-gray-900`}>{order.item?.productName ?? "—"}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{order.item?.quantity ?? "—"}</td>
                    <td className={`${tdClass} capitalize`}>
                      {order.paymentMethod}
                      {order.purchaseOrderNumber ? ` · PO ${order.purchaseOrderNumber}` : ""}
                    </td>
                    <td className={tdClass}>
                      <StatusPill status={order.status} />
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{money(order.totalMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminPage>
  );
}
