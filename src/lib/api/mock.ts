/**
 * In-memory mock of the backend. State is mutable for the lifetime of the browser tab so every
 * interaction (suspend, assign seat, place order, publish version…) visibly works. The rules
 * mirror the real API: last-admin protection, seat capacity, one seat per member, CSV row validation.
 *
 * To connect the real backend: implement the same `Api` shape against fetch() (see client.ts) and
 * switch NEXT_PUBLIC_API_MODE. Pages only ever import from "./index".
 */
import { DEMO_NOW, daysFromNow, sleep } from "@/lib/utils";
import {
  ACTIVITY,
  AGENCIES,
  CATALOG,
  CERTIFICATES,
  HEALTH,
  INVITATIONS,
  KPIS,
  MEMBERS,
  METRO,
  NOTIFICATIONS,
  ORDERS,
  PERSONAS,
  QUIZ,
  STORE_PRODUCTS,
  VERIFY_REGISTRY,
  buildCourse,
  buildLearnCourse,
} from "./fixtures";
import type {
  ActivityItem,
  AgencySummary,
  ApiError,
  BulkInviteResult,
  BulkInviteRowError,
  Certificate,
  CatalogProduct,
  Course,
  CourseVersion,
  Entitlement,
  EntitlementStatus,
  HealthSnapshot,
  Invitation,
  LearnCourse,
  LessonVersion,
  MemberRow,
  MembershipStatus,
  NotificationItem,
  Order,
  Page,
  PlaceOrderInput,
  PlatformKpis,
  Price,
  QuizQuestion,
  RoleCode,
  Seat,
  SessionUser,
  StoreProduct,
} from "./types";

import { ApiClientError } from "./error";

export { ApiClientError };

const fail = (code: ApiError["code"], message: string): never => {
  throw new ApiClientError(code, message);
};

const delay = (ms = 280) => sleep(ms + Math.round(Math.random() * 160));
const clone = <T,>(v: T): T => structuredClone(v);

// ---- State ----------------------------------------------------------------------------------------------

interface SeatRecord {
  assignmentId: string;
  entitlementId: string;
  slotNo: number;
  membershipId: string;
  assignedAt: string;
}

const state = {
  members: clone(MEMBERS),
  invitations: clone(INVITATIONS),
  orders: clone(ORDERS),
  agencies: clone(AGENCIES),
  catalog: clone(CATALOG),
  course: buildCourse(),
  entitlements: [
    { id: "9001", productName: "DBE / ACDBE Certification Program", status: "active", seatCapacity: 25, seatsUsed: 0, validFrom: daysFromNow(-226), validUntil: daysFromNow(139) },
    { id: "9002", productName: "Module 6 · Contract Goals & Good Faith Efforts", status: "active", seatCapacity: 10, seatsUsed: 0, validFrom: daysFromNow(-344), validUntil: daysFromNow(21) },
    { id: "9003", productName: "Module 9 · ACDBE Airport Concessions", status: "expired", seatCapacity: 4, seatsUsed: 0, validFrom: daysFromNow(-420), validUntil: daysFromNow(-55) },
  ] as Entitlement[],
  seats: [] as SeatRecord[],
  seq: 5000,
};

(function seedSeats() {
  const learners = state.members.filter((m) => m.membershipStatus === "active" && m.roles.includes("learner"));
  learners.slice(0, 18).forEach((m, i) => state.seats.push({ assignmentId: String(7000 + i), entitlementId: "9001", slotNo: i + 1, membershipId: m.membershipId, assignedAt: daysFromNow(-150 + i * 3) }));
  learners.slice(2, 6).forEach((m, i) => state.seats.push({ assignmentId: String(7100 + i), entitlementId: "9002", slotNo: i + 1, membershipId: m.membershipId, assignedAt: daysFromNow(-120 + i * 4) }));
})();

const nextId = () => String(++state.seq);

function refreshSeatCounts() {
  for (const e of state.entitlements) e.seatsUsed = state.seats.filter((s) => s.entitlementId === e.id).length;
}
refreshSeatCounts();

const isActiveAdmin = (m: MemberRow) => m.membershipStatus === "active" && m.roles.includes("agency_admin");
const findMember = (id: string) => state.members.find((m) => m.membershipId === id) ?? fail("not_found", "Member not found");
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

// Signed-in identity for permission-sensitive rules (set by the auth layer after login).
let currentUser: SessionUser | null = null;
export function setMockIdentity(user: SessionUser | null) {
  currentUser = user;
}

// ---- API -----------------------------------------------------------------------------------------------

export interface MemberQuery {
  status?: MembershipStatus | "all";
  search?: string;
  limit?: number;
  offset?: number;
}

export const mockApi = {
  auth: {
    async login(email: string, password: string): Promise<SessionUser> {
      await delay(450);
      if (!password) fail("validation_failed", "Enter your password");
      const user = Object.values(PERSONAS).find((p) => p.email === email.trim().toLowerCase());
      if (!user) return fail("unauthenticated", "Invalid email or password");
      return clone(user);
    },
    async logout(): Promise<void> {
      await delay(200);
      currentUser = null;
    },
    async requestReset(email: string): Promise<void> {
      await delay(500);
      void email;
    },
    async confirmReset(token: string, password: string): Promise<void> {
      await delay(500);
      if (token.length < 10) fail("bad_request", "This reset link is invalid or has expired");
      if (password.length < 12) fail("validation_failed", "Password must be at least 12 characters");
    },
    async acceptInvitation(
      token: string,
      account: { firstName: string; lastName: string; password: string },
    ): Promise<{ signedIn: boolean }> {
      await delay(600);
      if (token.length < 10) fail("not_found", "Invitation is invalid or has already been used");
      if (account.password.length < 12) fail("validation_failed", "Password must be at least 12 characters");
      return { signedIn: true };
    },
  },

  members: {
    async list(q: MemberQuery = {}): Promise<Page<MemberRow>> {
      await delay();
      const limit = q.limit ?? 10;
      const offset = q.offset ?? 0;
      const needle = (q.search ?? "").trim().toLowerCase();
      const rows = state.members.filter((m) => {
        if (q.status && q.status !== "all" && m.membershipStatus !== q.status) return false;
        if (!needle) return true;
        return `${m.user.firstName} ${m.user.lastName} ${m.user.email} ${m.employeeReference ?? ""}`.toLowerCase().includes(needle);
      });
      return clone({ items: rows.slice(offset, offset + limit), total: rows.length, limit, offset });
    },
    async all(): Promise<MemberRow[]> {
      await delay(150);
      return clone(state.members.filter((m) => m.membershipStatus === "active"));
    },
    async setStatus(membershipId: string, action: "suspend" | "reactivate" | "remove"): Promise<void> {
      await delay(420);
      const m = findMember(membershipId);
      if (currentUser && m.user.email === currentUser.email) fail("forbidden", "You cannot change your own membership");
      if (action === "reactivate") {
        if (m.membershipStatus !== "suspended") fail("conflict", "Only suspended members can be reactivated");
        m.membershipStatus = "active";
        return;
      }
      if (action === "suspend" && m.membershipStatus !== "active") fail("conflict", "Only active members can be suspended");
      if (action === "remove" && m.membershipStatus === "left") fail("conflict", "Member has already been removed");
      if (isActiveAdmin(m) && state.members.filter(isActiveAdmin).length <= 1) {
        fail("conflict", "Cannot suspend, remove, or demote the agency's last active admin");
      }
      m.membershipStatus = action === "suspend" ? "suspended" : "left";
      // Seats held by the member are freed immediately (same rule as the backend).
      state.seats = state.seats.filter((s) => s.membershipId !== membershipId);
      if (action === "remove") m.roles = [];
      refreshSeatCounts();
    },
    async setEmployeeReference(membershipId: string, value: string | null): Promise<void> {
      await delay(300);
      findMember(membershipId).employeeReference = value?.trim() || null;
    },
    async setRole(membershipId: string, role: "agency_admin" | "learner"): Promise<void> {
      await delay(400);
      const m = findMember(membershipId);
      if (m.membershipStatus !== "active") fail("conflict", "Only active members can have roles changed");
      if (role === "learner" && isActiveAdmin(m) && state.members.filter(isActiveAdmin).length <= 1) {
        fail("conflict", "Cannot suspend, remove, or demote the agency's last active admin");
      }
      m.roles = [role];
    },
  },

  invitations: {
    async list(): Promise<Invitation[]> {
      await delay(200);
      return clone(state.invitations);
    },
    async invite(email: string, roleCode: "learner" | "agency_admin"): Promise<void> {
      await delay(450);
      const e = email.trim().toLowerCase();
      if (!emailOk(e)) fail("validation_failed", "Enter a valid email address");
      if (roleCode === "agency_admin" && currentUser?.role === "agency_admin") fail("forbidden", "Only platform staff can invite agency administrators");
      if (state.members.some((m) => m.user.email === e && m.membershipStatus !== "left")) fail("conflict", "That person is already a member of this agency");
      if (state.invitations.some((i) => i.emailNormalized === e && i.roleCode === roleCode)) fail("conflict", "A pending invitation already exists for this email and role");
      state.invitations.unshift({ id: nextId(), emailNormalized: e, roleCode, expiresAt: daysFromNow(3), status: "pending" });
    },
    async revoke(id: string): Promise<void> {
      await delay(300);
      const before = state.invitations.length;
      state.invitations = state.invitations.filter((i) => i.id !== id);
      if (state.invitations.length === before) fail("not_found", "No pending invitation found to revoke");
    },
    /** Same row rules as POST /invitations/bulk. `csv` is parsed already into rows by the caller. */
    async bulk(rows: { email: string; role: string }[], canInviteAdmins: boolean): Promise<BulkInviteResult> {
      await delay(900);
      const errors: BulkInviteRowError[] = [];
      const seen = new Set<string>();
      let invited = 0;
      rows.forEach((r, idx) => {
        const row = idx + 2;
        const email = r.email.trim().toLowerCase();
        const role = (r.role.trim().toLowerCase() || "learner") as "learner" | "agency_admin";
        const bad = (message: string) => errors.push({ row, email: r.email.slice(0, 120), message });
        if (!emailOk(email)) return bad("Invalid email address");
        if (role !== "learner" && role !== "agency_admin") return bad(`Unknown role "${r.role.slice(0, 40)}"`);
        if (role === "agency_admin" && !canInviteAdmins) return bad("Only platform staff can invite agency administrators");
        if (seen.has(`${email}:${role}`)) return bad("Duplicate of an earlier row in this file");
        seen.add(`${email}:${role}`);
        if (state.members.some((m) => m.user.email === email && m.membershipStatus !== "left")) return bad("Already a member of this agency");
        if (state.invitations.some((i) => i.emailNormalized === email && i.roleCode === role)) return bad("A pending invitation already exists for this email and role");
        state.invitations.unshift({ id: nextId(), emailNormalized: email, roleCode: role, expiresAt: daysFromNow(3), status: "pending" });
        invited += 1;
      });
      return { totalRows: rows.length, invited, failed: errors.length, errors };
    },
    /** The mock adapter processes bulk imports synchronously, so there is no job to poll. */
    async bulkJob(_importJobId: string): Promise<BulkInviteResult> {
      await delay(200);
      return { totalRows: 0, invited: 0, failed: 0, errors: [], status: "completed" };
    },
  },

  seats: {
    async entitlements(): Promise<Entitlement[]> {
      await delay(220);
      refreshSeatCounts();
      return clone(state.entitlements);
    },
    async list(entitlementId: string): Promise<Seat[]> {
      await delay(220);
      const ent = state.entitlements.find((e) => e.id === entitlementId) ?? fail("not_found", "Entitlement not found");
      const seats: Seat[] = [];
      for (let slot = 1; slot <= ent.seatCapacity; slot += 1) {
        const rec = state.seats.find((s) => s.entitlementId === entitlementId && s.slotNo === slot);
        const m = rec ? state.members.find((x) => x.membershipId === rec.membershipId) : undefined;
        seats.push({
          assignmentId: rec?.assignmentId ?? null,
          slotNo: slot,
          membershipId: rec?.membershipId ?? null,
          member: m ? { email: m.user.email, firstName: m.user.firstName, lastName: m.user.lastName } : null,
          assignedAt: rec?.assignedAt ?? null,
        });
      }
      return seats;
    },
    async assign(entitlementId: string, membershipId: string): Promise<void> {
      await delay(420);
      const ent = state.entitlements.find((e) => e.id === entitlementId) ?? fail("not_found", "Entitlement not found");
      if (ent.status !== "active") fail("conflict", "Seats can only be assigned on an active entitlement");
      const member = findMember(membershipId);
      if (member.membershipStatus !== "active") fail("conflict", "Only active members can hold a seat");
      if (state.seats.some((s) => s.entitlementId === entitlementId && s.membershipId === membershipId)) fail("conflict", "That member already holds a seat on this entitlement");
      const used = new Set(state.seats.filter((s) => s.entitlementId === entitlementId).map((s) => s.slotNo));
      let slot = 1;
      while (used.has(slot) && slot <= ent.seatCapacity) slot += 1;
      if (slot > ent.seatCapacity) fail("conflict", "All seats on this entitlement are already assigned");
      state.seats.push({ assignmentId: nextId(), entitlementId, slotNo: slot, membershipId, assignedAt: DEMO_NOW.toISOString() });
      refreshSeatCounts();
    },
    async release(entitlementId: string, assignmentId: string): Promise<void> {
      await delay(360);
      const before = state.seats.length;
      state.seats = state.seats.filter((s) => !(s.entitlementId === entitlementId && s.assignmentId === assignmentId));
      if (before === state.seats.length) fail("not_found", "No active seat assignment found");
      refreshSeatCounts();
    },
    async reassign(entitlementId: string, assignmentId: string, toMembershipId: string): Promise<void> {
      await delay(460);
      const rec = state.seats.find((s) => s.entitlementId === entitlementId && s.assignmentId === assignmentId) ?? fail("not_found", "No active seat assignment found");
      if (rec.membershipId === toMembershipId) fail("conflict", "That member already holds this seat");
      const target = findMember(toMembershipId);
      if (target.membershipStatus !== "active") fail("conflict", "Only active members can hold a seat");
      if (state.seats.some((s) => s.entitlementId === entitlementId && s.membershipId === toMembershipId)) fail("conflict", "That member already holds a seat on this entitlement");
      rec.membershipId = toMembershipId;
      rec.assignmentId = nextId();
      rec.assignedAt = DEMO_NOW.toISOString();
    },
  },

  store: {
    async products(): Promise<StoreProduct[]> {
      await delay(220);
      return clone(STORE_PRODUCTS);
    },
    async placeOrder(input: PlaceOrderInput): Promise<{ order: Order; checkoutUrl: string | null }> {
      await delay(800);
      const product = STORE_PRODUCTS.find((p) => p.prices.some((pr) => pr.id === input.priceId)) ?? fail("not_found", "Price not found");
      const price = product.prices.find((pr) => pr.id === input.priceId) as Price;
      if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000) fail("validation_failed", "Quantity must be between 1 and 1000");
      if (input.paymentMethod === "card" && input.purchaseOrderNumber) fail("validation_failed", "A purchase order number only applies to invoice payment");
      const total = price.unitAmountMinor * input.quantity;
      const order: Order = {
        publicId: `ord-${nextId()}`,
        status: "pending",
        paymentMethod: input.paymentMethod,
        currency: "USD",
        subtotalMinor: total,
        taxMinor: 0,
        totalMinor: total,
        purchaseOrderNumber: input.paymentMethod === "invoice" ? input.purchaseOrderNumber?.trim() || null : null,
        paidAt: null,
        createdAt: DEMO_NOW.toISOString(),
        item: { productName: product.name, quantity: input.quantity, unitAmountMinor: price.unitAmountMinor, lineTotalMinor: total, billingPeriod: price.billingPeriod },
      };
      state.orders.unshift(order);
      return { order: clone(order), checkoutUrl: input.paymentMethod === "card" ? "/billing/success?session_id=cs_test_demo" : null };
    },
    /** Demo only: pretend Stripe's webhook arrived. */
    async markPaid(orderId: string): Promise<void> {
      await delay(200);
      const order = state.orders.find((o) => o.publicId === orderId);
      if (!order || order.status === "paid") return;
      order.status = "paid";
      order.paidAt = DEMO_NOW.toISOString();
      const item = order.item;
      if (item) state.entitlements.unshift({ id: nextId(), productName: item.productName, status: "active", seatCapacity: item.quantity, seatsUsed: 0, validFrom: DEMO_NOW.toISOString(), validUntil: daysFromNow(item.billingPeriod === "annual" ? 365 : 30) });
    },
    async orders(q: { limit?: number; offset?: number } = {}): Promise<Page<Order>> {
      await delay(240);
      const limit = q.limit ?? 10;
      const offset = q.offset ?? 0;
      return clone({ items: state.orders.slice(offset, offset + limit), total: state.orders.length, limit, offset });
    },
    async billingPortal(): Promise<{ url: string }> {
      await delay(500);
      return { url: "#stripe-billing-portal" };
    },
  },

  platform: {
    async kpis(): Promise<PlatformKpis> {
      await delay(300);
      return clone(KPIS);
    },
    async health(): Promise<HealthSnapshot> {
      await delay(250);
      return clone(HEALTH);
    },
    async agencies(q: { search?: string; status?: string; limit?: number; offset?: number } = {}): Promise<Page<AgencySummary>> {
      await delay();
      const limit = q.limit ?? 8;
      const offset = q.offset ?? 0;
      const needle = (q.search ?? "").trim().toLowerCase();
      const rows = state.agencies.filter((a) => (!q.status || q.status === "all" || a.status === q.status) && (!needle || `${a.displayName} ${a.state} ${a.slug}`.toLowerCase().includes(needle)));
      return clone({ items: rows.slice(offset, offset + limit), total: rows.length, limit, offset });
    },
    async agency(publicId: string): Promise<AgencySummary> {
      await delay(220);
      return clone(state.agencies.find((a) => a.publicId === publicId) ?? fail("not_found", "Agency not found"));
    },
    async createAgency(input: { legalName: string; displayName: string; slug: string; billingEmail: string }): Promise<AgencySummary> {
      await delay(700);
      if (!emailOk(input.billingEmail.trim().toLowerCase())) fail("validation_failed", "Enter a valid billing email address");
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug)) fail("validation_failed", "Slug must be lowercase alphanumeric with single hyphens");
      if (state.agencies.some((a) => a.slug === input.slug)) fail("conflict", "An agency with this name or slug already exists");
      const created: AgencySummary = { publicId: `ag-${nextId()}`, slug: input.slug, displayName: input.displayName, legalName: input.legalName, status: "active", billingEmail: input.billingEmail ?? null, memberCount: 0, seatsUsed: 0, seatCapacity: 0, createdAt: DEMO_NOW.toISOString(), state: "—" };
      state.agencies.unshift(created);
      return clone(created);
    },
    /** Platform staff invite an agency's first administrator; the person finishes sign-up from the emailed link. */
    async inviteAgencyAdmin(agencyPublicId: string, email: string): Promise<void> {
      await delay(450);
      const e = email.trim().toLowerCase();
      if (!emailOk(e)) fail("validation_failed", "Enter a valid email address");
      if (!state.agencies.some((a) => a.publicId === agencyPublicId)) fail("not_found", "Agency not found");
    },
    async setAgencyStatus(publicId: string, status: "active" | "suspended"): Promise<void> {
      await delay(450);
      const agency = state.agencies.find((a) => a.publicId === publicId) ?? fail("not_found", "Agency not found");
      if (agency.status === "closed") fail("conflict", "Closed agencies cannot be reopened here");
      agency.status = status;
    },
    async allOrders(q: { limit?: number; offset?: number; status?: string } = {}): Promise<Page<Order>> {
      await delay(260);
      const limit = q.limit ?? 10;
      const offset = q.offset ?? 0;
      const names = state.agencies.map((a) => a.displayName);
      const rows = [...state.orders, ...ORDERS.map((o, i) => ({ ...o, publicId: `${o.publicId}-x${i}` }))]
        .map((o, i) => ({ ...o, agencyName: names[i % names.length] }))
        .filter((o) => !q.status || q.status === "all" || o.status === q.status);
      return clone({ items: rows.slice(offset, offset + limit), total: rows.length, limit, offset });
    },
    async entitlementStatus(entitlementId: string, action: "suspend" | "reactivate" | "revoke", note: string): Promise<void> {
      await delay(500);
      if (note.trim().length < 3) fail("validation_failed", "Add a note of at least 3 characters");
      const ent = state.entitlements.find((e) => e.id === entitlementId) ?? fail("not_found", "Entitlement not found");
      const to: EntitlementStatus = action === "suspend" ? "suspended" : action === "reactivate" ? "active" : "revoked";
      if (ent.status === "revoked" || ent.status === "expired") fail("conflict", "invalid entitlement status transition");
      if (action === "reactivate" && ent.status !== "suspended") fail("conflict", "invalid entitlement status transition");
      ent.status = to;
      if (to === "revoked") {
        state.seats = state.seats.filter((s) => s.entitlementId !== entitlementId);
        refreshSeatCounts();
      }
    },
  },

  catalog: {
    async products(status?: string): Promise<CatalogProduct[]> {
      await delay(260);
      return clone(state.catalog.filter((p) => !status || status === "all" || p.status === status));
    },
    async createProduct(input: { code: string; name: string; productType: "program" | "module" }): Promise<CatalogProduct> {
      await delay(500);
      if (state.catalog.some((p) => p.code === input.code)) fail("conflict", "A record with these details already exists");
      const product: CatalogProduct = { publicId: `prod-${nextId()}`, code: input.code, name: input.name, productType: input.productType, status: "draft", content: null, prices: [] };
      state.catalog.unshift(product);
      return clone(product);
    },
    async attachContent(publicId: string, kind: "course" | "module", title: string): Promise<void> {
      await delay(400);
      const p = state.catalog.find((x) => x.publicId === publicId) ?? fail("not_found", "Product not found");
      if (p.status !== "draft") fail("conflict", "product content can only be attached while the product is draft");
      if ((p.productType === "program") !== (kind === "course")) fail("conflict", "product type and content target do not match");
      p.content = { kind, title };
    },
    async setStatus(publicId: string, action: "activate" | "retire"): Promise<void> {
      await delay(420);
      const p = state.catalog.find((x) => x.publicId === publicId) ?? fail("not_found", "Product not found");
      if (action === "activate") {
        if (p.status !== "draft") fail("conflict", "invalid product status transition");
        if (!p.content) fail("conflict", "product requires a content target before activation");
        p.status = "active";
      } else {
        if (p.status !== "active") fail("conflict", "invalid product status transition");
        p.status = "retired";
      }
    },
    async addPrice(publicId: string, billingPeriod: "annual" | "monthly", unitAmountMinor: number): Promise<void> {
      await delay(560);
      const p = state.catalog.find((x) => x.publicId === publicId) ?? fail("not_found", "Product not found");
      if (p.status === "retired") fail("conflict", "Retired products cannot be priced");
      if (!Number.isInteger(unitAmountMinor) || unitAmountMinor < 50 || unitAmountMinor > 10_000_000) fail("validation_failed", "Price must be between $0.50 and $100,000");
      // Replace the active price for the period without overlap (same as the backend).
      p.prices = p.prices.map((pr) => (pr.billingPeriod === billingPeriod && pr.isActive ? { ...pr, isActive: false, activeUntil: DEMO_NOW.toISOString() } : pr));
      p.prices.push({ id: nextId(), billingPeriod, currency: "USD", unitAmountMinor, activeFrom: DEMO_NOW.toISOString(), activeUntil: null, isActive: true });
    },
    async course(): Promise<Course> {
      await delay(260);
      return clone(state.course);
    },
    async publishVersion(versionId: string): Promise<void> {
      await delay(600);
      const v = state.course.versions.find((x) => x.id === versionId) ?? fail("not_found", "Version not found");
      if (v.status === "published") fail("conflict", "This version is already published");
      if (v.modules.some((m) => m.status !== "published")) fail("conflict", "course publication requires published modules and published_at");
      v.status = "published";
      v.publishedAt = DEMO_NOW.toISOString();
    },
    async publishModule(versionId: string, moduleId: string): Promise<void> {
      await delay(420);
      const v = state.course.versions.find((x) => x.id === versionId) ?? fail("not_found", "Version not found");
      if (v.status === "published") fail("conflict", "published course composition is immutable");
      const m = v.modules.find((x) => x.id === moduleId) ?? fail("not_found", "Module version not found");
      if (m.lessons.some((l) => l.status !== "published")) fail("conflict", "module publication requires published lessons and published_at");
      m.status = "published";
    },
    async saveLesson(versionId: string, moduleId: string, lesson: LessonVersion): Promise<void> {
      await delay(480);
      const v = state.course.versions.find((x) => x.id === versionId) ?? fail("not_found", "Version not found");
      if (v.status === "published") fail("conflict", "published lesson versions are immutable");
      if (lesson.lessonType === "video" && !lesson.videoAssetId) fail("validation_failed", "Video lessons require a video id");
      if (lesson.completionRule === "video_percent" && (lesson.lessonType !== "video" || !lesson.completionThreshold)) fail("validation_failed", "video_percent completion needs a video lesson and a threshold");
      const m = v.modules.find((x) => x.id === moduleId) ?? fail("not_found", "Module version not found");
      const idx = m.lessons.findIndex((l) => l.id === lesson.id);
      if (idx >= 0) m.lessons[idx] = { ...lesson, status: "draft" };
      m.status = "draft";
    },
    async newVersion(): Promise<CourseVersion> {
      await delay(500);
      const latest = state.course.versions[0] as CourseVersion;
      const created: CourseVersion = { ...clone(latest), id: `cv-${nextId()}`, versionNo: latest.versionNo + 1, title: `Edition ${latest.versionNo + 1} (draft)`, status: "draft", publishedAt: null };
      created.modules = created.modules.map((m) => ({ ...m, status: "published" }));
      state.course.versions.unshift(created);
      return clone(created);
    },
  },

  learner: {
    async course(): Promise<LearnCourse> {
      await delay(300);
      return buildLearnCourse();
    },
    async quiz(): Promise<QuizQuestion[]> {
      await delay(320);
      return clone(QUIZ);
    },
    async certificates(): Promise<Certificate[]> {
      await delay(260);
      return clone(CERTIFICATES);
    },
    async verify(number: string): Promise<Certificate | null> {
      await delay(700);
      return clone(VERIFY_REGISTRY[number.trim().toUpperCase()] ?? null);
    },
  },

  feeds: {
    async activity(): Promise<ActivityItem[]> {
      await delay(200);
      return clone(ACTIVITY);
    },
    async notifications(): Promise<NotificationItem[]> {
      await delay(150);
      return clone(NOTIFICATIONS);
    },
  },

  /** Metro Transit's identity, used by agency-scoped demo screens. */
  agency: METRO,
  roles: ["super_admin", "training_manager", "agency_admin", "learner"] as RoleCode[],
};

export type Api = typeof mockApi;
