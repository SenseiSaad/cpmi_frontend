"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { agencyApiExt, agencyKeys, formatDate, formatMoney, useAgencyScope } from "@/features/agency/api";
import { AgencyPage, Panel, StatusPill } from "@/features/agency/ui";
import { ErrorState, LoadingState } from "@/components/shared/QueryState";

export default function AgencyOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { agencyId } = useAgencyScope();
  const order = useQuery({
    queryKey: [...agencyKeys.order(id), agencyId],
    queryFn: () => agencyApiExt.order(agencyId as string, id),
    enabled: Boolean(agencyId && id)
  });
  const o = order.data;

  return (
    <AgencyPage title="Order Details">
      <div className="max-w-3xl space-y-4">
        <Link href="/agency/orders" className="inline-flex items-center gap-1 text-xs font-bold text-secondary-600 hover:underline">
          <ArrowLeft size={13} /> Back to orders
        </Link>
        {order.isLoading ? (
          <LoadingState />
        ) : order.isError ? (
          <ErrorState error={order.error} onRetry={() => order.refetch()} />
        ) : o ? (
          <>
            <Panel title="Summary" action={<StatusPill status={o.status} />}>
              <dl className="grid sm:grid-cols-2 gap-4 text-xs">
                {[
                  ["Order ID", <span key="id" className="font-mono">{o.uuid}</span>],
                  ["Placed", formatDate(o.createdAt)],
                  ["Payment method", o.paymentMethod === "card" ? "Card (Stripe)" : "Invoice"],
                  ["Paid", o.paidAt ? formatDate(o.paidAt) : "Not yet paid"],
                  ...(o.purchaseOrderNumber ? [["PO number", <span key="po" className="font-mono">{o.purchaseOrderNumber}</span>]] : [])
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{k}</dt>
                    <dd className="font-bold text-gray-900 mt-0.5 break-all">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title="Items">
              {o.item ? (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                      <th className="pb-3 pl-2">Product</th>
                      <th className="pb-3">Period</th>
                      <th className="pb-3">Seats</th>
                      <th className="pb-3">Unit price</th>
                      <th className="pb-3 text-right pr-2">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium text-gray-700">
                    <tr>
                      <td className="py-3 pl-2 font-bold text-gray-900">{o.item.productName}</td>
                      <td className="py-3 capitalize">{o.item.billingPeriod}</td>
                      <td className="py-3">{o.item.quantity}</td>
                      <td className="py-3">{formatMoney(o.item.unitAmountMinor, o.currency)}</td>
                      <td className="py-3 text-right pr-2">{formatMoney(o.item.lineTotalMinor, o.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-gray-500">No line items.</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-xs ml-auto max-w-xs">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold">{formatMoney(o.subtotalMinor, o.currency)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-bold">{formatMoney(o.taxMinor, o.currency)}</span></div>
                <div className="flex justify-between text-sm"><span className="font-black text-gray-900">Total</span><span className="font-black text-primary-950">{formatMoney(o.totalMinor, o.currency)}</span></div>
              </div>
            </Panel>
          </>
        ) : null}
      </div>
    </AgencyPage>
  );
}
