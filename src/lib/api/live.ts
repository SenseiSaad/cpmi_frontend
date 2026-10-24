/**
 * Live API adapter — implements the same surface as the in-memory mock, but over the real
 * cpmi-backend (through the same-origin `/api/*` rewrite). Every page keeps calling
 * `api.<area>.<method>`; this file owns the wire-format mapping so the UI never sees
 * snake_case or numeric ids where it expects view models.
 *
 * Endpoints and shapes are taken from the backend routes (see cpmi-backend/src/http/routes).
 */
import type {
  ActivityItem,
  AgencySummary,
  BulkInviteResult,
  Certificate,
  CatalogProduct,
  Course,
  CourseVersion,
  Entitlement,
  EntitlementStatus,
  HealthSnapshot,
  Invitation,
  LearnCourse,
  MemberRow,
  NotificationItem,
  Order,
  Page,
  PlaceOrderInput,
  PlatformKpis,
  QuizQuestion,
  RoleCode,
  Seat,
  SessionUser,
  StoreProduct,
} from "./types";
import { http } from "./client";
import { ApiClientError } from "./error";
import { getSessionUser, mapBackendUser, requireAgencyId, setSessionUser, type BackendUser } from "./session-store";

interface BackendPage {
  total: number;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

const asRecord = (v: unknown): Record<string, any> => (v && typeof v === "object" ? (v as Record<string, any>) : {});
const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const bestEffortNumber = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

function toPage<T>(items: T[], raw: BackendPage): Page<T> {
  const limit = raw.limit ?? raw.pageSize ?? items.length;
  const offset = raw.offset ?? ((raw.page ?? 1) - 1) * limit;
  return { items, total: raw.total ?? items.length, limit, offset };
}

function mapPrice(raw: any) {
  return {
    id: String(raw.id),
    billingPeriod: raw.billingPeriod as "annual" | "monthly",
    currency: raw.currency ?? "USD",
    unitAmountMinor: bestEffortNumber(raw.unitAmountMinor),
    activeFrom: raw.activeFrom ?? "",
    activeUntil: raw.activeUntil ?? null,
    isActive: Boolean(raw.isActive),
  };
}

function mapOrder(raw: any): Order {
  return {
    publicId: raw.publicId,
    status: raw.status,
    paymentMethod: raw.paymentMethod,
    currency: raw.currency ?? "USD",
    subtotalMinor: bestEffortNumber(raw.subtotalMinor),
    taxMinor: bestEffortNumber(raw.taxMinor),
    totalMinor: bestEffortNumber(raw.totalMinor),
    purchaseOrderNumber: raw.purchaseOrderNumber ?? null,
    paidAt: raw.paidAt ?? null,
    createdAt: raw.createdAt ?? "",
    item: raw.item
      ? {
          productName: raw.item.productName,
          quantity: bestEffortNumber(raw.item.quantity),
          unitAmountMinor: bestEffortNumber(raw.item.unitAmountMinor),
          lineTotalMinor: bestEffortNumber(raw.item.lineTotalMinor),
          billingPeriod: raw.item.billingPeriod ?? "",
        }
      : null,
    ...(raw.agencyName ? { agencyName: raw.agencyName } : {}),
  };
}

function mapMember(raw: any): MemberRow {
  return {
    membershipId: String(raw.membershipId),
    membershipStatus: raw.membershipStatus,
    employeeReference: raw.employeeReference ?? null,
    joinedAt: raw.joinedAt ?? null,
    user: {
      publicId: raw.user?.publicId ?? "",
      email: raw.user?.email ?? "",
      firstName: raw.user?.firstName ?? "",
      lastName: raw.user?.lastName ?? "",
      status: raw.user?.status ?? "active",
    },
    roles: (raw.roles ?? []) as RoleCode[],
    // Learner progress is not part of the member list API yet.
    progress: 0,
    lastActiveAt: raw.lastActiveAt ?? null,
  };
}

function mapEntitlement(raw: any): Entitlement {
  return {
    id: String(raw.id),
    productName: raw.productName,
    status: raw.status as EntitlementStatus,
    seatCapacity: bestEffortNumber(raw.seatCapacity),
    seatsUsed: bestEffortNumber(raw.seatsUsed),
    validFrom: raw.validFrom ?? "",
    validUntil: raw.validUntil ?? "",
  };
}

function mapSeat(raw: any, index: number): Seat {
  const learner = raw.learner ?? raw.member;
  return {
    assignmentId: raw.assignmentId != null ? String(raw.assignmentId) : raw.uuid != null ? String(raw.uuid) : null,
    slotNo: bestEffortNumber(raw.slotNo, index + 1),
    membershipId: raw.membershipId != null ? String(raw.membershipId) : raw.learner?.membership_id != null ? String(raw.learner.membership_id) : null,
    member: learner
      ? {
          email: learner.email ?? "",
          firstName: learner.firstName ?? learner.first_name ?? "",
          lastName: learner.lastName ?? learner.last_name ?? "",
        }
      : null,
    assignedAt: raw.assignedAt ?? raw.assigned_at ?? null,
  };
}

function mapStoreProduct(raw: any): StoreProduct {
  return {
    publicId: raw.publicId,
    code: raw.code ?? "",
    name: raw.name,
    productType: raw.productType,
    description: raw.description ?? "",
    highlights: asArray<string>(raw.highlights),
    prices: asArray<any>(raw.prices).map(mapPrice),
  };
}

function mapCatalogProduct(raw: any): CatalogProduct {
  const content = raw.content ?? null;
  return {
    publicId: raw.publicId,
    code: raw.code ?? "",
    name: raw.name,
    productType: raw.productType,
    status: raw.status,
    content: content
      ? {
          kind: content.courseId ? "course" : "module",
          title: content.title ?? raw.name ?? "",
          refId: content.courseId ?? content.moduleId ?? undefined,
        }
      : null,
    prices: asArray<any>(raw.prices).map(mapPrice),
  };
}

function mapAgencySummary(raw: any): AgencySummary {
  return {
    publicId: raw.publicId ?? raw.uuid,
    slug: raw.slug ?? "",
    displayName: raw.displayName ?? raw.name ?? "",
    legalName: raw.legalName ?? raw.name ?? "",
    status: raw.status,
    billingEmail: raw.billingEmail ?? null,
    memberCount: bestEffortNumber(raw.memberCount ?? raw.member_count),
    seatsUsed: bestEffortNumber(raw.seatsUsed ?? raw.seats_used),
    seatCapacity: bestEffortNumber(raw.seatCapacity),
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    state: raw.state ?? "—",
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchAllMembers(status?: string): Promise<MemberRow[]> {
  const agencyId = requireAgencyId();
  const raw = await http<{ members: any[]; page: BackendPage }>("GET", `/api/agencies/${agencyId}/members`, undefined, {
    query: { limit: 100, offset: 0, ...(status ? { status } : {}) },
  });
  return asArray<any>(raw.members).map(mapMember);
}

/** Pick the signed-in user's first agency public id (also used by hooks). */
function agencyId(): string {
  return requireAgencyId();
}

/** Resolve the one course that drives the learner experience. */
async function primaryEnrollment() {
  const raw = await http<{ items: any[] }>("GET", "/api/me/enrollments");
  const items = asArray<any>(raw.items);
  if (items.length === 0) return null;
  const active = items.find((e) => e.status !== "completed" && e.status !== "expired") ?? items[0];
  return active;
}

export const liveApi = {
  auth: {
    async login(email: string, password: string): Promise<SessionUser> {
      const raw = await http<{ user: BackendUser }>("POST", "/api/auth/login", { email, password });
      const user = mapBackendUser(raw.user);
      setSessionUser(user);
      return user;
    },

    async requestReset(email: string): Promise<void> {
      await http("POST", "/api/auth/password-reset/request", { email });
    },

    async confirmReset(token: string, password: string): Promise<void> {
      await http("POST", "/api/auth/password-reset/confirm", { token, password });
    },

    /** Accepts an invitation. The backend signs the invitee in on success. */
    async acceptInvitation(
      token: string,
      account: { firstName: string; lastName: string; password: string },
    ): Promise<{ signedIn: boolean }> {
      const raw = await http<{ signedIn?: boolean; user?: BackendUser; message?: string }>(
        "POST",
        "/api/invitations/accept",
        { token, ...account },
      );
      if (raw.user) setSessionUser(mapBackendUser(raw.user));
      return { signedIn: raw.signedIn === true || Boolean(raw.user) };
    },

    async logout(): Promise<void> {
      try {
        await http("POST", "/api/auth/logout");
      } finally {
        setSessionUser(null);
      }
    },
  },

  members: {
    async list(q: Parameters<typeof mockList>[0] = {}): Promise<Page<MemberRow>> {
      return mockList(q);
    },
    async all(): Promise<MemberRow[]> {
      return fetchAllMembers("active");
    },
    async setStatus(membershipId: string, action: "suspend" | "reactivate" | "remove"): Promise<void> {
      await http("POST", `/api/agencies/${agencyId()}/members/${membershipId}/status`, { action });
    },
    async setEmployeeReference(membershipId: string, value: string | null): Promise<void> {
      await http("PATCH", `/api/agencies/${agencyId()}/members/${membershipId}`, { employeeReference: value?.trim() || null });
    },
    async setRole(membershipId: string, role: "agency_admin" | "learner"): Promise<void> {
      await http("POST", `/api/agencies/${agencyId()}/members/${membershipId}/role`, { role });
    },
  },

  invitations: {
    async list(): Promise<Invitation[]> {
      const raw = await http<{ invitations: any[] }>("GET", `/api/agencies/${agencyId()}/invitations`, undefined, {
        query: { status: "pending" },
      });
      return asArray<any>(raw.invitations).map((inv) => ({
        id: String(inv.id),
        emailNormalized: inv.emailNormalized,
        roleCode: inv.roleCode,
        expiresAt: inv.expiresAt,
        status: "pending" as const,
      }));
    },
    async invite(email: string, roleCode: "learner" | "agency_admin"): Promise<void> {
      await http("POST", `/api/agencies/${agencyId()}/invitations`, { email, roleCode });
    },
    async revoke(id: string): Promise<void> {
      await http("POST", `/api/agencies/${agencyId()}/invitations/${id}/revoke`);
    },
    /** The backend processes CSV uploads asynchronously; the returned job carries progress. */
    async bulk(rows: { email: string; role: string }[], _canInviteAdmins: boolean): Promise<BulkInviteResult> {
      const csv = ["email,role", ...rows.map((r) => `${r.email},${r.role || "learner"}`)].join("\n");
      const job = await http<any>("POST", `/api/agencies/${agencyId()}/invitations/bulk`, undefined, {
        rawBody: { text: csv, contentType: "text/csv" },
      });
      return {
        totalRows: bestEffortNumber(job.totalRows, rows.length),
        invited: bestEffortNumber(job.invited),
        failed: bestEffortNumber(job.failed),
        errors: asArray<any>(job.errors).map((e) => ({ row: bestEffortNumber(e.row), email: e.email ?? "", message: e.message ?? "" })),
        status: job.status,
        importJobId: job.importJobId,
      };
    },
    async bulkJob(importJobId: string): Promise<BulkInviteResult> {
      const job = await http<any>("GET", `/api/agencies/${agencyId()}/invitations/bulk/${importJobId}`);
      return {
        totalRows: bestEffortNumber(job.totalRows),
        invited: bestEffortNumber(job.invited),
        failed: bestEffortNumber(job.failed),
        errors: asArray<any>(job.errors).map((e) => ({ row: bestEffortNumber(e.row), email: e.email ?? "", message: e.message ?? "" })),
        status: job.status,
        importJobId: job.importJobId,
      };
    },
  },

  seats: {
    async entitlements(): Promise<Entitlement[]> {
      const raw = await http<{ entitlements: any[] }>("GET", `/api/agencies/${agencyId()}/entitlements`);
      return asArray<any>(raw.entitlements).map(mapEntitlement);
    },
    async list(entitlementId: string): Promise<Seat[]> {
      const raw = await http<any>("GET", `/api/agencies/${agencyId()}/entitlements/${entitlementId}/seats`);
      const rows = asArray<any>(raw.seats ?? raw.items);
      return rows.map((row, index) => mapSeat(row, index));
    },
    async assign(entitlementId: string, membershipId: string): Promise<void> {
      await http("POST", `/api/agencies/${agencyId()}/entitlements/${entitlementId}/seats`, { membershipId });
    },
    async release(entitlementId: string, assignmentId: string): Promise<void> {
      await http("POST", `/api/agencies/${agencyId()}/entitlements/${entitlementId}/seats/${assignmentId}/release`, {
        reason: "Released by administrator",
      });
    },
    async reassign(entitlementId: string, assignmentId: string, toMembershipId: string): Promise<void> {
      await http("POST", `/api/agencies/${agencyId()}/entitlements/${entitlementId}/seats/${assignmentId}/reassign`, {
        toMembershipId,
        reason: "Reassigned by administrator",
      });
    },
  },

  store: {
    async products(): Promise<StoreProduct[]> {
      const raw = await http<{ products: any[] }>("GET", "/api/store/products");
      return asArray<any>(raw.products).map(mapStoreProduct);
    },
    async placeOrder(input: PlaceOrderInput): Promise<{ order: Order; checkoutUrl: string | null }> {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `ord-${Date.now()}`;
      const raw = await http<{ order: any; checkoutUrl?: string | null }>("POST", `/api/agencies/${agencyId()}/orders`, {
        priceId: input.priceId,
        quantity: input.quantity,
        paymentMethod: input.paymentMethod,
        ...(input.purchaseOrderNumber ? { purchaseOrderNumber: input.purchaseOrderNumber } : {}),
      }, { headers: { "Idempotency-Key": idempotencyKey } });
      return { order: mapOrder(raw.order), checkoutUrl: raw.checkoutUrl ?? null };
    },
    async orders(q: { limit?: number; offset?: number } = {}): Promise<Page<Order>> {
      const limit = q.limit ?? 10;
      const offset = q.offset ?? 0;
      const raw = await http<{ orders: any[]; page: BackendPage }>("GET", `/api/agencies/${agencyId()}/orders`, undefined, {
        query: { limit, offset },
      });
      return toPage(asArray<any>(raw.orders).map(mapOrder), { ...raw.page, limit, offset });
    },
    async billingPortal(): Promise<{ url: string }> {
      return http<{ url: string }>("POST", `/api/agencies/${agencyId()}/billing-portal`);
    },
    /**
     * Where an unpaid order can still be paid: the open Stripe Checkout page for a card order, or the
     * hosted invoice for a purchase-order invoice. The server first checks Stripe, so an order that was
     * already paid is never sent to pay again.
     */
    async resumeCheckout(orderPublicId: string): Promise<{ checkoutUrl: string }> {
      return http<{ checkoutUrl: string }>("POST", `/api/agencies/${agencyId()}/orders/${orderPublicId}/checkout`);
    },
    /**
     * Ask Stripe about the agency's pending orders and activate any that are really paid. This is what
     * confirms a payment when the Stripe webhook has not delivered (or has not been set up yet).
     */
    async refreshPending(): Promise<{ fulfilled: number; pending: number }> {
      const raw = await http<{ orders: { order: { status: string } }[]; fulfilled: number }>(
        "POST",
        `/api/agencies/${agencyId()}/orders/refresh`,
      );
      return {
        fulfilled: bestEffortNumber(raw.fulfilled),
        pending: asArray<any>(raw.orders).filter((o) => o?.order?.status === "pending").length,
      };
    },
  },

  platform: {
    async kpis(): Promise<PlatformKpis> {
      const [overview, revenue, completions] = await Promise.all([
        http<any>("GET", "/api/platform/reports/overview"),
        http<{ months: any[] }>("GET", "/api/platform/reports/revenue"),
        http<{ items: any[] }>("GET", "/api/platform/reports/completions"),
      ]);
      const months = asArray<any>(revenue.months);
      const last = months.at(-1)?.revenueCents ?? 0;
      const prev = months.at(-2)?.revenueCents ?? 0;
      const graded = bestEffortNumber(overview.assessments?.graded);
      const passed = bestEffortNumber(overview.assessments?.passed);
      return {
        revenueMinor: bestEffortNumber(overview.revenueCents),
        revenueDeltaPct: prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0,
        agencies: bestEffortNumber(overview.agencies?.total),
        activeLearners: bestEffortNumber(overview.enrollments?.total),
        completionRate: bestEffortNumber(overview.enrollments?.completionPercent),
        passRate: bestEffortNumber(overview.assessments?.passRatePercent),
        revenueSeries: months.map((m) => ({ label: m.month, value: bestEffortNumber(m.revenueCents) })),
        moduleCompletion: asArray<any>(completions.items).map((c) => ({
          label: c.courseTitle,
          value: bestEffortNumber(c.completionPercent),
        })),
        passFail: { pass: passed, fail: Math.max(0, graded - passed) },
      };
    },
    async health(): Promise<HealthSnapshot> {
      const raw = await http<any>("GET", "/api/platform/observability");
      const queues = asRecord(raw.queues);
      const audit = asRecord(queues.auditOutbox);
      const webhooks = asRecord(queues.stripeWebhooks);
      const notifications = asRecord(queues.notifications);
      return {
        integrityChecks: { total: 0, failed: 0 },
        auditQueue: {
          pending: bestEffortNumber(audit.pending),
          oldestMinutes: Math.round(bestEffortNumber(audit.oldestSeconds) / 60),
          deadLettered: bestEffortNumber(audit.failed),
        },
        webhooks: {
          processed24h: 0,
          failed: bestEffortNumber(webhooks.failed),
          stuck: bestEffortNumber(webhooks.pending),
        },
        email: {
          sent24h: 0,
          pending: bestEffortNumber(notifications.pending),
          failed: bestEffortNumber(notifications.failed),
        },
        workers: [
          { name: "audit-outbox", lastRunSeconds: bestEffortNumber(audit.oldestSeconds), ok: bestEffortNumber(audit.failed) === 0 },
          { name: "notifications", lastRunSeconds: bestEffortNumber(notifications.oldestSeconds), ok: bestEffortNumber(notifications.failed) === 0 },
          { name: "stripe-webhooks", lastRunSeconds: 0, ok: bestEffortNumber(webhooks.failed) === 0 },
        ],
      };
    },
    async agencies(q: { search?: string; status?: string; limit?: number; offset?: number } = {}): Promise<Page<AgencySummary>> {
      const limit = q.limit ?? 8;
      const offset = q.offset ?? 0;
      const raw = await http<any>("GET", "/api/platform/agencies", undefined, {
        query: { page: Math.floor(offset / limit) + 1, pageSize: limit, search: q.search },
      });
      let items = asArray<any>(raw.items ?? raw.agencies).map(mapAgencySummary);
      if (q.status && q.status !== "all") items = items.filter((a) => a.status === q.status);
      return toPage(items, { total: raw.total ?? items.length, limit, offset });
    },
    async agency(publicId: string): Promise<AgencySummary> {
      const raw = await http<any>("GET", `/api/platform/agencies/${publicId}`);
      return mapAgencySummary(raw.agency ?? raw);
    },
    async createAgency(input: { legalName: string; displayName: string; slug: string; billingEmail: string }): Promise<AgencySummary> {
      const raw = await http<{ agency: any }>("POST", "/api/agencies", input);
      return mapAgencySummary(raw.agency);
    },
    /** Platform staff invite an agency's first administrator; the person finishes sign-up from the emailed link. */
    async inviteAgencyAdmin(agencyPublicId: string, email: string): Promise<void> {
      await http("POST", `/api/agencies/${agencyPublicId}/invitations`, { email: email.trim(), roleCode: "agency_admin" });
    },
    async setAgencyStatus(publicId: string, status: "active" | "suspended"): Promise<void> {
      await http("PATCH", `/api/platform/agencies/${publicId}`, { status });
    },
    async allOrders(q: { limit?: number; offset?: number; status?: string } = {}): Promise<Page<Order>> {
      // There is no platform-wide orders endpoint; aggregate the first page of agencies.
      const limit = q.limit ?? 10;
      const offset = q.offset ?? 0;
      const agenciesRaw = await http<any>("GET", "/api/platform/agencies", undefined, { query: { page: 1, pageSize: 50 } });
      const agencies = asArray<any>(agenciesRaw.items ?? agenciesRaw.agencies);
      const results = await Promise.all(
        agencies.map(async (a) => {
          try {
            const raw = await http<{ orders: any[] }>("GET", `/api/agencies/${a.uuid ?? a.publicId}/orders`, undefined, {
              query: { limit: 100, offset: 0 },
            });
            return asArray<any>(raw.orders).map((o) => mapOrder({ ...o, agencyName: a.name ?? a.displayName }));
          } catch {
            return [];
          }
        }),
      );
      let all = results.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      if (q.status && q.status !== "all") all = all.filter((o) => o.status === q.status);
      return toPage(all.slice(offset, offset + limit), { total: all.length, limit, offset });
    },
    async entitlementStatus(entitlementId: string, action: "suspend" | "reactivate" | "revoke", note: string): Promise<void> {
      const status = action === "suspend" ? "suspended" : action === "reactivate" ? "active" : "revoked";
      await http("PATCH", `/api/platform/entitlements/${entitlementId}`, { status, note });
    },
  },

  catalog: {
    async products(status?: string): Promise<CatalogProduct[]> {
      const raw = await http<{ products: any[] }>("GET", "/api/catalog/products", undefined, {
        query: { status: status && status !== "all" ? status : undefined },
      });
      const products = asArray<any>(raw.products);
      return Promise.all(
        products.map(async (product) => {
          try {
            const [detail, prices] = await Promise.all([
              http<{ product: any }>("GET", `/api/catalog/products/${product.publicId}`),
              http<{ prices: any[] }>("GET", `/api/catalog/products/${product.publicId}/prices`),
            ]);
            return mapCatalogProduct({ ...product, ...detail.product, prices: prices.prices });
          } catch {
            return mapCatalogProduct(product);
          }
        }),
      );
    },
    async createProduct(input: { code: string; name: string; productType: "program" | "module" }): Promise<CatalogProduct> {
      const raw = await http<{ product: any }>("POST", "/api/catalog/products", input);
      return mapCatalogProduct(raw.product);
    },
    async attachContent(publicId: string, kind: "course" | "module", refId: string): Promise<void> {
      await http("POST", `/api/catalog/products/${publicId}/content`, kind === "course" ? { coursePublicId: refId } : { modulePublicId: refId });
    },
    async setStatus(publicId: string, action: "activate" | "retire"): Promise<void> {
      await http("POST", `/api/catalog/products/${publicId}/${action}`);
    },
    async addPrice(publicId: string, billingPeriod: "annual" | "monthly", unitAmountMinor: number): Promise<void> {
      await http("POST", `/api/catalog/products/${publicId}/prices`, { billingPeriod, unitAmountMinor, currency: "USD" });
    },
    async course(): Promise<Course> {
      const raw = await http<any>("GET", "/api/platform/courses", undefined, { query: { page: 1, pageSize: 1 } });
      const course = asArray<any>(raw.items ?? raw.courses)[0];
      if (!course) {
        return { publicId: "", code: "", title: "No course yet", versions: [] };
      }
      const versionsRaw = await http<any>("GET", `/api/platform/courses/${course.uuid ?? course.publicId}/versions`);
      const versions = asArray<any>(versionsRaw.versions ?? versionsRaw.items);
      const mapped = await Promise.all(versions.map((v) => hydrateCourseVersion(v)));
      return {
        publicId: course.uuid ?? course.publicId,
        code: course.slug ?? "",
        title: course.title,
        versions: mapped,
      };
    },
    async publishVersion(versionId: string): Promise<void> {
      await http("POST", `/api/platform/course-versions/${versionId}/publish`);
    },
    async publishModule(_versionId: string, moduleId: string): Promise<void> {
      await http("POST", `/api/catalog/module-versions/${moduleId}/publish`);
    },
    async saveLesson(): Promise<never> {
      // Authoring lesson content requires the content studio (create version → attach → publish),
      // which is out of scope for this release of the UI.
      throw new ApiClientError("unavailable", "Lesson editing is not available in this build.");
    },
    async newVersion(): Promise<CourseVersion> {
      const course = await this.course();
      const latest = course.versions[0];
      const raw = await http<{ version: any }>("POST", `/api/platform/courses/${course.publicId}/versions`, {
        version_label: `Edition ${(latest?.versionNo ?? 0) + 1}`,
      });
      return {
        id: String(raw.version.id),
        versionNo: raw.version.versionNo ?? (latest?.versionNo ?? 0) + 1,
        title: raw.version.title ?? `Edition ${(latest?.versionNo ?? 0) + 1}`,
        status: "draft",
        publishedAt: null,
        navigationMode: "sequential",
        certificateMode: "none",
        modules: [],
      };
    },
  },

  learner: {
    async course(): Promise<LearnCourse> {
      const enrollment = await primaryEnrollment();
      if (!enrollment) {
        return { id: "", title: "", description: "", progress: 0, validUntil: "", modules: [] };
      }
      const detail = await http<any>("GET", `/api/me/enrollments/${enrollment.uuid}`);
      const lessons = asArray<any>(detail.lessons);
      const groups = new Map<number, any[]>();
      for (const lesson of lessons) {
        const position = bestEffortNumber(lesson.modulePosition, 1);
        groups.set(position, [...(groups.get(position) ?? []), lesson]);
      }
      let currentSet = false;
      const modules = [...groups.entries()]
        .sort(([a], [b]) => a - b)
        .map(([position, rows]) => ({
          id: `module-${position}`,
          number: position,
          title: rows[0]?.moduleTitle ?? `Module ${position}`,
          summary: "",
          lessons: rows
            .sort((a, b) => bestEffortNumber(a.lessonPosition) - bestEffortNumber(b.lessonPosition))
            .map((lesson) => {
              const done = Boolean(lesson.completed);
              let state: "done" | "current" | "todo" | "locked" = done ? "done" : "todo";
              if (!done && !currentSet) {
                state = "current";
                currentSet = true;
              }
              return {
                id: lesson.uuid,
                title: lesson.title,
                type: lesson.lessonType,
                minutes: bestEffortNumber(lesson.durationMinutes),
                state,
              };
            }),
          quiz: null,
        }));
      return {
        id: enrollment.uuid,
        title: enrollment.course?.title ?? "My course",
        description: enrollment.course?.description ?? "",
        progress: bestEffortNumber(enrollment.progress_percent ?? detail.progress_percent),
        validUntil: enrollment.due_at ?? "",
        modules,
      };
    },

    async quiz(): Promise<QuizQuestion[]> {
      const enrollment = await primaryEnrollment();
      if (!enrollment) return [];
      const assessments = await http<{ items: any[] }>("GET", `/api/me/enrollments/${enrollment.uuid}/assessments`);
      const assessment =
        asArray<any>(assessments.items).find((a) => !a.hasPassed) ?? asArray<any>(assessments.items)[0];
      if (!assessment) return [];
      const attempts = await http<{ items: any[] }>(
        "GET",
        `/api/me/enrollments/${enrollment.uuid}/assessments/${assessment.assessmentPublicId}/attempts`,
      );
      const open = asArray<any>(attempts.items).find((a) => a.status === "in_progress");
      const inProgressId = open?.attemptPublicId ?? assessment.inProgressAttemptId;
      if (!inProgressId) return [];
      const attempt = await http<any>("GET", `/api/me/attempts/${inProgressId}`);
      return asArray<any>(attempt.questions).map((q) => ({
        id: q.questionPublicId,
        type: q.questionType,
        prompt: stripHtml(q.promptHtml ?? ""),
        options: asArray<any>(q.options).map((o) => ({ id: o.optionKey, text: o.optionText })),
        pairs: asArray<any>(q.pairs).map((p) => ({
          left: p.leftKey,
          rightOptions: [p.rightText],
          correct: "",
        })),
        explanation: q.results?.explanationHtml ? stripHtml(q.results.explanationHtml) : "",
      }));
    },

    async certificates(): Promise<Certificate[]> {
      const me = getSessionUser();
      const raw = await http<{ items: any[] }>("GET", "/api/me/certificates");
      return asArray<any>(raw.items).map((cert) => ({
        id: cert.uuid,
        number: cert.certificateNumber,
        title: cert.moduleTitle ?? cert.courseTitle ?? "Certificate",
        kind: cert.certificateType === "module" ? ("module" as const) : ("final" as const),
        holder: me ? `${me.firstName} ${me.lastName}`.trim() : "",
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt ?? null,
        status: cert.status === "revoked" ? ("revoked" as const) : cert.expiresAt && new Date(cert.expiresAt) < new Date() ? ("expired" as const) : ("valid" as const),
        agency: "",
      }));
    },

    async verify(number: string): Promise<Certificate | null> {
      const raw = await http<any>("GET", "/api/public/certificates/verify", undefined, { query: { token: number.trim() } });
      if (!raw?.found || !raw?.certificate) return null;
      const cert = raw.certificate;
      return {
        id: cert.certificateNumber,
        number: cert.certificateNumber,
        title: cert.moduleTitle ?? cert.courseTitle ?? "Certificate",
        kind: cert.certificateType === "module" ? "module" : "final",
        holder: cert.learnerName,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt ?? null,
        status: raw.valid ? "valid" : "revoked",
        agency: "",
      };
    },
  },

  feeds: {
    // The backend does not expose learner notifications/activity feeds yet; keep them empty
    // rather than inventing data.
    async activity(): Promise<ActivityItem[]> {
      return [];
    },
    async notifications(): Promise<NotificationItem[]> {
      return [];
    },
  },
};

// ---- helpers referenced above ----------------------------------------------------------

async function mockList(q: { status?: string; search?: string; limit?: number; offset?: number }): Promise<Page<MemberRow>> {
  const limit = q.limit ?? 10;
  const offset = q.offset ?? 0;
  const raw = await http<{ members: any[]; page: BackendPage }>("GET", `/api/agencies/${agencyId()}/members`, undefined, {
    query: { limit, offset, search: q.search, status: q.status && q.status !== "all" ? q.status : undefined },
  });
  return toPage(asArray<any>(raw.members).map(mapMember), { ...raw.page, limit, offset });
}

async function hydrateCourseVersion(raw: any): Promise<CourseVersion> {
  let modules: { id: string; code: string; title: string; description: string; status: "draft" | "published"; lessons: any[] }[] = [];
  try {
    const detail = await http<any>("GET", `/api/catalog/course-versions/${raw.id}`);
    const moduleRows = asArray<any>(detail.modules);
    modules = await Promise.all(
      moduleRows.map(async (module) => {
        let lessons: any[] = [];
        try {
          const moduleDetail = await http<any>("GET", `/api/catalog/module-versions/${module.moduleVersionId}`);
          lessons = asArray<any>(moduleDetail.lessons).map((lesson) => ({
            id: lesson.lessonVersionId,
            code: "",
            title: lesson.title,
            lessonType: lesson.lessonType,
            status: lesson.status,
            durationSeconds: null,
            isRequired: lesson.isRequired ?? true,
            completionRule: "open",
            completionThreshold: null,
            videoAssetId: null,
            bodyHtml: "",
          }));
        } catch {
          lessons = [];
        }
        return {
          id: String(module.moduleVersionId),
          code: "",
          title: module.title,
          description: "",
          status: module.status,
          lessons,
        };
      }),
    );
  } catch {
    modules = [];
  }
  return {
    id: String(raw.id),
    versionNo: bestEffortNumber(raw.versionNo),
    title: raw.title ?? "",
    status: raw.status,
    publishedAt: raw.publishedAt ?? null,
    navigationMode: raw.navigationMode === "free" ? "free" : "sequential",
    certificateMode: raw.certificateMode === "module_and_final" ? "module_and_final" : raw.certificateMode === "final_only" ? "final_only" : "none",
    modules,
  };
}
