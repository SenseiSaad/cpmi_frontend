"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, CreditCard, FileText, BookOpen } from "lucide-react";
import { agencyApi, formatMoney, newIdempotencyKey, useAgencyScope, type StoreProduct } from "@/features/agency/api";
import { AgencyPage, Banner, Modal, primaryBtn, inputCls } from "@/features/agency/ui";
import { ErrorState, LoadingState, EmptyState, errorMessage } from "@/components/shared/QueryState";

export default function AgencyCataloguePage() {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const products = useQuery({ queryKey: ["store", "products"], queryFn: () => agencyApi.storeProducts() });

  return (
    <AgencyPage title="Course Catalogue" subtitle="Purchase training seats for your agency">
      {products.isLoading ? (
        <LoadingState />
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : !products.data?.items.length ? (
        <EmptyState title="No products available" description="There are no courses for sale right now." />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.data.items.map((p) => {
            const active = (p.prices ?? []).filter((x) => x.isActive);
            return (
              <div key={p.uuid} className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
                  <BookOpen size={20} />
                </div>
                <h2 className="text-base font-black text-gray-900">{p.name}</h2>
                {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-4">{p.description}</p>}
                <div className="mt-4 space-y-1 flex-1">
                  {active.length === 0 ? (
                    <p className="text-xs text-gray-400">No active pricing</p>
                  ) : (
                    active.map((price) => (
                      <p key={price.id} className="text-sm font-black text-primary-950">
                        {formatMoney(price.unitAmountMinor, price.currency)}
                        <span className="text-[11px] font-semibold text-gray-500"> / seat / {price.billingPeriod === "annual" ? "year" : "month"}</span>
                      </p>
                    ))
                  )}
                </div>
                <button type="button" disabled={active.length === 0} onClick={() => setProduct(p)} className={`${primaryBtn} mt-5`}>
                  <ShoppingCart size={14} className="text-secondary-400" /> Buy Seats
                </button>
              </div>
            );
          })}
        </div>
      )}
      {product && <BuyModal product={product} onClose={() => setProduct(null)} />}
    </AgencyPage>
  );
}

function BuyModal({ product, onClose }: { product: StoreProduct; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { agencyId } = useAgencyScope();
  const prices = (product.prices ?? []).filter((p) => p.isActive);
  const [priceId, setPriceId] = useState(prices.find((p) => p.billingPeriod === "annual")?.id ?? prices[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<"card" | "invoice">("card");
  const [po, setPo] = useState("");

  // One key per distinct checkout: retries/double-clicks replay the same order.
  const idempotencyKey = useMemo(() => newIdempotencyKey(), [priceId, quantity, method, po]); // eslint-disable-line react-hooks/exhaustive-deps

  const price = prices.find((p) => p.id === priceId);
  const total = price ? price.unitAmountMinor * quantity : undefined;

  const order = useMutation({
    mutationFn: () =>
      agencyApi.createOrder({
        agencyId: agencyId as string,
        priceId,
        quantity,
        paymentMethod: method,
        purchaseOrderNumber: method === "invoice" && po.trim() ? po.trim() : undefined,
        idempotencyKey
      }),
    onSuccess: async (result) => {
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["agency", agencyId, "orders"] });
      router.push(`/agency/orders/${result.order.uuid}`);
    }
  });

  const validQty = Number.isInteger(quantity) && quantity >= 1 && quantity <= 1000;

  return (
    <Modal open onClose={onClose}>
      <h3 className="text-lg font-black text-gray-900 pr-6">Buy Seats: {product.name}</h3>
      <form
        className="space-y-4 mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (validQty && priceId) order.mutate();
        }}
      >
        {order.isError && <Banner tone="error">{errorMessage(order.error)}</Banner>}
        {prices.length > 1 && (
          <div>
            <label htmlFor="buy-price" className="text-xs font-bold text-gray-700 block mb-1">Billing period</label>
            <select id="buy-price" value={priceId} onChange={(e) => setPriceId(e.target.value)} className={inputCls}>
              {prices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.billingPeriod === "annual" ? "Annual" : "Monthly"} · {formatMoney(p.unitAmountMinor, p.currency)} / seat
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="buy-qty" className="text-xs font-bold text-gray-700 block mb-1">Number of seats</label>
          <input
            id="buy-qty"
            type="number"
            min={1}
            max={1000}
            required
            value={Number.isNaN(quantity) ? "" : quantity}
            onChange={(e) => setQuantity(e.target.valueAsNumber)}
            className={inputCls}
          />
        </div>
        <fieldset>
          <legend className="text-xs font-bold text-gray-700 mb-1">Payment method</legend>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["card", "Card (Stripe)", CreditCard],
              ["invoice", "Invoice / PO", FileText]
            ] as const).map(([value, label, Icon]) => (
              <label
                key={value}
                className={`flex items-center gap-2 px-3.5 py-2.5 border rounded-xl text-xs font-bold cursor-pointer ${
                  method === value ? "border-primary-500 bg-primary-50 text-primary-900" : "border-gray-200 text-gray-700"
                }`}
              >
                <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} className="sr-only" />
                <Icon size={14} className="text-secondary-600" /> {label}
              </label>
            ))}
          </div>
        </fieldset>
        {method === "invoice" && (
          <div>
            <label htmlFor="buy-po" className="text-xs font-bold text-gray-700 block mb-1">Purchase order number (optional)</label>
            <input id="buy-po" type="text" maxLength={100} value={po} onChange={(e) => setPo(e.target.value)} className={`${inputCls} font-mono`} />
          </div>
        )}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
          <span className="font-bold text-gray-500">Subtotal</span>
          <span className="text-base font-black text-primary-950">{validQty ? formatMoney(total, price?.currency) : "—"}</span>
        </div>
        <div className="pt-2 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs font-bold text-gray-500">Cancel</button>
          <button type="submit" disabled={!validQty || !priceId || order.isPending} className={primaryBtn}>
            {order.isPending ? "Placing order..." : method === "card" ? "Continue to Payment" : "Request Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
