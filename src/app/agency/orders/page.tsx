"use client";

import { Receipt } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { Pagination } from "@/components/ui/pagination";
import { useOrders } from "@/lib/api/hooks";
import type { Order } from "@/lib/api/types";
import { formatCurrency, formatNumber, relativeDays } from "@/lib/utils";

const PAGE_SIZE = 10;

const columns: Column<Order>[] = [
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
];

export default function AgencyOrdersPage() {
  const [page, setPage] = useState(1);
  const orders = useOrders({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const total = orders.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        eyebrow="Agency"
        title="Order history"
        subtitle="Card payments and purchase-order invoices for your agency."
        actions={<ButtonLink href="/agency/store" variant="primary" icon={<Receipt className="size-4" aria-hidden />}>Buy seats</ButtonLink>}
      />

      <Panel>
        <p className="tnum mb-4 text-sm text-ink-600">{formatNumber(total)} orders</p>
        <DataTable
          caption="Agency orders"
          columns={columns}
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
