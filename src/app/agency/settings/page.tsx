"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Plus, ExternalLink } from "lucide-react";
import { agencyApi, agencyApiExt, agencyKeys, useAgencyScope } from "@/features/agency/api";
import { AgencyPage, Banner, StatusPill, primaryBtn, outlineBtn } from "@/features/agency/ui";
import { ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";

export default function AgencySettingsPage() {
  const { agencyId } = useAgencyScope();
  const profile = useQuery({
    queryKey: ["agency", agencyId, "profile"],
    queryFn: () => agencyApiExt.agency(agencyId as string),
    enabled: Boolean(agencyId)
  });
  const entitlements = useQuery({
    queryKey: agencyKeys.entitlements(agencyId),
    queryFn: () => agencyApi.entitlements(agencyId as string),
    enabled: Boolean(agencyId)
  });
  const portal = useMutation({
    mutationFn: () => agencyApiExt.billingPortal(agencyId as string),
    onSuccess: ({ url }) => window.location.assign(url)
  });

  const active = (entitlements.data?.items ?? []).filter((e) => e.status === "active");
  const total = active.reduce((n, e) => n + e.seats_total, 0);
  const assigned = active.reduce((n, e) => n + e.seats_assigned, 0);

  return (
    <AgencyPage title="Billing & Invoicing" subtitle="Licensed seats, Stripe billing and invoice payments">
      <div className="max-w-4xl space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-secondary-600 uppercase tracking-wider bg-secondary-50 px-2.5 py-0.5 rounded-full border border-secondary-200">
                Seat Pool License
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-2">Licensed Seat Allocation</h2>
              <p className="text-xs text-gray-500 mt-0.5">Seats can be reassigned to new agency personnel when staff turn over.</p>
            </div>
            <Link href="/agency/catalogue" className={primaryBtn}>
              <Plus size={14} className="text-secondary-400" /> Purchase Additional Seats
            </Link>
          </div>
          {entitlements.isLoading ? (
            <LoadingState />
          ) : entitlements.isError ? (
            <ErrorState error={entitlements.error} onRetry={() => entitlements.refetch()} />
          ) : (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
              <div><span className="text-[10px] font-bold text-gray-400 uppercase">Total Licensed</span><p className="text-3xl font-black text-primary-950 mt-0.5">{total}</p></div>
              <div><span className="text-[10px] font-bold text-gray-400 uppercase">Assigned Staff</span><p className="text-3xl font-black text-gray-900 mt-0.5">{assigned}</p></div>
              <div><span className="text-[10px] font-bold text-gray-400 uppercase">Available Slots</span><p className="text-3xl font-black text-highlight-600 mt-0.5">{Math.max(0, total - assigned)}</p></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Agency & Billing</h3>
          {profile.isLoading ? (
            <LoadingState />
          ) : profile.isError ? (
            <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
          ) : profile.data ? (
            <dl className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Agency Name</dt>
                <dd className="font-bold text-gray-900 mt-0.5">{profile.data.displayName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Status</dt>
                <dd className="mt-0.5"><StatusPill status={profile.data.status} /></dd>
              </div>
            </dl>
          ) : null}
          <p className="text-xs text-gray-500">
            Pay by card through Stripe Checkout or request an invoice with a purchase order number when buying seats. Payment methods,
            invoices and receipts are managed in the Stripe billing portal.
          </p>
          {portal.isError && <Banner tone="error">{errorMessage(portal.error)}</Banner>}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
            <Link href="/agency/orders" className={outlineBtn}>View Orders</Link>
            <button type="button" onClick={() => portal.mutate()} disabled={portal.isPending || !agencyId} className={primaryBtn}>
              <CreditCard size={14} className="text-secondary-400" />
              {portal.isPending ? "Opening portal..." : "Manage Billing"}
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    </AgencyPage>
  );
}
