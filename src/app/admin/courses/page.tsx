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
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useAction, useCatalog, useCourseOptions } from "@/lib/api/hooks";
import type { CatalogProduct, ProductStatus } from "@/lib/api/types";
import { formatCurrency, relativeDays } from "@/lib/utils";

type Filter = "all" | ProductStatus;

function activePrices(product: CatalogProduct) {
  return product.prices.filter((price) => price.isActive);
}

interface CourseOption {
  publicId: string;
  title: string;
  published: boolean;
}

/** "What does this product sell?" Only published courses can be chosen; the rest are listed but disabled. */
function CourseSelect({ id, describedBy, value, onChange, options, loading }: { id: string; describedBy?: string | undefined; value: string; onChange: (value: string) => void; options: CourseOption[]; loading: boolean }) {
  return (
    <Select id={id} aria-describedby={describedBy} value={value} onChange={(e) => onChange(e.target.value)} required disabled={loading}>
      <option value="">{loading ? "Loading courses…" : options.length === 0 ? "No courses yet" : "Choose a course…"}</option>
      {options.map((course) => (
        <option key={course.publicId} value={course.publicId} disabled={!course.published}>
          {course.title}
          {course.published ? "" : " (not published yet)"}
        </option>
      ))}
    </Select>
  );
}

export default function AdminCatalogPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [priceFor, setPriceFor] = useState<CatalogProduct | null>(null);
  const [productForm, setProductForm] = useState({ code: "", name: "", productType: "program" as "program" | "module", courseId: "" });
  const [priceForm, setPriceForm] = useState({ billingPeriod: "annual" as "annual" | "monthly", amount: "" });
  // A draft product that was created without a course (or whose link failed) gets one here.
  const [chooseFor, setChooseFor] = useState<CatalogProduct | null>(null);
  const [chosenCourse, setChosenCourse] = useState("");

  const toast = useToast();
  const catalog = useCatalog(filter === "all" ? undefined : filter);
  const courseOptions = useCourseOptions();
  const courses = courseOptions.data ?? [];
  const createProduct = useAction(api.catalog.createProduct, { invalidate: ["catalog"] });
  const linkCourse = useAction(api.catalog.attachContent, { invalidate: ["catalog"] });
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
          {p.status === "draft" && !p.content ? (
            // A product cannot go live until it says what it sells, so offer that step instead of a button that would fail.
            <Button variant="soft" size="sm" onClick={() => { setChosenCourse(""); setChooseFor(p); }}>Choose course</Button>
          ) : p.status === "draft" ? (
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
    if (!code || !name || !productForm.courseId) return;
    void createProduct.run({ code, name, productType: "program" }).then(async (created) => {
      if (!created || created === true) return;
      // One step for the admin: the new product is linked to its course straight away. If linking fails the
      // error is shown and the product stays in the list as a draft with a "Choose course" action.
      const linked = await linkCourse.run(created.publicId, "course", productForm.courseId);
      setCreateOpen(false);
      setProductForm({ code: "", name: "", productType: "program", courseId: "" });
      if (linked) toast.success("Product created", "Add a price, then activate it to put it on sale.");
    });
  }

  function submitChoose(event: React.FormEvent) {
    event.preventDefault();
    if (!chooseFor || !chosenCourse) return;
    void linkCourse.run(chooseFor.publicId, "course", chosenCourse).then((ok) => {
      if (ok === undefined) return;
      setChooseFor(null);
      toast.success("Course linked", "You can activate this product now.");
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
          empty={{ title: "No products in this view", description: "Create a product, choose the course it sells, then add a price and activate it." }}
        />
      </Panel>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New product"
        description="A product is what agencies buy. Choose the course it sells, then add a price and activate it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="new-product-form" loading={createProduct.pending || linkCourse.pending} icon={<Library className="size-4" aria-hidden />}>Create product</Button>
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
          <Field label="Product type" hint="Selling a single module comes later; for now a product sells a full course.">
            {({ id, describedBy }) => (
              <Select id={id} aria-describedby={describedBy} value="program" onChange={() => undefined}>
                <option value="program">Program (full course)</option>
                <option value="module" disabled>Module (coming soon)</option>
              </Select>
            )}
          </Field>
          <Field
            label="Course"
            required
            hint={courseOptions.isError ? "Could not load courses. Reload the page to retry." : "Only published courses can be sold."}
          >
            {({ id, describedBy }) => (
              <CourseSelect
                describedBy={describedBy}
                id={id}
                value={productForm.courseId}
                onChange={(courseId) => setProductForm((f) => ({ ...f, courseId }))}
                options={courses}
                loading={courseOptions.isPending}
              />
            )}
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!chooseFor}
        onClose={() => setChooseFor(null)}
        title={chooseFor ? `Choose course — ${chooseFor.name}` : "Choose course"}
        description="This product does not say what it sells yet. Pick the course, then you can activate it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setChooseFor(null)}>Cancel</Button>
            <Button type="submit" form="choose-course-form" loading={linkCourse.pending} icon={<Library className="size-4" aria-hidden />}>Save</Button>
          </>
        }
      >
        <form id="choose-course-form" className="space-y-4" onSubmit={submitChoose}>
          <Field label="Course" required hint="Only published courses can be sold.">
            {({ id }) => <CourseSelect id={id} value={chosenCourse} onChange={setChosenCourse} options={courses} loading={courseOptions.isPending} />}
          </Field></form>
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
