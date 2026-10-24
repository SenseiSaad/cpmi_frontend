/**
 * API contract types. Shapes (names, casing, numeric-id-as-string) mirror the real backend
 * responses documented in /AGENTS.md and backend/README.md, so a live adapter can replace the
 * mock adapter without touching any page. Types marked PREVIEW describe features whose backend
 * slice is not built yet (enrollment/progress, assessments, certificates, reporting).
 */

export type RoleCode = "super_admin" | "training_manager" | "agency_admin" | "learner";

export interface AgencyRef {
  publicId: string;
  displayName: string;
  slug: string;
}

/** What GET /auth/me should return (the backend currently omits the agency name/public id: gap). */
export interface SessionUser {
  userPublicId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
  title: string;
  agency: AgencyRef | null;
}

export type MembershipStatus = "invited" | "active" | "suspended" | "left";

export interface MemberRow {
  membershipId: string;
  membershipStatus: MembershipStatus;
  employeeReference: string | null;
  joinedAt: string | null;
  user: { publicId: string; email: string; firstName: string; lastName: string; status: string };
  roles: RoleCode[];
  /** PREVIEW: learner progress is not in the API yet. */
  progress: number;
  lastActiveAt: string | null;
}

export interface Invitation {
  id: string;
  emailNormalized: string;
  roleCode: "learner" | "agency_admin";
  expiresAt: string;
  status: "pending";
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type EntitlementStatus = "pending" | "active" | "suspended" | "expired" | "revoked";

export interface Entitlement {
  id: string;
  productName: string;
  status: EntitlementStatus;
  seatCapacity: number;
  seatsUsed: number;
  validFrom: string;
  validUntil: string;
}

export interface Seat {
  assignmentId: string | null;
  slotNo: number;
  membershipId: string | null;
  member: { email: string; firstName: string; lastName: string } | null;
  assignedAt: string | null;
}

export interface Price {
  id: string;
  billingPeriod: "annual" | "monthly";
  currency: string;
  unitAmountMinor: number;
  activeFrom: string;
  activeUntil: string | null;
  isActive: boolean;
}

export interface StoreProduct {
  publicId: string;
  code: string;
  name: string;
  productType: "program" | "module";
  description: string;
  highlights: string[];
  prices: Price[];
}

export type OrderStatus = "draft" | "pending" | "paid" | "void" | "refunded" | "partially_refunded";

export interface Order {
  publicId: string;
  status: OrderStatus;
  paymentMethod: "card" | "invoice";
  currency: string;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  purchaseOrderNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  item: { productName: string; quantity: number; unitAmountMinor: number; lineTotalMinor: number; billingPeriod: string } | null;
  /** Platform views only. */
  agencyName?: string;
}

export interface PlaceOrderInput {
  priceId: string;
  quantity: number;
  paymentMethod: "card" | "invoice";
  purchaseOrderNumber?: string;
}

export type AgencyStatus = "pending" | "active" | "suspended" | "closed";

export interface AgencySummary {
  publicId: string;
  slug: string;
  displayName: string;
  legalName: string;
  status: AgencyStatus;
  billingEmail: string | null;
  memberCount: number;
  seatsUsed: number;
  seatCapacity: number;
  createdAt: string;
  state: string;
}

export type ProductStatus = "draft" | "active" | "retired";

export interface CatalogProduct {
  publicId: string;
  code: string;
  name: string;
  productType: "program" | "module";
  status: ProductStatus;
  content: { kind: "course" | "module"; title: string; refId?: string } | null;
  prices: Price[];
}

export type VersionStatus = "draft" | "published";
export type LessonType = "video" | "reading" | "resource";

export interface LessonVersion {
  id: string;
  code: string;
  title: string;
  lessonType: LessonType;
  status: VersionStatus;
  durationSeconds: number | null;
  isRequired: boolean;
  completionRule: "open" | "manual" | "video_percent";
  completionThreshold: number | null;
  videoAssetId: string | null;
  bodyHtml: string;
}

export interface ModuleVersion {
  id: string;
  code: string;
  title: string;
  description: string;
  status: VersionStatus;
  lessons: LessonVersion[];
}

export interface CourseVersion {
  id: string;
  versionNo: number;
  title: string;
  status: VersionStatus;
  publishedAt: string | null;
  navigationMode: "sequential" | "free";
  certificateMode: "none" | "final_only" | "module_and_final";
  modules: ModuleVersion[];
}

export interface Course {
  publicId: string;
  code: string;
  title: string;
  versions: CourseVersion[];
}

// ---- PREVIEW: learner experience (backend slices 6-8 not built) -------------------------------

export type LessonState = "done" | "current" | "todo" | "locked";

export interface LearnLesson {
  id: string;
  title: string;
  type: LessonType;
  minutes: number;
  state: LessonState;
}

export interface LearnModule {
  id: string;
  number: number;
  title: string;
  summary: string;
  lessons: LearnLesson[];
  quiz: { id: string; title: string; questions: number; passingScore: number; best: number | null; attemptsUsed: number; maxAttempts: number } | null;
}

export interface LearnCourse {
  id: string;
  title: string;
  description: string;
  progress: number;
  validUntil: string;
  modules: LearnModule[];
}

export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "matching";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: { id: string; text: string }[];
  pairs?: { left: string; rightOptions: string[]; correct: string }[];
  correct?: string[];
  explanation: string;
}

export interface Certificate {
  id: string;
  number: string;
  title: string;
  kind: "module" | "final";
  holder: string;
  issuedAt: string;
  expiresAt: string | null;
  status: "valid" | "revoked" | "expired";
  agency: string;
}

export interface ActivityItem {
  id: string;
  at: string;
  text: string;
  tone: "ok" | "info" | "warn" | "bad";
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  at: string;
  unread: boolean;
}

export interface PlatformKpis {
  revenueMinor: number;
  revenueDeltaPct: number;
  agencies: number;
  activeLearners: number;
  completionRate: number;
  passRate: number;
  revenueSeries: { label: string; value: number }[];
  moduleCompletion: { label: string; value: number }[];
  passFail: { pass: number; fail: number };
}

export interface HealthSnapshot {
  integrityChecks: { total: number; failed: number };
  auditQueue: { pending: number; oldestMinutes: number; deadLettered: number };
  webhooks: { processed24h: number; failed: number; stuck: number };
  email: { sent24h: number; pending: number; failed: number };
  workers: { name: string; lastRunSeconds: number; ok: boolean }[];
}

export interface BulkInviteRowError {
  row: number;
  email: string;
  message: string;
}

export interface BulkInviteResult {
  totalRows: number;
  invited: number;
  failed: number;
  errors: BulkInviteRowError[];
  /** Real backend processes CSV uploads asynchronously; these track the job. */
  status?: string;
  importJobId?: string;
}

export interface ApiError {
  code: "bad_request" | "validation_failed" | "unauthenticated" | "forbidden" | "not_found" | "conflict" | "rate_limited" | "unavailable" | "internal";
  message: string;
}
