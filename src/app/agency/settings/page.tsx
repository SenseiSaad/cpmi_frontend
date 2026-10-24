"use client";

import { Building2, CreditCard, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useEntitlements } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { formatNumber } from "@/lib/utils";

export default function AgencySettingsPage() {
  const { user, signOut } = useSession();
  const entitlements = useEntitlements();
  const router = useRouter();
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  async function openBillingPortal() {
    setPortalBusy(true);
    setPortalError(null);
    try {
      const { url } = await api.store.billingPortal();
      if (url) window.location.assign(url);
      else setPortalError("Stripe did not return a billing portal link.");
    } catch (error) {
      setPortalError(error instanceof Error ? error.message : "Could not open the billing portal.");
    } finally {
      setPortalBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Settings"
        subtitle="Agency identity, seat entitlements and billing."
        actions={<Button variant="secondary" icon={<LogOut className="size-4" aria-hidden />} onClick={() => void handleSignOut()}>Sign out</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Agency" description="Tenant identity and your membership." action={<Building2 className="size-5 text-ink-500" aria-hidden />} />
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <dt className="text-ink-600">Name</dt>
              <dd className="text-right font-semibold text-ink-900">{user?.agency?.displayName ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <dt className="text-ink-600">Slug</dt>
              <dd className="font-mono text-xs text-ink-900">{user?.agency?.slug ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <dt className="text-ink-600">Your role</dt>
              <dd><Badge tone="navy">{user?.role.replace(/_/g, " ") ?? "—"}</Badge></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-ink-600"><UserRound className="size-4" aria-hidden /> Signed in as</dt>
              <dd className="text-right">
                <p className="font-semibold text-ink-900">{user ? `${user.firstName} ${user.lastName}` : "—"}</p>
                <p className="font-mono text-xs text-ink-600">{user?.email ?? "—"}</p>
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <PanelHeader title="Billing" description="Card payments and purchase-order invoicing are handled by Stripe." action={<CreditCard className="size-5 text-ink-500" aria-hidden />} />
          <p className="text-sm text-ink-600">
            Open the Stripe billing portal to update the payment method, download invoices or manage the subscription.
          </p>
          {portalError ? <p role="alert" className="mt-3 rounded-xl bg-bad-bg p-3 text-sm text-bad">{portalError}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button loading={portalBusy} onClick={() => void openBillingPortal()}>Open billing portal</Button>
            <ButtonLink href="/agency/orders" variant="secondary">Order history</ButtonLink>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelHeader
          title="Seat entitlements"
          description="Active and historical seat pools for this agency."
          action={<ButtonLink href="/agency/seats" variant="secondary" size="sm">Manage seats</ButtonLink>}
        />
        {entitlements.isPending ? (
          <p className="py-4 text-sm text-ink-600">Loading entitlements…</p>
        ) : entitlements.isError ? (
          <p className="py-4 text-sm text-bad">Could not load entitlements.</p>
        ) : (entitlements.data?.length ?? 0) === 0 ? (
          <p className="py-4 text-sm text-ink-600">No entitlements yet. Buy seats from the store to create one.</p>
        ) : (
          <ul className="divide-y divide-line">
            {entitlements.data?.map((ent) => (
              <li key={ent.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-ink-900">{ent.productName}</p>
                  <p className="text-xs text-ink-600">
                    {new Date(ent.validFrom).toLocaleDateString()} – {new Date(ent.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <ProgressBar value={ent.seatCapacity > 0 ? (ent.seatsUsed / ent.seatCapacity) * 100 : 0} label={`${ent.productName} seats`} showValue />
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="tnum text-sm text-ink-600">{formatNumber(ent.seatsUsed)} / {formatNumber(ent.seatCapacity)}</span>
                  <StatusPill status={ent.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
