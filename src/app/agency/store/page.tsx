"use client";

import { CreditCard, ExternalLink, Receipt, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChoiceCard, Field, Input } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { api } from "@/lib/api";
import { useAction, useStoreProducts } from "@/lib/api/hooks";
import type { StoreProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";

export default function AgencyStorePage() {
  const products = useStoreProducts();
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [priceId, setPriceId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "invoice">("card");
  const [poNumber, setPoNumber] = useState("");
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  const placeOrder = useAction(api.store.placeOrder, { invalidate: ["orders", "entitlements", "agency-overview"], success: "Order created" });

  const activeProduct = selectedProduct;
  const selectedPrice = useMemo(() => activeProduct?.prices.find((price) => price.id === priceId) ?? null, [activeProduct, priceId]);
  const totalMinor = (selectedPrice?.unitAmountMinor ?? 0) * quantity;

  function chooseProduct(product: StoreProduct) {
    setSelectedProduct(product);
    setPriceId(product.prices.find((price) => price.isActive)?.id ?? product.prices[0]?.id ?? "");
    setQuantity(1);
    setPaymentMethod("card");
    setPoNumber("");
    setPlacedId(null);
  }

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

  function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedPrice) return;
    void placeOrder
      .run({
        priceId: selectedPrice.id,
        quantity,
        paymentMethod,
        ...(paymentMethod === "invoice" && poNumber.trim() ? { purchaseOrderNumber: poNumber.trim() } : {}),
      })
      .then((result) => {
        if (!result || result === true) return;
        if (result.checkoutUrl) {
          window.location.assign(result.checkoutUrl);
          return;
        }
        setPlacedId(result.order.publicId);
      });
  }

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Buy seats"
        subtitle="Purchase program seats by card or government purchase order. Invoices are net 30."
        actions={<Button variant="secondary" loading={portalBusy} icon={<ExternalLink className="size-4" aria-hidden />} onClick={() => void openBillingPortal()}>Billing portal</Button>}
      />

      {portalError ? <p role="alert" className="mb-4 rounded-xl bg-bad-bg p-3 text-sm text-bad">{portalError}</p> : null}

      {products.isError ? (
        <Panel><ErrorState message={products.error instanceof Error ? products.error.message : undefined} onRetry={() => void products.refetch()} /></Panel>
      ) : products.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : (products.data?.length ?? 0) === 0 ? (
        <Panel>
          <div className="py-10 text-center">
            <p className="text-lg font-bold text-ink-900">No products are on sale</p>
            <p className="mt-1 text-sm text-ink-600">The catalog team has not published a purchasable product yet.</p>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {products.data?.map((product) => {
              const active = product.publicId === activeProduct?.publicId;
              const prices = product.prices.filter((price) => price.isActive);
              return (
                <button
                  key={product.publicId}
                  type="button"
                  onClick={() => chooseProduct(product)}
                  aria-pressed={active}
                  className={`rounded-3xl p-5 text-left shadow-card ring-1 transition-all ${active ? "bg-white ring-2 ring-brand-700" : "bg-white ring-navy-900/[0.04] hover:ring-navy-300"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-ink-900">{product.name}</p>
                    <Badge tone="navy"><span className="capitalize">{product.productType}</span></Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-600">{product.code}</p>
                  <div className="mt-4 space-y-1.5">
                    {prices.length === 0 ? (
                      <p className="text-sm text-ink-500">No active price</p>
                    ) : (
                      prices.map((price) => (
                        <p key={price.id} className="flex items-baseline justify-between text-sm">
                          <span className="capitalize text-ink-600">{price.billingPeriod}</span>
                          <span className="tnum font-bold text-ink-900">{formatCurrency(price.unitAmountMinor / 100)} <span className="text-xs font-medium text-ink-500">/ seat</span></span>
                        </p>
                      ))
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <Panel className="lg:col-span-5">
            <PanelHeader title="Checkout" description={activeProduct ? activeProduct.name : "Choose a product to continue."} action={<ShoppingCart className="size-5 text-ink-500" aria-hidden />} />
            {!activeProduct ? (
              <p className="py-12 text-center text-sm text-ink-600">Select a product on the left.</p>
            ) : placedId ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-ok-bg p-4">
                  <p className="font-semibold text-ok">Order created</p>
                  <p className="mt-1 break-all font-mono text-xs text-ink-700">{placedId}</p>
                </div>
                <p className="text-sm text-ink-600">Seats are activated once payment is confirmed. You can track the order in your order history.</p>
                <ButtonLink href="/agency/orders" variant="primary" icon={<Receipt className="size-4" aria-hidden />}>View orders</ButtonLink>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={submitOrder}>
                {activeProduct.prices.length > 1 ? (
                  <Field label="Billing period">
                    {({ id }) => (
                      <div className="grid gap-2">
                        {activeProduct.prices.map((price) => (
                          <ChoiceCard
                            key={price.id}
                            name={`price-${id}`}
                            checked={priceId === price.id}
                            onChange={() => setPriceId(price.id)}
                            title={`${price.billingPeriod === "annual" ? "Annual" : "Monthly"} — ${formatCurrency(price.unitAmountMinor / 100)} per seat`}
                            description={price.isActive ? "Current price" : "Scheduled price"}
                          />
                        ))}
                      </div>
                    )}
                  </Field>
                ) : null}

                <Field label="Number of seats">
                  {({ id, describedBy }) => (
                    <Input id={id} aria-describedby={describedBy} type="number" min={1} max={1000} step={1} required value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))} />
                  )}
                </Field>

                <Field label="Payment method">
                  {() => (
                    <div className="grid gap-2">
                      <ChoiceCard checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} title="Card" description="Pay now through Stripe Checkout." icon={<CreditCard className="size-4" aria-hidden />} />
                      <ChoiceCard checked={paymentMethod === "invoice"} onChange={() => setPaymentMethod("invoice")} title="Purchase order (net 30)" description="Generate an invoice for procurement." icon={<Receipt className="size-4" aria-hidden />} />
                    </div>
                  )}
                </Field>

                {paymentMethod === "invoice" ? (
                  <Field label="Purchase order number" optional>
                    {({ id, describedBy }) => (
                      <Input id={id} aria-describedby={describedBy} value={poNumber} onChange={(e) => setPoNumber(e.target.value)} maxLength={80} placeholder="PO-2026-00142" />
                    )}
                  </Field>
                ) : null}

                <div className="rounded-2xl bg-canvas-soft p-4">
                  <div className="flex items-center justify-between text-sm text-ink-600">
                    <span>{selectedPrice ? `${formatCurrency(selectedPrice.unitAmountMinor / 100)} × ${quantity}` : "—"}</span>
                    <span className="tnum text-lg font-extrabold text-ink-900">{formatCurrency(totalMinor / 100)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-600">Tax is calculated at checkout.</p>
                </div>

                <Button type="submit" className="w-full" loading={placeOrder.pending} disabled={!selectedPrice}>
                  {paymentMethod === "card" ? "Continue to secure checkout" : "Create invoice order"}
                </Button>
              </form>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
