"use client";

/**
 * Paginated, server-filtered list reads. Every list in the app asks the server for ONE page (and searches
 * on the server) instead of downloading everything and filtering in the browser. Search text is debounced
 * and the previous page stays on screen while the next one loads, so typing never floods the API.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { http } from "./client";
import { fetchOverview } from "./studio";
import { mapEntitlement, mapMember, mapOrder, mapSeat, mapStoreProduct, type BackendPage } from "./live";
import { requireAgencyId } from "./session-store";
import type { CatalogProduct, Entitlement, Invitation, MemberRow, Order, Page, ProductStatus, Seat, StoreProduct } from "./types";

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const pageOf = <T,>(items: T[], page: Partial<BackendPage> | undefined, limit: number, offset: number): Page<T> => ({
  items,
  total: Number(page?.total ?? items.length),
  limit: Number(page?.limit ?? limit),
  offset: Number(page?.offset ?? offset),
});

/** Waits until the value stops changing, so a search box sends one request per pause, not one per keystroke. */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export interface PageQuery {
  search?: string | undefined;
  limit: number;
  offset: number;
}

// ---- Catalog (platform staff) ---------------------------------------------------------------------------

export interface CatalogCounts {
  all: number;
  active: number;
  draft: number;
  retired: number;
}
export interface CatalogPageResult extends Page<CatalogProduct> {
  counts: CatalogCounts;
}

export async function fetchCatalogPage(q: PageQuery & { status?: ProductStatus | "all" }): Promise<CatalogPageResult> {
  const raw = await http<{ products: any[]; page: BackendPage; counts: CatalogCounts }>("GET", "/api/catalog/products", undefined, {
    query: { limit: q.limit, offset: q.offset, search: q.search || undefined, status: q.status && q.status !== "all" ? q.status : undefined },
  });
  const items: CatalogProduct[] = arr<any>(raw.products).map((p) => ({
    publicId: p.publicId,
    code: p.code,
    name: p.name,
    productType: p.productType,
    status: p.status,
    content: p.content ?? null,
    prices: arr<any>(p.prices).map((x) => ({ ...x, activeFrom: String(x.activeFrom), activeUntil: x.activeUntil ? String(x.activeUntil) : null })),
  }));
  return { ...pageOf(items, raw.page, q.limit, q.offset), counts: raw.counts };
}
export const useCatalogPage = (q: PageQuery & { status?: ProductStatus | "all" }) =>
  useQuery({ queryKey: ["catalog", "page", q], queryFn: () => fetchCatalogPage(q), placeholderData: keepPreviousData });

// ---- Storefront ---------------------------------------------------------------------------------------------

export async function fetchStorePage(q: PageQuery): Promise<Page<StoreProduct>> {
  const raw = await http<{ products: any[]; page: BackendPage }>("GET", "/api/store/products", undefined, {
    query: { limit: q.limit, offset: q.offset, search: q.search || undefined },
  });
  return pageOf(arr<any>(raw.products).map(mapStoreProduct), raw.page, q.limit, q.offset);
}
export const useStorePage = (q: PageQuery) =>
  useQuery({ queryKey: ["store", "page", q], queryFn: () => fetchStorePage(q), placeholderData: keepPreviousData });

// ---- Agency: invitations, entitlements, seats, member search -------------------------------------------------

export async function fetchInvitationsPage(q: PageQuery): Promise<Page<Invitation>> {
  const raw = await http<{ invitations: any[]; page: BackendPage }>("GET", `/api/agencies/${requireAgencyId()}/invitations`, undefined, {
    query: { status: "pending", limit: q.limit, offset: q.offset, search: q.search || undefined },
  });
  const items = arr<any>(raw.invitations).map((inv) => ({
    id: String(inv.id),
    emailNormalized: inv.emailNormalized,
    roleCode: inv.roleCode,
    expiresAt: inv.expiresAt,
    status: "pending" as const,
  }));
  return pageOf(items, raw.page, q.limit, q.offset);
}
export const useInvitationsPage = (q: PageQuery) =>
  useQuery({ queryKey: ["invitations", "page", q], queryFn: () => fetchInvitationsPage(q), placeholderData: keepPreviousData });

export async function fetchEntitlementsPage(q: { limit: number; offset: number }): Promise<Page<Entitlement>> {
  const raw = await http<{ entitlements: any[]; page: BackendPage }>("GET", `/api/agencies/${requireAgencyId()}/entitlements`, undefined, { query: q });
  return pageOf(arr<any>(raw.entitlements).map(mapEntitlement), raw.page, q.limit, q.offset);
}
export const useEntitlementsPage = (q: { limit: number; offset: number }) =>
  useQuery({ queryKey: ["entitlements", "page", q], queryFn: () => fetchEntitlementsPage(q), placeholderData: keepPreviousData });

export async function fetchSeatsPage(entitlementId: string, q: PageQuery): Promise<Page<Seat>> {
  const raw = await http<{ seats: any[]; page: BackendPage }>("GET", `/api/agencies/${requireAgencyId()}/entitlements/${entitlementId}/seats`, undefined, {
    query: { limit: q.limit, offset: q.offset, search: q.search || undefined },
  });
  return pageOf(arr<any>(raw.seats).map((row, i) => mapSeat(row, q.offset + i)), raw.page, q.limit, q.offset);
}
export const useSeatsPage = (entitlementId: string | null, q: PageQuery) =>
  useQuery({
    queryKey: ["seats", "page", entitlementId, q],
    queryFn: () => fetchSeatsPage(entitlementId as string, q),
    enabled: !!entitlementId,
    placeholderData: keepPreviousData,
  });

/** Type-ahead for "who gets this seat": at most 8 matching active members per request, never the whole roster. */
export async function searchActiveMembers(term: string): Promise<MemberRow[]> {
  const raw = await http<{ members: any[] }>("GET", `/api/agencies/${requireAgencyId()}/members`, undefined, {
    query: { limit: 8, offset: 0, status: "active", search: term || undefined },
  });
  return arr<any>(raw.members).map(mapMember);
}
export const useMemberSearch = (term: string, enabled = true) =>
  useQuery({ queryKey: ["members", "search", term], queryFn: () => searchActiveMembers(term), enabled, placeholderData: keepPreviousData });

// ---- Platform: orders ---------------------------------------------------------------------------------------

export async function fetchPlatformOrders(q: PageQuery & { status?: string | undefined }): Promise<Page<Order>> {
  const raw = await http<{ orders: any[]; page: BackendPage }>("GET", "/api/platform/orders", undefined, {
    query: { limit: q.limit, offset: q.offset, search: q.search || undefined, status: q.status && q.status !== "all" ? q.status : undefined },
  });
  return pageOf(arr<any>(raw.orders).map(mapOrder), raw.page, q.limit, q.offset);
}
export const usePlatformOrders = (q: PageQuery & { status?: string | undefined }) =>
  useQuery({ queryKey: ["all-orders", "page", q], queryFn: () => fetchPlatformOrders(q), placeholderData: keepPreviousData });

// ---- Courses (Content studio, course pickers) ---------------------------------------------------------------

export const useOverviewPage = (q: PageQuery & { unsold?: boolean; courseUuid?: string | undefined }, enabled = true) =>
  useQuery({ queryKey: ["studio-overview", "page", q], queryFn: () => fetchOverview(q), enabled, placeholderData: keepPreviousData });
