"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, errorMessage } from "@/components/shared/QueryState";
import { platformApi, type PlatformProduct } from "@/features/platform/api";
import {
  AdminPage,
  btnDanger,
  btnDark,
  btnLight,
  dollarsToCents,
  Field,
  formatDate,
  Modal,
  money,
  Notice,
  Pager,
  Panel,
  StatusPill,
  tdClass,
  thClass,
  useFlash
} from "@/features/platform/ui";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const products = useQuery({
    queryKey: ["platform", "products", { page }],
    queryFn: () => platformApi.products({ page, pageSize: 25 })
  });

  return (
    <AdminPage title="Products & Pricing" subtitle="Sellable products: link course content, activate, and manage annual / monthly per-seat prices">
      <div className="flex justify-end">
        <button type="button" className={btnDark} onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="text-secondary-400" /> New product
        </button>
      </div>

      <Panel title="Products" description="Price shown is the current annual per-seat price. Expand a product to manage it.">
        {products.isPending ? (
          <LoadingState />
        ) : products.isError ? (
          <ErrorState error={products.error} onRetry={() => void products.refetch()} />
        ) : products.data.items.length === 0 ? (
          <EmptyState title="No products yet" description="Create a product, link a course or module, add a price and activate it." />
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {products.data.items.map((product) => (
                <div key={product.uuid}>
                  <button
                    type="button"
                    aria-expanded={expanded === product.uuid}
                    onClick={() => setExpanded(expanded === product.uuid ? null : product.uuid)}
                    className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-gray-50/80 rounded-lg px-1"
                  >
                    <span className="flex items-center gap-2">
                      {expanded === product.uuid ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="text-sm font-bold text-gray-900">{product.name}</span>
                      <StatusPill status={product.status} />
                    </span>
                    <span className="text-xs font-black text-gray-900 tabular-nums">
                      {money(product.price_cents)} <span className="font-medium text-gray-400">/ seat / yr</span>
                    </span>
                  </button>
                  {expanded === product.uuid && <ProductManager product={product} />}
                </div>
              ))}
            </div>
            <Pager page={products.data.page} pages={products.data.pages} total={products.data.total} onChange={setPage} />
          </>
        )}
      </Panel>

      <CreateProductModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async (publicId) => {
          setCreateOpen(false);
          await queryClient.invalidateQueries({ queryKey: ["platform", "products"] });
          setExpanded(publicId);
        }}
      />
    </AdminPage>
  );
}

function ProductManager({ product }: { product: PlatformProduct }) {
  const queryClient = useQueryClient();
  const flash = useFlash();
  const id = product.uuid;

  const detail = useQuery({ queryKey: ["platform", "products", id, "detail"], queryFn: () => platformApi.catalogProduct(id) });
  const prices = useQuery({ queryKey: ["platform", "products", id, "prices"], queryFn: () => platformApi.prices(id) });
  const courses = useQuery({
    queryKey: ["platform", "courses", { page: 1, pageSize: 100 }],
    queryFn: () => platformApi.courses({ page: 1, pageSize: 100 }),
    enabled: detail.data?.product.productType === "program"
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["platform", "products"] });
  const run = (label: string) => ({
    onSuccess: async () => {
      flash.success(label);
      await refresh();
    },
    onError: (error: unknown) => flash.error(errorMessage(error))
  });

  const [target, setTarget] = useState("");
  const link = useMutation({
    mutationFn: () =>
      platformApi.attachProductContent(
        id,
        detail.data?.product.productType === "module" ? { modulePublicId: target.trim() } : { coursePublicId: target }
      ),
    ...run("Content linked.")
  });
  const activate = useMutation({ mutationFn: () => platformApi.activateProduct(id), ...run("Product activated.") });
  const retire = useMutation({ mutationFn: () => platformApi.retireProduct(id), ...run("Product retired.") });

  const [period, setPeriod] = useState<"annual" | "monthly">("annual");
  const [amount, setAmount] = useState("");
  const createPrice = useMutation({
    mutationFn: (cents: number) => platformApi.createPrice(id, { billingPeriod: period, unitAmountMinor: cents }),
    onSuccess: async () => {
      setAmount("");
      flash.success("Price created. It replaces any current price for that period.");
      await refresh();
    },
    onError: (error: unknown) => flash.error(errorMessage(error))
  });
  const retirePrice = useMutation({ mutationFn: (priceId: string) => platformApi.retirePrice(priceId), ...run("Price retired.") });

  const submitPrice = (event: FormEvent) => {
    event.preventDefault();
    const cents = dollarsToCents(amount);
    if (cents === null || cents < 50) return flash.error("Enter a price of at least $0.50.");
    createPrice.mutate(cents);
  };

  const submitLink = (event: FormEvent) => {
    event.preventDefault();
    if (!UUID.test(target.trim())) return flash.error("Select a course (or paste a valid module public ID).");
    link.mutate();
  };

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  const p = detail.data.product;
  const isModule = p.productType === "module";

  return (
    <div className="pb-5 pl-6 space-y-5">
      <p className="text-xs text-gray-500">
        Code <span className="font-mono text-gray-800">{p.code}</span> · type <span className="font-bold">{p.productType}</span> · content{" "}
        <span className="font-bold">{p.content ? "linked" : "not linked"}</span>
      </p>
      {flash.node}

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Content & status</h3>
          {p.status === "draft" && (
            <form onSubmit={submitLink} className="space-y-3">
              {isModule ? (
                <Field label="Module public ID" htmlFor={`link-${id}`} hint="Shown in Catalog authoring after the module is created.">
                  <input id={`link-${id}`} className="input font-mono" value={target} onChange={(e) => setTarget(e.target.value)} />
                </Field>
              ) : (
                <Field label="Course" htmlFor={`link-${id}`}>
                  <select id={`link-${id}`} className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
                    <option value="">Select a course…</option>
                    {(courses.data?.items ?? []).map((c) => (
                      <option key={c.uuid} value={c.uuid}>
                        {c.title}
                        {c.current_version ? ` (v${c.current_version} published)` : " (no published version)"}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <button type="submit" className={btnLight} disabled={link.isPending}>
                {p.content ? "Replace linked content" : "Link content"}
              </button>
            </form>
          )}
          <div className="flex flex-wrap gap-2">
            {p.status === "draft" && (
              <button type="button" className={btnDark} disabled={activate.isPending} onClick={() => activate.mutate()}>
                Activate product
              </button>
            )}
            {p.status !== "retired" && (
              <button
                type="button"
                className={btnDanger}
                disabled={retire.isPending}
                onClick={() => window.confirm(`Retire ${p.name}? It can no longer be purchased.`) && retire.mutate()}
              >
                Retire product
              </button>
            )}
          </div>
          {p.status === "draft" && (
            <p className="text-[11px] text-gray-500">Activation requires linked content with a published version.</p>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Prices (USD per seat)</h3>
          {prices.isPending ? (
            <LoadingState />
          ) : prices.isError ? (
            <ErrorState error={prices.error} onRetry={() => void prices.refetch()} />
          ) : prices.data.prices.length === 0 ? (
            <p className="text-xs text-gray-500">No prices yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider font-bold">
                  <th className={thClass}>Period</th>
                  <th className={`${thClass} text-right`}>Amount</th>
                  <th className={thClass}>Active</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {prices.data.prices.map((price) => (
                  <tr key={price.id}>
                    <td className={`${tdClass} capitalize`}>{price.billingPeriod}</td>
                    <td className={`${tdClass} text-right tabular-nums font-bold text-gray-900`}>{money(price.unitAmountMinor)}</td>
                    <td className={tdClass}>
                      {price.isActive ? <StatusPill status="active" /> : <StatusPill status="retired" />}
                      <span className="ml-1 text-gray-400">
                        {formatDate(price.activeFrom)}
                        {price.activeUntil ? ` – ${formatDate(price.activeUntil)}` : ""}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      {price.isActive && (
                        <button
                          type="button"
                          className={btnLight}
                          disabled={retirePrice.isPending}
                          onClick={() => window.confirm("Retire this price?") && retirePrice.mutate(price.id)}
                        >
                          Retire
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {p.status !== "retired" && (
            <form onSubmit={submitPrice} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <Field label="Billing period" htmlFor={`period-${id}`}>
                <select id={`period-${id}`} className="input" value={period} onChange={(e) => setPeriod(e.target.value as "annual" | "monthly")}>
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
              <Field label="Amount ($)" htmlFor={`amount-${id}`}>
                <input
                  id={`amount-${id}`}
                  type="number"
                  min="0.5"
                  step="0.01"
                  inputMode="decimal"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <button type="submit" className={btnDark} disabled={createPrice.isPending}>
                Add
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateProductModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (publicId: string) => void | Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [productType, setProductType] = useState<"program" | "module">("program");
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => platformApi.createProduct({ code: code.trim(), name: name.trim(), productType }),
    onSuccess: async (result) => {
      setCode("");
      setName("");
      setFormError(null);
      await onCreated(result.product.publicId);
    },
    onError: (error) => setFormError(errorMessage(error))
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim().length < 2 || !CODE.test(code.trim())) return setFormError("Code must be alphanumeric (may include . _ -).");
    if (!name.trim()) return setFormError("Name is required.");
    create.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="New product" description="Products start as drafts. Link content and add a price before activating.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Code" htmlFor="product-code">
          <input id="product-code" className="input font-mono" maxLength={80} value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Name" htmlFor="product-name">
          <input id="product-name" className="input" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Type" htmlFor="product-type">
          <select id="product-type" className="input" value={productType} onChange={(e) => setProductType(e.target.value as "program" | "module")}>
            <option value="program">Program (full course)</option>
            <option value="module">Single module</option>
          </select>
        </Field>
        {formError && <Notice tone="error">{formError}</Notice>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnLight} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnDark} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
