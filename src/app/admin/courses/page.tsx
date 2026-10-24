"use client";

import { DollarSign, Library, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Panel } from "@/components/ui/panel";
import { Tabs } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAction, useCatalog } from "@/lib/api/hooks";
import type { CatalogProduct, ProductStatus } from "@/lib/api/types";
import { formatCurrency, relativeDays } from "@/lib/utils";

type Filter = "all" | ProductStatus;

function activePrices(product: CatalogProduct) {
  return product.prices.filter((price) => price.isActive);
}

export default function AdminCatalogPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [priceFor, setPriceFor] = useState<CatalogProduct | null>(null);
  const [productForm, setProductForm] = useState({ code: "", name: "", productType: "program" as "program" | "module" });
  const [priceForm, setPriceForm] = useState({ billingPeriod: "annual" as "annual" | "monthly", amount: "" });

  const catalog = useCatalog(filter === "all" ? undefined : filter);
  const createProduct = useAction(api.catalog.createProduct, { invalidate: ["catalog"], success: "Product created" });
  const setStatus = useAction(api.catalog.setStatus, { invalidate: ["catalog"] });
  const addPrice = useAction(api.catalog.addPrice, { invalidate: ["catalog"], success: "Price added" });

  const rows = useMemo(() => catalog.data ?? [], [catalog.data]);

  const columns: Column<CatalogProduct>[] = [
    {
      key: "product",
      header: "Product",
      width: "minmax(0,2fr)",
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{p.name}</p>
          <p className="truncate font-mono text-xs text-ink-600">{p.code}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", width: "110px", cell: (p) => <Badge tone="navy"><span className="capitalize">{p.productType}</span></Badge> },
    {
      key: "content",
      header: "Content",
      width: "minmax(0,1.3fr)",
      cell: (p) => (p.content ? <span className="truncate text-ink-700">{p.content.title}</span> : <span className="text-xs text-ink-500">Not attached</span>),
    },
    {
      key: "prices",
      header: "Active prices",
      width: "minmax(0,1.3fr)",
      cell: (p) => {
        const prices = activePrices(p);
        if (prices.length === 0) return <span className="text-xs text-ink-500">No price</span>;
        return (
          <div className="flex flex-wrap gap-1.5">
            {prices.map((price) => (
              <Badge key={price.id} tone="brand">
                {formatCurrency(price.unitAmountMinor / 100)} / {price.billingPeriod === "annual" ? "yr" : "mo"}
              </Badge>
            ))}
          </div>
        );
      },
    },
    { key: "status", header: "Status", width: "110px", cell: (p) => <StatusPill status={p.status} /> },
    {
      key: "updated",
      header: "Updated",
      width: "120px",
      cell: (p) => <span className="text-ink-600">{p.prices[0]?.activeFrom ? relativeDays(p.prices[0].activeFrom) : "—"}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      width: "230px",
      align: "right",
      cell: (p) => (
        <div className="flex flex-wrap justify-start gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => { setPriceForm({ billingPeriod: "annual", amount: "" }); setPriceFor(p); }}>
            Add price
          </Button>
          {p.status === "draft" ? (
            <Button variant="soft" size="sm" onClick={() => void setStatus.run(p.publicId, "activate")}>Activate</Button>
          ) : p.status === "active" ? (
            <Button variant="ghost" size="sm" onClick={() => void setStatus.run(p.publicId, "retire")}>Retire</Button>
          ) : null}
        </div>
      ),
    },
  ];

  function submitProduct(event: React.FormEvent) {
    event.preventDefault();
    const code = productForm.code.trim();
    const name = productForm.name.trim();
    if (!code || !name) return;
    void createProduct.run({ code, name, productType: productForm.productType }).then((created) => {
      if (!created) return;
      setCreateOpen(false);
      setProductForm({ code: "", name: "", productType: "program" });
    });
  }

  function submitPrice(event: React.FormEvent) {
    event.preventDefault();
    if (!priceFor) return;
    const amountMinor = Math.round(Number(priceForm.amount) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor < 50) return;
    void addPrice.run(priceFor.publicId, priceForm.billingPeriod, amountMinor).then((ok) => {
      if (ok === undefined) return;
      setPriceFor(null);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Catalog & pricing"
        subtitle="Programs and modules that agencies can purchase. Prices are versioned: adding one closes the previous price for that billing period."
        actions={<Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreateOpen(true)}>New product</Button>}
      />

      <div className="mb-4">
        <Tabs
          label="Filter products"
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "draft", label: "Draft" },
            { value: "retired", label: "Retired" },
          ]}
        />
      </div>

      <Panel>
        <DataTable
          caption="Catalog products"
          columns={columns}
          rows={rows}
          rowKey={(p) => p.publicId}
          loading={catalog.isPending}
          error={catalog.isError ? (catalog.error instanceof Error ? catalog.error.message : "Could not load the catalog.") : undefined}
          onRetry={() => void catalog.refetch()}
          empty={{ title: "No products in this view", description: "Create a product, attach it to a course in the content studio, then add a price." }}
        />
      </Panel>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New product"
        description="Products become purchasable after content is attached and a price is added."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="new-product-form" loading={createProduct.pending} icon={<Library className="size-4" aria-hidden />}>Create product</Button>
          </>
        }
      >
        <form id="new-product-form" className="space-y-4" onSubmit={submitProduct}>
          <Field label="Name">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} data-autofocus required value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} placeholder="DBE Compliance Program" />}
          </Field>
          <Field label="Code" hint="Stable identifier used in exports and integrations.">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} required pattern="[A-Za-z0-9][A-Za-z0-9._-]*" value={productForm.code} onChange={(e) => setProductForm((f) => ({ ...f, code: e.target.value }))} placeholder="DBE-PROGRAM" />}
          </Field>
          <Field label="Product type">
            {({ id }) => (
              <Select id={id} value={productForm.productType} onChange={(e) => setProductForm((f) => ({ ...f, productType: e.target.value as "program" | "module" }))}>
                <option value="program">Program (full course)</option>
                <option value="module">Module</option>
              </Select>
            )}
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!priceFor}
        onClose={() => setPriceFor(null)}
        title={priceFor ? `Add price — ${priceFor.name}` : "Add price"}
        description="Prices are immutable. The currently active price for the same billing period is closed at the same instant."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPriceFor(null)}>Cancel</Button>
            <Button type="submit" form="new-price-form" loading={addPrice.pending} icon={<DollarSign className="size-4" aria-hidden />}>Add price</Button>
          </>
        }
      >
        <form id="new-price-form" className="space-y-4" onSubmit={submitPrice}>
          <Field label="Billing period">
            {({ id }) => (
              <Select id={id} value={priceForm.billingPeriod} onChange={(e) => setPriceForm((f) => ({ ...f, billingPeriod: e.target.value as "annual" | "monthly" }))}>
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
              </Select>
            )}
          </Field>
          <Field label="Price per seat (USD)" hint="Minimum $0.50.">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} data-autofocus required inputMode="decimal" type="number" min="0.5" step="0.01" value={priceForm.amount} onChange={(e) => setPriceForm((f) => ({ ...f, amount: e.target.value }))} placeholder="199.00" />
            )}
          </Field>
        </form>
      </Modal>
    </>
  );
}
