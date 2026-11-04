"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, CheckCircle2, DollarSign, ExternalLink, FileEdit, PauseCircle, Plus, Rocket, Search, Tag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { CoursePicker } from "@/components/studio/course-picker";
import { StatusPill } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Panel } from "@/components/ui/panel";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useCatalogPage, useDebounced, useOverviewPage } from "@/lib/api/lists";
import type { CourseOverviewRow } from "@/lib/api/studio";
import type { CatalogProduct, ProductStatus } from "@/lib/api/types";
import { cn, formatCurrency } from "@/lib/utils";

type Filter = "all" | ProductStatus;
const PAGE_SIZE = 6;
const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const money = (minor: number) => formatCurrency(minor / 100);
const PERIOD = { annual: "year", monthly: "month" } as const;

function courseFacts(c: { version?: number | null | undefined; modules?: number | undefined; lessons?: number | undefined; hasFinal?: boolean | undefined }): string {
  const parts = [c.version ? `Version ${c.version}` : null, c.modules ? `${c.modules} module${c.modules === 1 ? "" : "s"}` : null, c.lessons ? `${c.lessons} lessons` : null, c.hasFinal ? "final exam" : null];
  return parts.filter(Boolean).join(" · ");
}

/** Suggests a product code from a name: "DBE/ACDBE Program" -> "DBE-ACDBE-PROGRAM". */
function suggestCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

// ---- One product -----------------------------------------------------------------------------------------

function ProductCard({ product, onPrice, onStatus, onChooseCourse }: { product: CatalogProduct; onPrice: () => void; onStatus: (action: "activate" | "retire") => void; onChooseCourse: () => void }) {
  const prices = product.prices.filter((p) => p.isActive);
  const canActivate = !!product.content && prices.length > 0;
  const missing = !product.content ? "Choose what it sells first" : prices.length === 0 ? "Add a price first" : "";
  const content = product.content;

  return (
    <li className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-ink-900">{product.name}</h3>
            <StatusPill status={product.status} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-ink-600">{product.code} · {product.productType === "program" ? "Full course" : "Single module"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {product.status === "draft" ? (
            <Button size="sm" icon={<Rocket className="size-4" aria-hidden />} disabled={!canActivate} title={missing} onClick={() => onStatus("activate")}>Put on sale</Button>
          ) : product.status === "active" ? (
            <Button size="sm" variant="secondary" icon={<PauseCircle className="size-4" aria-hidden />} onClick={() => onStatus("retire")}>Take off sale</Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-canvas-soft p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-500"><BookOpen className="size-3.5" aria-hidden /> What it sells</p>
          {content ? (
            <>
              <p className="mt-1 font-semibold text-ink-900">{content.title}</p>
              <p className="text-sm text-ink-600">{courseFacts(content)}</p>
              {content.kind === "course" && content.refId ? (
                <div className="mt-3"><ButtonLink href={`/admin/content/builder?course=${content.refId}`} size="sm" variant="soft" icon={<FileEdit className="size-4" aria-hidden />}>Edit the content</ButtonLink></div>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-warn"><AlertCircle className="size-4" aria-hidden /> Not linked to a course yet</p>
              <div className="mt-3"><Button size="sm" variant="soft" onClick={onChooseCourse}>Choose course</Button></div>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-canvas-soft p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-500"><Tag className="size-3.5" aria-hidden /> Price per seat</p>
          {prices.length === 0 ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-warn"><AlertCircle className="size-4" aria-hidden /> No price yet</p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {prices.map((p) => (
                <li key={p.id} className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-ink-900">{money(p.unitAmountMinor)}</span>
                  <span className="text-sm text-ink-600">per seat, per {PERIOD[p.billingPeriod]}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3"><Button size="sm" variant="soft" icon={<DollarSign className="size-4" aria-hidden />} onClick={onPrice}>{prices.length ? "Change price" : "Set price"}</Button></div>
        </div>
      </div>
      {product.status === "draft" && missing ? <p className="mt-3 text-sm text-warn">To put this on sale: {missing.toLowerCase()}.</p> : null}
      {product.status === "retired" ? <p className="mt-3 text-sm text-ink-600">Retired products cannot be bought. Agencies that already bought it keep their seats. To sell the course again, create a new product for it.</p> : null}
    </li>
  );
}

// ---- Change price ---------------------------------------------------------------------------------------

function PriceDialog({ product, onClose, onDone }: { product: CatalogProduct | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [annual, setAnnual] = useState("");
  const [monthly, setMonthly] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    const cur = (p: "annual" | "monthly") => product.prices.find((x) => x.isActive && x.billingPeriod === p);
    setAnnual(cur("annual") ? String(cur("annual")!.unitAmountMinor / 100) : "");
    setMonthly(cur("monthly") ? String(cur("monthly")!.unitAmountMinor / 100) : "");
    setError(null);
  }, [product]);

  if (!product) return null;
  const cents = (v: string) => (v.trim() === "" ? null : Math.round(Number(v) * 100));
  const a = cents(annual);
  const m = cents(monthly);
  const bad = (c: number | null) => c !== null && (!Number.isFinite(c) || c < 50);
  const current = (p: "annual" | "monthly") => product.prices.find((x) => x.isActive && x.billingPeriod === p)?.unitAmountMinor ?? null;
  const changes = ([["annual", a], ["monthly", m]] as const).filter(([p, c]) => c !== null && c !== current(p));
  const canSave = changes.length > 0 && !bad(a) && !bad(m) && !busy;

  async function save() {
    if (!product) return;
    setBusy(true);
    setError(null);
    try {
      for (const [period, c] of changes) await api.catalog.addPrice(product.publicId, period, c as number);
      toast.success("Price saved", "New purchases use the new price.");
      onDone();
      onClose();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Price — ${product.name}`}
      description="Prices are per seat. Agencies that already bought keep what they pay now; the new price applies to new purchases and renewals."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!canSave} onClick={() => void save()}>Save price</Button></>}
    >
      <div className="space-y-4">
        <Field label="Per year (USD)" hint="What an agency pays per seat for one year." error={bad(a) ? "Minimum $0.50" : undefined}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} data-autofocus type="number" inputMode="decimal" min="0.5" step="0.01" placeholder="999.00" value={annual} onChange={(e) => setAnnual(e.target.value)} />}
        </Field>
        <Field label="Per month (USD)" optional hint="Only if you also sell monthly." error={bad(m) ? "Minimum $0.50" : undefined}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} type="number" inputMode="decimal" min="0.5" step="0.01" placeholder="99.00" value={monthly} onChange={(e) => setMonthly(e.target.value)} />}
        </Field>
        {error ? <p role="alert" className="rounded-xl bg-bad-bg p-3 text-sm text-bad">{error}</p> : null}
      </div>
    </Modal>
  );
}

// ---- New product ----------------------------------------------------------------------------------------

function NewProductDialog({ open, onClose, preselect, onDone }: { open: boolean; onClose: () => void; preselect: CourseOverviewRow | null; onDone: () => void }) {
  const toast = useToast();
  const [chosen, setChosen] = useState<CourseOverviewRow | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [annual, setAnnual] = useState("");
  const [monthly, setMonthly] = useState("");
  const [live, setLive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (!open) return;
    setChosen(preselect);
    setName(preselect?.title ?? "");
    setCode(preselect ? suggestCode(preselect.title) : "");
    setCodeTouched(false);
    setAnnual("");
    setMonthly("");
    setLive(true);
    setError(null);
  }, [open, preselect]);

  const aC = Math.round(Number(annual) * 100);
  const mC = monthly.trim() ? Math.round(Number(monthly) * 100) : null;
  const priceOk = Number.isFinite(aC) && aC >= 50 && (mC === null || (Number.isFinite(mC) && mC >= 50));
  const codeOk = /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(code);
  const canSave = !!chosen && name.trim().length > 0 && codeOk && priceOk && !busy;

  async function save() {
    if (submitting.current || !chosen) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    let created: string | null = null;
    try {
      const product = await api.catalog.createProduct({ code: code.trim(), name: name.trim(), productType: "program" });
      created = product.publicId;
      await api.catalog.attachContent(product.publicId, "course", chosen.uuid);
      await api.catalog.addPrice(product.publicId, "annual", aC);
      if (mC !== null) await api.catalog.addPrice(product.publicId, "monthly", mC);
      if (live) await api.catalog.setStatus(product.publicId, "activate");
      toast.success(live ? "Now on sale" : "Product saved", live ? "Agencies can buy it under Buy seats." : "Use “Put on sale” when you are ready.");
      onDone();
      onClose();
    } catch (e) {
      setError(created ? `The product was created but a later step failed: ${errText(e)} Find it in the list and finish there.` : errText(e));
      if (created) onDone();
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sell a course"
      description="Pick a published course, set the price, and choose whether it goes on sale now."
      className="sm:max-w-xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!canSave} icon={<Rocket className="size-4" aria-hidden />} onClick={() => void save()}>{live ? "Save and put on sale" : "Save"}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Which course?" required hint={chosen ? `Chosen: ${chosen.title} (${courseFacts(chosen)})` : undefined}>
          {({ id }) => (
            <CoursePicker
              id={id}
              value={chosen?.uuid ?? ""}
              onChange={(c) => {
                setChosen(c);
                setName(c.title);
                if (!codeTouched) setCode(suggestCode(c.title));
              }}
            />
          )}
        </Field>
        <Field label="Name agencies see" required>
          {({ id }) => <Input id={id} value={name} onChange={(e) => { setName(e.target.value); if (!codeTouched) setCode(suggestCode(e.target.value)); }} maxLength={200} />}
        </Field>
        <Field label="Code" hint="A short unique id used in reports. Filled in for you." error={code && !codeOk ? "Letters, numbers, dots and dashes only." : undefined}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} className="font-mono" value={code} onChange={(e) => { setCode(e.target.value); setCodeTouched(true); }} maxLength={50} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price per seat, per year (USD)" required>
            {({ id }) => <Input id={id} type="number" inputMode="decimal" min="0.5" step="0.01" placeholder="999.00" value={annual} onChange={(e) => setAnnual(e.target.value)} />}
          </Field>
          <Field label="Per month (USD)" optional>
            {({ id }) => <Input id={id} type="number" inputMode="decimal" min="0.5" step="0.01" placeholder="99.00" value={monthly} onChange={(e) => setMonthly(e.target.value)} />}
          </Field>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ring-line">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="mt-1 size-5 accent-brand-700" />
          <span><span className="block text-sm font-bold text-ink-900">Put it on sale now</span><span className="block text-sm text-ink-600">Untick to save it as a draft and launch it later.</span></span>
        </label>
        {error ? <p role="alert" className="rounded-xl bg-bad-bg p-3 text-sm text-bad">{error}</p> : null}
      </div>
    </Modal>
  );
}

// ---- Page -------------------------------------------------------------------------------------------------

function CatalogView() {
  const qc = useQueryClient();
  const toast = useToast();
  const params = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(search.trim());
  const catalog = useCatalogPage({ status: filter, search: term, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const unsold = useOverviewPage({ unsold: true, limit: 6, offset: 0 });
  const [newOpen, setNewOpen] = useState(false);
  const [preselect, setPreselect] = useState<CourseOverviewRow | null>(null);
  const [priceFor, setPriceFor] = useState<CatalogProduct | null>(null);
  const [confirm, setConfirm] = useState<{ product: CatalogProduct; action: "activate" | "retire" } | null>(null);
  const [chooseFor, setChooseFor] = useState<CatalogProduct | null>(null);
  const [chosenCourse, setChosenCourse] = useState<CourseOverviewRow | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = catalog.data?.counts ?? { all: 0, active: 0, draft: 0, retired: 0 };
  const total = catalog.data?.total ?? 0;
  const rows = catalog.data?.items ?? [];
  const unsoldRows = unsold.data?.items ?? [];

  const refresh = () => Promise.all(["catalog", "store", "studio-overview", "studio-courses"].map((k) => qc.invalidateQueries({ queryKey: [k] })));

  // "Sell this course" links from the Content studio arrive as ?sell=<course uuid>.
  const sell = params.get("sell");
  const sellCourse = useOverviewPage({ courseUuid: sell ?? undefined, limit: 1, offset: 0 }, !!sell && /^[0-9a-f-]{36}$/i.test(sell));
  const sellRow = sellCourse.data?.items[0];
  useEffect(() => {
    if (sellRow) { setPreselect(sellRow); setNewOpen(true); }
  }, [sellRow]);

  function setFilterAndReset(f: Filter) { setFilter(f); setPage(1); }

  async function changeStatus() {
    if (!confirm) return;
    setBusy(true);
    try {
      await api.catalog.setStatus(confirm.product.publicId, confirm.action);
      toast.success(confirm.action === "activate" ? "Now on sale" : "Taken off sale");
      await refresh();
      setConfirm(null);
    } catch (e) {
      toast.error("That didn't work", errText(e));
    } finally {
      setBusy(false);
    }
  }
  async function linkCourse() {
    if (!chooseFor || !chosenCourse) return;
    setBusy(true);
    try {
      await api.catalog.attachContent(chooseFor.publicId, "course", chosenCourse.uuid);
      toast.success("Course linked");
      await refresh();
      setChooseFor(null);
    } catch (e) {
      toast.error("That didn't work", errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Catalog & pricing"
        subtitle="What agencies can buy, and for how much. Use this page for quick changes: price, on/off sale. To change what is inside a course, open it in the Content studio."
        actions={
          <>
            <ButtonLink href="/admin/content" variant="secondary" icon={<ExternalLink className="size-4" aria-hidden />}>Content studio</ButtonLink>
            <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => { setPreselect(null); setNewOpen(true); }}>Sell a course</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "On sale", n: counts.active, tone: "text-ok", f: "active" as Filter },
          { label: "Drafts", n: counts.draft, tone: "text-warn", f: "draft" as Filter },
          { label: "Retired", n: counts.retired, tone: "text-ink-600", f: "retired" as Filter },
          { label: "Courses not on sale", n: unsold.data?.total ?? 0, tone: (unsold.data?.total ?? 0) ? "text-brand-700" : "text-ink-600", f: null },
        ].map((s) => (
          <button key={s.label} type="button" onClick={() => s.f && setFilterAndReset(s.f)} disabled={!s.f} className={cn("rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-navy-900/[0.04] transition", s.f && "hover:ring-brand-300", filter === s.f && "ring-2 ring-brand-700")}>
            <p className={cn("text-3xl font-extrabold", s.tone)}>{s.n}</p>
            <p className="text-sm text-ink-600">{s.label}</p>
          </button>
        ))}
      </div>

      {unsoldRows.length > 0 ? (
        <div className="mb-5 rounded-3xl bg-brand-50 p-5 ring-1 ring-brand-200">
          <p className="font-bold text-brand-900">Published but not on sale</p>
          <p className="text-sm text-ink-700">These courses are ready. Set a price to let agencies buy them.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unsoldRows.map((c) => (
              <li key={c.uuid}>
                <Button size="sm" variant="secondary" icon={<Rocket className="size-4" aria-hidden />} onClick={() => { setPreselect(c); setNewOpen(true); }}>Sell “{c.title}”</Button>
              </li>
            ))}
            {(unsold.data?.total ?? 0) > unsoldRows.length ? (
              <li><ButtonLink href="/admin/content" size="sm" variant="ghost">+{(unsold.data?.total ?? 0) - unsoldRows.length} more in the Content studio</ButtonLink></li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          label="Filter products"
          value={filter}
          onChange={setFilterAndReset}
          items={[
            { value: "all", label: "All", count: counts.all },
            { value: "active", label: "On sale", count: counts.active },
            { value: "draft", label: "Draft", count: counts.draft },
            { value: "retired", label: "Retired", count: counts.retired },
          ]}
        />
        <div className="relative min-w-[14rem] flex-1">
          <label htmlFor="catalog-search" className="sr-only">Search products</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
          <Input id="catalog-search" type="search" autoComplete="off" className="pl-10" placeholder="Search by name or code" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {catalog.isError ? (
        <Panel><ErrorState message={errText(catalog.error)} onRetry={() => void catalog.refetch()} /></Panel>
      ) : catalog.isPending ? (
        <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-52" />)}</div>
      ) : rows.length === 0 ? (
        <Panel>
          <div className="py-10 text-center">
            <p className="text-lg font-bold text-ink-900">{counts.all === 0 && !term ? "Nothing to sell yet" : "No products match"}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">{counts.all === 0 && !term ? "Build a course in the Content studio, then come back here to set a price." : "Try another filter or search."}</p>
          </div>
        </Panel>
      ) : (
        <>
          <ul className={cn("space-y-4 transition-opacity", catalog.isPlaceholderData && "opacity-60")}>
            {rows.map((p) => (
              <ProductCard
                key={p.publicId}
                product={p}
                onPrice={() => setPriceFor(p)}
                onStatus={(action) => setConfirm({ product: p, action })}
                onChooseCourse={() => { setChosenCourse(null); setChooseFor(p); }}
              />
            ))}
          </ul>
          <div className="mt-5"><Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))} onChange={setPage} total={total} pageSize={PAGE_SIZE} /></div>
        </>
      )}

      <PriceDialog product={priceFor} onClose={() => setPriceFor(null)} onDone={() => void refresh()} />
      <NewProductDialog open={newOpen} onClose={() => setNewOpen(false)} preselect={preselect} onDone={() => void refresh()} />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "activate" ? "Put this on sale?" : "Take this off sale?"}
        description={
          confirm?.action === "activate"
            ? `Agencies will be able to buy “${confirm.product.name}” right away.`
            : `Agencies will no longer be able to buy “${confirm?.product.name}”. Seats already bought keep working. A retired product cannot be put back on sale; you would create a new one.`
        }
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant={confirm?.action === "retire" ? "danger" : "primary"} loading={busy} onClick={() => void changeStatus()}>{confirm?.action === "activate" ? "Put on sale" : "Take off sale"}</Button></>}
      >
        <p className="flex items-center gap-2 text-sm text-ink-700"><CheckCircle2 className="size-4 text-ok" aria-hidden /> You can see the result under Agency → Buy seats within about 30 seconds.</p>
      </Modal>

      <Modal
        open={!!chooseFor}
        onClose={() => setChooseFor(null)}
        title="Choose the course"
        description={chooseFor ? `Which course does “${chooseFor.name}” sell?` : undefined}
        footer={<><Button variant="ghost" onClick={() => setChooseFor(null)}>Cancel</Button><Button loading={busy} disabled={!chosenCourse} onClick={() => void linkCourse()}>Save</Button></>}
      >
        <Field label="Course" required hint="Only published courses can be sold.">
          {({ id }) => <CoursePicker id={id} value={chosenCourse?.uuid ?? ""} onChange={setChosenCourse} />}
        </Field>
      </Modal>
    </>
  );
}

export default function AdminCatalogPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <CatalogView />
    </Suspense>
  );
}
