"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { agencyApiExt, formatDate, formatMoney, useAgencyScope } from "@/features/agency/api";
import { AgencyPage, Banner, Panel, StatusPill, primaryBtn, outlineBtn, thCls } from "@/features/agency/ui";
import { ErrorState, LoadingState, EmptyState } from "@/components/shared/QueryState";

const PAGE_SIZE = 25;

function CheckoutBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const checkout = params.get("checkout");
  if (checkout !== "success" && checkout !== "cancelled") return null;
  const dismiss = () => router.replace("/agency/orders");
  return checkout === "success" ? (
    <Banner tone="success" onClose={dismiss}>
      Payment received. Your seats will appear under Seat Licenses once Stripe confirms the payment.
    </Banner>
  ) : (
    <Banner tone="info" onClose={dismiss}>
      Checkout was cancelled. No payment was taken.
    </Banner>
  );
}

export default function AgencyOrdersPage() {
  const { agencyId } = useAgencyScope();
  const [page, setPage] = useState(1);
  const orders = useQuery({
    queryKey: ["agency", agencyId, "orders", { page, pageSize: PAGE_SIZE }],
    queryFn: () => agencyApiExt.orders(agencyId as string, page, PAGE_SIZE),
    enabled: Boolean(agencyId)
  });
  const data = orders.data;

  return (
    <AgencyPage title="Orders">
      <div className="space-y-4">
        <Suspense fallback={null}>
          <CheckoutBanner />
        </Suspense>
        <Panel title="Order History" action={<Link href="/agency/catalogue" className={primaryBtn}><ShoppingCart size={14} className="text-secondary-400" /> Buy Seats</Link>}>
          {orders.isLoading ? (
            <LoadingState />
          ) : orders.isError ? (
            <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
          ) : !data?.items.length ? (
            <EmptyState title="No orders yet" description="Seat purchases will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className={`${thCls} pl-2`}>Date</th>
                    <th className={thCls}>Product</th>
                    <th className={thCls}>Seats</th>
                    <th className={thCls}>Payment</th>
                    <th className={thCls}>Total</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right pr-2`}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {data.items.map((o) => (
                    <tr key={o.uuid} className="hover:bg-gray-50/70">
                      <td className="py-4 pl-2 text-gray-500">{formatDate(o.createdAt)}</td>
                      <td className="py-4 font-bold text-gray-900">{o.item?.productName ?? "—"}</td>
                      <td className="py-4">{o.item?.quantity ?? "—"}</td>
                      <td className="py-4 capitalize">{o.paymentMethod}</td>
                      <td className="py-4 font-bold text-gray-900">{formatMoney(o.totalMinor, o.currency)}</td>
                      <td className="py-4"><StatusPill status={o.status} /></td>
                      <td className="py-4 text-right pr-2">
                        <Link href={`/agency/orders/${o.uuid}`} className="text-xs font-bold text-secondary-600 hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.pages > 1 && (
                <div className="flex items-center justify-between pt-4 text-xs text-gray-500">
                  <span>Page {data.page} of {data.pages}</span>
                  <div className="flex gap-2">
                    <button type="button" className={outlineBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                    <button type="button" className={outlineBtn} disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </AgencyPage>
  );
}
