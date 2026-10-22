"use client";

import { Receipt } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { usePlatformOrders } from "@/lib/api/hooks";
import type { Order } from "@/lib/api/types";
import { formatCurrency, formatNumber, relativeDays } from "@/lib/utils";

const PAGE_SIZE = 12;
type Filter = "all" | "paid" | "pending" | "draft" | "void" | "refunded" | "partially_refunded";

const columns: Column<Order>[] = [
  {
    key: "order",
    header: "Order",
    width: "minmax(0,1.6fr)",
    cell: (o) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink-900">{o.item?.productName ?? "Order"}</p>
        <p className="truncate font-mono text-xs text-ink-600">{o.publicId}</p>
      </div>
    ),
  },
  { key: "agency", header: "Agency", width: "minmax(0,1.2fr)", cell: (o) => <span className="truncate text-ink-700">{o.agencyName ?? "—"}</span> },
  {
    key: "qty",
    header: "Qty",
    width: "70px",
    align: "right",
    cell: (o) => <span className="tnum">{o.item?.quantity ?? "—"}</span>,
  },
  {
    key: "total",
    header: "Total",
    width: "110px",
    align: "right",
    cell: (o) => (
      <div>
        <p className="tnum font-semibold text-ink-900">{formatCurrency(o.totalMinor / 100)}</p>
        <p className="text-xs uppercase text-ink-500">{o.currency}</p>
      </div>
    ),
  },
  { key: "method", header: "Payment", width: "110px", cell: (o) => <span className="capitalize text-ink-700">{o.paymentMethod}</span> },
  { key: "status", header: "Status", width: "120px", cell: (o) => <StatusPill status={o.status} /> },
  {
    key: "created",
    header: "Created",
    width: "120px",
    cell: (o) => <span className="text-ink-600">{o.createdAt ? relativeDays(o.createdAt) : "—"}</span>,
  },
];

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const orders = usePlatformOrders({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const total = orders.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = filter === "all" ? orders.data?.items : orders.data?.items?.filter((o) => o.status === filter);

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Orders"
        subtitle="Seat purchases and invoices across agencies. Platform-wide orders are aggregated from the first 50 agencies (the backend has no global orders endpoint yet)."
      />

      <div className="mb-4">
        <Tabs
          label="Filter orders by status"
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          items={[
            { value: "all", label: "All" },
            { value: "paid", label: "Paid" },
            { value: "pending", label: "Pending" },
            { value: "draft", label: "Draft" },
            { value: "refunded", label: "Refunded" },
            { value: "void", label: "Void" },
          ]}
        />
      </div>

      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-600">
          <span className="inline-flex items-center gap-2">
            <Receipt className="size-4" aria-hidden />
            <span className="tnum">{formatNumber(total)} orders</span>
          </span>
          <span>Newest first</span>
        </div>
        <DataTable
          caption="Platform orders"
          columns={columns}
          rows={rows}
          rowKey={(o) => o.publicId}
          loading={orders.isPending}
          error={orders.isError ? (orders.error instanceof Error ? orders.error.message : "Could not load orders.") : undefined}
          onRetry={() => void orders.refetch()}
          empty={{ title: "No orders in this view", description: filter === "all" ? "Seat purchases will appear here." : "Try a different status filter." }}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} total={total} pageSize={PAGE_SIZE} />
      </Panel>
    </>
  );
}
