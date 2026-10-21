import { api } from "@/lib/api/client";
import { agencyPublicId, type AgencyMembership } from "@/features/auth/types";
import { useSession } from "@/features/auth/session-context";
import { useAgency } from "@/features/auth/agency-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListQuery, Paginated } from "@/lib/api/types";

/**
 * Agency administration API — verified against the real backend.
 *
 * The backend keeps internal numeric ids for memberships/invitations/seats and a public
 * uuid for agencies/orders/products. The adapters below map backend payloads into the
 * view models the pages use, so the UI does not depend on wire-format naming.
 */

export interface AgencyMember {
  uuid: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
  status: string;
  joined_at?: string;
  agency_role?: string;
}

export interface AgencyInvitation {
  uuid: string;
  email: string;
  role: string;
  status: string;
  invited_at?: string;
  expires_at?: string;
}

export interface AgencyEntitlement {
  uuid: string;
  product?: { uuid?: string; slug?: string; name: string };
  seats_total: number;
  seats_assigned: number;
  status: string;
  expires_at?: string;
}

export interface SeatAssignment {
  uuid: string;
  entitlement: { uuid: string; name: string };
  learner: { email: string; first_name?: string; last_name?: string };
  assigned_at?: string;
  status: string;
}

export interface AgencyOrder {
  uuid: string;
  number?: string;
  status: string;
  total_cents?: number;
  created_at?: string;
  items?: { product?: { name: string }; quantity: number; unit_price_cents?: number }[];
}

export interface BillingInfo {
  subscription_status?: string;
  renews_at?: string;
  billing_portal_url?: string;
  payment_method?: string;
}

export interface AgencyReportOverview {
  members: { active: number };
  seats: { capacity: number; assigned: number };
  enrollments: { total: number; completed: number; inProgress: number; completionPercent: number | null };
  assessments: {
    attempts: number;
    graded: number;
    passed: number;
    passRatePercent: number | null;
    averageScorePercent: number | null;
  };
  certificates: { issued: number; revoked: number };
}

export interface AgencyLearnerReport {
  learnerName: string;
  email: string;
  membershipStatus: string;
  courseTitle: string;
  enrollmentStatus: string;
  progressPercent: number;
  assignedAt: string;
  completedAt: string | null;
  bestScorePercent: number | null;
  assessmentsPassed: number;
  assessmentsTotal: number;
}

export interface AgencyAuditEntry {
  id: string;
  action: string;
  actorType: string;
  subjectType: string;
  occurredAt: string;
}

export interface StorePrice {
  id: string;
  billingPeriod: "annual" | "monthly";
  currency: string;
  unitAmountMinor: number;
  isActive: boolean;
}

/** Store product as sold to agencies (catalogue + checkout). */
export interface StoreProduct {
  uuid: string;
  slug?: string;
  name: string;
  description?: string;
  price_cents?: number;
  status?: string;
  prices?: StorePrice[];
}

const memberName = (member: { first_name?: string; last_name?: string; email: string }) =>
  [member.first_name, member.last_name].filter(Boolean).join(" ") || member.email;

export { memberName };

export function useActiveAgencyId(): string | null {
  const { status } = useSession();
  const { activeAgencyPublicId } = useAgency();
  return status === "authenticated" ? activeAgencyPublicId : null;
}

export const agencyKeys = {
  members: (agencyId: string | null, query: ListQuery) => ["agency", agencyId, "members", query] as const,
  invitations: (agencyId: string | null, status: string) => ["agency", agencyId, "invitations", status] as const,
  entitlements: (agencyId: string | null) => ["agency", agencyId, "entitlements"] as const,
  seats: (agencyId: string | null) => ["agency", agencyId, "seats"] as const,
  orders: (agencyId: string | null, query: ListQuery) => ["agency", agencyId, "orders", query] as const,
  order: (uuid: string) => ["agency", "orders", uuid] as const,
  billing: (agencyId: string | null) => ["agency", agencyId, "billing"] as const,
  overview: (agencyId: string | null) => ["agency", agencyId, "overview"] as const
};

// ---- Wire types + mappers ------------------------------------------------------------

interface BackendMember {
  membershipId: string;
  membershipStatus: string;
  joinedAt: string | null;
  user: { email: string; firstName: string; lastName: string };
  roles: string[];
}

function highestRole(roles: string[]): string {
  if (roles.includes("agency_admin")) return "agency_admin";
  return roles[0] ?? "learner";
}

function toPage<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { items, total, page, page_size: pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

function mapOrder(raw: any): AgencyOrder {
  return {
    uuid: raw.publicId,
    status: raw.status,
    total_cents: raw.totalMinor,
    created_at: raw.createdAt,
    items: raw.item
      ? [
          {
            product: { name: raw.item.productName },
            quantity: raw.item.quantity,
            unit_price_cents: raw.item.unitAmountMinor
          }
        ]
      : []
  };
}

function mapProduct(raw: any): StoreProduct {
  const prices: StorePrice[] = (raw.prices ?? []).map((price: any) => ({
    id: price.id,
    billingPeriod: price.billingPeriod,
    currency: price.currency,
    unitAmountMinor: price.unitAmountMinor,
    isActive: price.isActive
  }));
  const chosen =
    prices.find((p) => p.billingPeriod === "annual" && p.isActive) ??
    prices.find((p) => p.isActive) ??
    prices[0];
  return {
    uuid: raw.publicId,
    name: raw.name,
    description: raw.description,
    price_cents: chosen?.unitAmountMinor,
    prices
  };
}

export const agencyApi = {
  overview(agencyId: string): Promise<{ members?: number; pending_invitations?: number; seats_available?: number; recent_orders?: number }> {
    return api.get(`/api/agencies/${agencyId}/overview`);
  },

  async members(
    agencyId: string,
    query: ListQuery & { q?: string }
  ): Promise<Paginated<AgencyMember>> {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.max(1, Number(query.pageSize ?? 25));
    const raw = await api.get<{ members: BackendMember[]; page: { total: number } }>(
      `/api/agencies/${agencyId}/members`,
      {
        query: {
          limit: pageSize,
          offset: (page - 1) * pageSize,
          search: query.q ?? query.search
        }
      }
    );
    const items = raw.members.map((member) => ({
      uuid: member.membershipId,
      email: member.user.email,
      first_name: member.user.firstName,
      last_name: member.user.lastName,
      role: highestRole(member.roles),
      status: member.membershipStatus,
      joined_at: member.joinedAt ?? undefined
    }));
    return toPage(items, raw.page.total, page, pageSize);
  },

  async updateMember(
    agencyId: string,
    memberUuid: string,
    payload: { role?: string; status?: string }
  ): Promise<void> {
    if (payload.status) {
      const action =
        payload.status === "active" ? "reactivate" : payload.status === "suspended" ? "suspend" : "remove";
      await api.post(`/api/agencies/${agencyId}/members/${memberUuid}/status`, { action });
    }
    if (payload.role) {
      await api.post(`/api/agencies/${agencyId}/members/${memberUuid}/role`, { role: payload.role });
    }
  },

  /** Queue a CSV of invitations (`email` column, optional `role`). Processed in the background. */
  bulkInvite(agencyId: string, csvText: string): Promise<BulkImportJob> {
    return api.post<BulkImportJob>(`/api/agencies/${agencyId}/invitations/bulk`, undefined, {
      rawBody: { text: csvText, contentType: "text/csv" }
    });
  },

  /** Progress and per-row outcome of a bulk invitation upload. */
  bulkInviteJob(agencyId: string, importJobId: string, signal?: AbortSignal): Promise<BulkImportJob> {
    return api.get<BulkImportJob>(`/api/agencies/${agencyId}/invitations/bulk/${importJobId}`, { signal });
  },

  async invitations(agencyId: string, status?: string): Promise<{ items: AgencyInvitation[] }> {
    const raw = await api.get<{
      invitations: {
        id: string;
        emailNormalized: string;
        roleCode: string;
        status: string;
        expiresAt: string;
        createdAt: string;
      }[];
    }>(`/api/agencies/${agencyId}/invitations`, { query: { status: status ?? "pending" } });
    return {
      items: raw.invitations.map((invitation) => ({
        uuid: invitation.id,
        email: invitation.emailNormalized,
        role: invitation.roleCode,
        status: invitation.status,
        invited_at: invitation.createdAt,
        expires_at: invitation.expiresAt
      }))
    };
  },

  invite(
    agencyId: string,
    payload: { email: string; first_name?: string; last_name?: string; role: string }
  ): Promise<void> {
    return api.post(`/api/agencies/${agencyId}/invitations`, {
      email: payload.email,
      roleCode: payload.role
    });
  },

  revokeInvitation(agencyId: string, invitationUuid: string): Promise<void> {
    return api.post(`/api/agencies/${agencyId}/invitations/${invitationUuid}/revoke`);
  },

  async entitlements(agencyId: string): Promise<{ items: AgencyEntitlement[] }> {
    const raw = await api.get<{
      entitlements: {
        id: string;
        productName: string;
        status: string;
        seatCapacity: number;
        seatsUsed: number;
        validUntil: string;
      }[];
    }>(`/api/agencies/${agencyId}/entitlements`);
    return {
      items: raw.entitlements.map((entitlement) => ({
        uuid: entitlement.id,
        product: { name: entitlement.productName },
        seats_total: entitlement.seatCapacity,
        seats_assigned: entitlement.seatsUsed,
        status: entitlement.status,
        expires_at: entitlement.validUntil
      }))
    };
  },

  seats(agencyId: string): Promise<{ items: SeatAssignment[] }> {
    return api.get(`/api/agencies/${agencyId}/seats`);
  },

  releaseSeat(agencyId: string, entitlementId: string, seatUuid: string): Promise<void> {
    return api.post(
      `/api/agencies/${agencyId}/entitlements/${entitlementId}/seats/${seatUuid}/release`,
      { reason: "Released by administrator" }
    );
  },

  reassignSeat(
    agencyId: string,
    entitlementId: string,
    seatUuid: string,
    memberUuid: string
  ): Promise<void> {
    return api.post(
      `/api/agencies/${agencyId}/entitlements/${entitlementId}/seats/${seatUuid}/reassign`,
      { toMembershipId: memberUuid, reason: "Reassigned by administrator" }
    );
  },

  async orders(agencyId: string, query: ListQuery & { q?: string }): Promise<Paginated<AgencyOrder>> {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.max(1, Number(query.pageSize ?? 25));
    const raw = await api.get<{ orders: any[]; page: { total: number } }>(`/api/agencies/${agencyId}/orders`, {
      query: { limit: pageSize, offset: (page - 1) * pageSize }
    });
    return toPage(raw.orders.map(mapOrder), raw.page.total, page, pageSize);
  },

  async order(agencyId: string, orderUuid: string): Promise<AgencyOrder> {
    const raw = await api.get<{ order: any }>(`/api/agencies/${agencyId}/orders/${orderUuid}`);
    return mapOrder(raw.order);
  },

  async billing(agencyId: string): Promise<BillingInfo> {
    const raw = await api.post<{ url: string }>(`/api/agencies/${agencyId}/billing-portal`);
    return { billing_portal_url: raw.url };
  },

  reportsOverview(agencyId: string): Promise<AgencyReportOverview> {
    return api.get(`/api/agencies/${agencyId}/reports/overview`);
  },

  async reportsLearners(agencyId: string): Promise<{ items: AgencyLearnerReport[] }> {
    return api.get(`/api/agencies/${agencyId}/reports/learners`);
  },

  async auditLog(agencyId: string, limit = 6): Promise<{ items: AgencyAuditEntry[] }> {
    const raw = await api.get<{ items: AgencyAuditEntry[] }>(`/api/agencies/${agencyId}/audit-log`, {
      query: { limit }
    });
    return { items: raw.items };
  },

  async storeProducts(): Promise<{ items: StoreProduct[]; total: number; pages: number }> {
    const raw = await api.get<{ products: any[] }>("/api/store/products");
    const items = raw.products.map(mapProduct);
    return { items, total: items.length, pages: 1 };
  },

  async storeProduct(productPublicId: string, signal?: AbortSignal): Promise<StoreProduct> {
    const raw = await api.get<{ product: any }>(`/api/store/products/${productPublicId}`, { signal });
    return mapProduct(raw.product);
  },

  /**
   * `idempotencyKey` identifies one checkout: repeating the request (double-click, retry,
   * lost response) returns the order it already created instead of placing a second one.
   */
  async createOrder(payload: {
    agencyId: string;
    priceId: string;
    quantity: number;
    paymentMethod: "card" | "invoice";
    purchaseOrderNumber?: string;
    idempotencyKey: string;
  }): Promise<{ order: AgencyOrder; checkoutUrl?: string | null; replayed: boolean }> {
    const raw = await api.post<{ order: any; checkoutUrl?: string | null; replayed?: boolean }>(
      `/api/agencies/${payload.agencyId}/orders`,
      {
        priceId: payload.priceId,
        quantity: payload.quantity,
        paymentMethod: payload.paymentMethod,
        ...(payload.purchaseOrderNumber ? { purchaseOrderNumber: payload.purchaseOrderNumber } : {})
      },
      { headers: { "Idempotency-Key": payload.idempotencyKey } }
    );
    return { order: mapOrder(raw.order), checkoutUrl: raw.checkoutUrl ?? null, replayed: raw.replayed === true };
  }
};

export interface BulkImportJob {
  importJobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  totalRows: number;
  invited: number;
  failed: number;
  errors: { row: number; email: string; message: string }[];
  errorsTruncated: boolean;
  createdAt: string;
  completedAt: string | null;
  maxRows?: number;
}

/** Convenience: current agency public id + whether it is URL-safe. */
export function useAgencyScope() {
  const { status } = useSession();
  const { activeAgency, activeAgencyPublicId, missingPublicId } = useAgency();
  return { enabled: status === "authenticated", agency: activeAgency, agencyId: activeAgencyPublicId, missingPublicId };
}

export function agencyName(membership: AgencyMembership | null): string {
  return membership ? agencyPublicId(membership) ?? membership.name : "";
}

export function useAgencyOverview() {
  const { agencyId, enabled } = useAgencyScope();
  return useQuery({
    queryKey: agencyKeys.overview(agencyId),
    queryFn: () => agencyApi.overview(agencyId as string),
    enabled: enabled && Boolean(agencyId)
  });
}

export function useAgencyMembers(query: ListQuery & { q?: string }) {
  const { agencyId, enabled } = useAgencyScope();
  return useQuery({
    queryKey: agencyKeys.members(agencyId, query),
    queryFn: () => agencyApi.members(agencyId as string, query),
    enabled: enabled && Boolean(agencyId)
  });
}

export function useUpdateMember() {
  const { agencyId } = useAgencyScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { memberUuid: string; role?: string; status?: string }) =>
      agencyApi.updateMember(agencyId as string, payload.memberUuid, {
        role: payload.role,
        status: payload.status
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agency", agencyId, "members"] });
    }
  });
}

// ---- Extensions (CPMI agency area) ----------------------------------------------------

/** Full order view as returned by GET /api/agencies/:id/orders/:orderPublicId. */
export interface AgencyOrderDetail {
  uuid: string;
  status: string;
  paymentMethod: "card" | "invoice";
  currency: string;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  purchaseOrderNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  item: {
    productName: string;
    quantity: number;
    unitAmountMinor: number;
    lineTotalMinor: number;
    billingPeriod: string;
  } | null;
}

/** Seat row from GET /api/agencies/:id/seats (includes the holder's membership id). */
export interface AgencySeat extends SeatAssignment {
  learner: SeatAssignment["learner"] & { membership_id?: string };
}

export interface AgencyProfile {
  publicId: string;
  slug: string;
  displayName: string;
  status: string;
}

function mapOrderDetail(raw: any): AgencyOrderDetail {
  return {
    uuid: raw.publicId,
    status: raw.status,
    paymentMethod: raw.paymentMethod,
    currency: raw.currency,
    subtotalMinor: Number(raw.subtotalMinor ?? 0),
    taxMinor: Number(raw.taxMinor ?? 0),
    totalMinor: Number(raw.totalMinor ?? 0),
    purchaseOrderNumber: raw.purchaseOrderNumber ?? null,
    paidAt: raw.paidAt ?? null,
    createdAt: raw.createdAt,
    item: raw.item ?? null
  };
}

export const agencyApiExt = {
  async agency(agencyId: string): Promise<AgencyProfile> {
    const raw = await api.get<{ agency: AgencyProfile }>(`/api/agencies/${agencyId}`);
    return raw.agency;
  },

  async orders(agencyId: string, page: number, pageSize = 25): Promise<Paginated<AgencyOrderDetail>> {
    const raw = await api.get<{ orders: any[]; page: { total: number } }>(`/api/agencies/${agencyId}/orders`, {
      query: { limit: pageSize, offset: (page - 1) * pageSize }
    });
    return toPage(raw.orders.map(mapOrderDetail), raw.page.total, page, pageSize);
  },

  async order(agencyId: string, orderUuid: string): Promise<AgencyOrderDetail> {
    const raw = await api.get<{ order: any }>(`/api/agencies/${agencyId}/orders/${orderUuid}`);
    return mapOrderDetail(raw.order);
  },

  seats(agencyId: string): Promise<{ items: AgencySeat[] }> {
    return api.get(`/api/agencies/${agencyId}/seats`);
  },

  assignSeat(agencyId: string, entitlementId: string, membershipId: string): Promise<unknown> {
    return api.post(`/api/agencies/${agencyId}/entitlements/${entitlementId}/seats`, { membershipId });
  },

  /** Creates a Stripe billing-portal session; the caller redirects to `url`. */
  billingPortal(agencyId: string): Promise<{ url: string }> {
    return api.post<{ url: string }>(`/api/agencies/${agencyId}/billing-portal`);
  },

  learnersCsvUrl: (agencyId: string) => `/api/agencies/${agencyId}/reports/learners.csv`,
  learnersPdfUrl: (agencyId: string) => `/api/agencies/${agencyId}/reports/learners.pdf`
};

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function formatMoney(minor: number | undefined | null, currency = "USD"): string {
  if (minor === undefined || minor === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
