"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, FileText, Receipt, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useAction, useOrders } from "@/lib/api/hooks";
import type { Order } from "@/lib/api/types";
import { formatCurrency, formatNumber, relativeDays } from "@/lib/utils";

const PAGE_SIZE = 10;
/** Queries that change when an order is activated (new entitlement, new seats). */
const AFFECTED_QUERIES = ["orders", "entitlements", "seats"] as const;

function buildColumns(onPay: (orderId: string) => void, payingId: string | null): Column<Order>[] {
  return [
    {
      key: "order",
      header: "Order",
      width: "minmax(0,2fr)",
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{o.item?.productName ?? "Order"}</p>
          <p className="truncate font-mono text-xs text-ink-600">{o.publicId}</p>
        </div>
      ),
    },
    { key: "qty", header: "Seats", width: "80px", align: "right", cell: (o) => <span className="tnum">{o.item?.quantity ?? "—"}</span> },
    {
      key: "total",
      header: "Total",
      width: "120px",
      align: "right",
      cell: (o) => (
        <div>
          <p className="tnum font-semibold text-ink-900">{formatCurrency(o.totalMinor / 100)}</p>
          <p className="text-xs uppercase text-ink-500">{o.currency}</p>
        </div>
      ),
    },
    { key: "method", header: "Payment", width: "120px", cell: (o) => <span className="capitalize text-ink-700">{o.paymentMethod}</span> },
    { key: "status", header: "Status", width: "120px", cell: (o) => <StatusPill status={o.status} /> },
    {
      key: "po",
      header: "PO number",
      width: "140px",
      cell: (o) => <span className="truncate font-mono text-xs text-ink-600">{o.purchaseOrderNumber ?? "—"}</span>,
    },
    { key: "created", header: "Created", width: "120px", cell: (o) => <span className="text-ink-600">{o.createdAt ? relativeDays(o.createdAt) : "—"}</span> },
    {
      key: "action",
      header: "Action",
      width: "170px",
      align: "right",
      cell: (o) => {
        if (o.status !== "pending") return null;
        const isCard = o.paymentMethod === "card";
        return (
          <Button
            size="sm"
            icon={isCard ? <CreditCard className="size-4" aria-hidden /> : <FileText className="size-4" aria-hidden />}
            loading={payingId === o.publicId}
            disabled={payingId !== null}
            onClick={() => onPay(o.publicId)}
          >
            {isCard ? "Complete payment" : "Pay invoice"}
          </Button>
        );
      },
    },
  ];
}

export default function AgencyOrdersPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const toast = useToast();
  const orders = useOrders({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const total = orders.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const resume = useAction(api.store.resumeCheckout);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  /**
   * Ask the server to settle pending orders against Stripe. This is what confirms a payment when the
   * Stripe webhook did not (or has not yet been set up to) tell us, e.g. right after returning from
   * Checkout, or when an invoice was paid later by someone else.
   */
  const checkPayments = useCallback(
    async (announce: boolean) => {
      setChecking(true);
      let result: { fulfilled: number; pending: number } | null = null;
      try {
        result = await api.store.refreshPending();
      } catch (error) {
        // The automatic check on arrival stays quiet (the list below still loads); only a click on
        // "Check payment status" reports a problem.
        if (announce) toast.error("Could not check payments", error instanceof Error ? error.message : undefined);
      }
      setChecking(false);
      if (!result) return;
      if (result.fulfilled > 0) {
        toast.success(
          result.fulfilled === 1 ? "Payment confirmed" : `${result.fulfilled} payments confirmed`,
          "Your seats are ready to assign.",
        );
      } else if (announce) {
        toast.info(
          result.pending > 0 ? "No payment received yet" : "Everything is up to date",
          result.pending > 0 ? "Stripe has not recorded a payment for your pending orders yet." : undefined,
        );
      }
      await Promise.all(AFFECTED_QUERIES.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    },
    // `toast` is stable; listing it would re-create this on every render and re-run the arrival check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient],
  );

  // Once on arrival (including the return from Stripe Checkout), settle whatever Stripe already knows.
  const checkedOnArrival = useRef(false);
  useEffect(() => {
    if (checkedOnArrival.current) return;
    checkedOnArrival.current = true;
    void checkPayments(false);
  }, [checkPayments]);

  async function completePayment(orderId: string) {
    setPayingId(orderId);
    const result = await resume.run(orderId);
    if (result && result !== true) {
      window.location.assign(result.checkoutUrl);
      return; // keep the button busy while the browser leaves for Stripe
    }
    setPayingId(null);
    void checkPayments(false); // e.g. it turned out to be paid already, or the link had expired
  }

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Order history"
        subtitle="Card payments and purchase-order invoices for your agency."
        actions={
          <>
            <Button variant="secondary" loading={checking} icon={<RefreshCw className="size-4" aria-hidden />} onClick={() => void checkPayments(true)}>
              Check payment status
            </Button>
            <ButtonLink href="/agency/store" variant="primary" icon={<Receipt className="size-4" aria-hidden />}>
              Buy seats
            </ButtonLink>
          </>
        }
      />

      <Panel>
        <p className="tnum mb-4 text-sm text-ink-600">{formatNumber(total)} orders</p>
        <DataTable
          caption="Agency orders"
          columns={buildColumns((id) => void completePayment(id), payingId)}
          rows={orders.data?.items}
          rowKey={(o) => o.publicId}
          loading={orders.isPending}
          error={orders.isError ? (orders.error instanceof Error ? orders.error.message : "Could not load orders.") : undefined}
          onRetry={() => void orders.refetch()}
          empty={{ title: "No orders yet", description: "Seat purchases and invoices will appear here." }}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} total={total} pageSize={PAGE_SIZE} />
      </Panel>
    </>
  );
}
