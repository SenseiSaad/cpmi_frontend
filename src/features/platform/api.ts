import { api } from "@/lib/api/client";
import type { ListQuery, Paginated } from "@/lib/api/types";

/**
 * Platform administration API — verified against the real backend
 * (`/api/platform/*`, Super Admin / Training Manager only).
 */

export interface PlatformAgency {
  uuid: string;
  slug?: string;
  name: string;
  status: string;
  member_count?: number;
  seats_used?: number;
  created_at?: string;
}

export interface PlatformCourse {
  uuid: string;
  slug?: string;
  title: string;
  status: string;
  current_version?: number | string | null;
  updated_at?: string;
}

export interface CourseVersion {
  uuid: string;
  version_label: string;
  status: string;
  created_at?: string;
  modules?: { uuid: string; title: string; lessons?: { uuid: string; title: string }[] }[];
}

export interface PlatformProduct {
  uuid: string;
  slug?: string;
  name: string;
  description?: string | null;
  price_cents?: number | null;
  status: string;
}

export interface PlatformEntitlement {
  uuid: string;
  agency?: { uuid?: string; name: string };
  product?: { uuid?: string; name: string };
  seats_granted: number;
  seats_used?: number;
  status: string;
}

export interface PlatformStats {
  agencies_total?: number;
  agencies_active?: number;
  courses_published?: number;
  products_total?: number;
  enrollments_total?: number;
  revenue_cents?: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  actorType: string;
  subjectType: string;
  subjectPublicId?: string | null;
  agency?: { uuid: string; name: string } | null;
  occurredAt: string;
  metadata?: unknown;
}

export interface PlatformReportOverview {
  revenue_cents: number;
  paid_orders: number;
  agencies: { total: number; active: number };
  entitlements: { active: number; seats_sold: number };
  enrollments: { total: number; completed: number; completion_percent: number | null };
  assessments: { graded: number; passed: number; pass_rate_percent: number | null };
  certificates: { issued: number; revoked: number };
}

export interface CourseCompletion {
  courseTitle: string;
  enrollments: number;
  completed: number;
  completionPercent: number | null;
}

export interface AssessmentPassRate {
  /** Unique per row; titles repeat across assessments (e.g. several "Final" exams). */
  assessmentVersionId: string;
  assessmentTitle: string;
  kind: string;
  attempts: number;
  graded: number;
  passed: number;
  passRatePercent: number | null;
  averageScorePercent: number | null;
}

type ListQueryWithQ = ListQuery & { q?: string };

function toListQuery(query: ListQueryWithQ): Record<string, string | number | undefined> {
  return {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 25,
    search: query.q ?? query.search
  };
}

export const platformApi = {
  stats(): Promise<PlatformStats> {
    return api.get("/api/platform/stats");
  },
  async reportsOverview(): Promise<PlatformReportOverview> {
    const raw = await api.get<{
      revenueCents: number;
      paidOrders: number;
      agencies: { total: number; active: number };
      entitlements: { active: number; seatsSold: number };
      enrollments: { total: number; completed: number; completionPercent: number | null };
      assessments: { graded: number; passed: number; passRatePercent: number | null };
      certificates: { issued: number; revoked: number };
    }>("/api/platform/reports/overview");
    return {
      revenue_cents: raw.revenueCents,
      paid_orders: raw.paidOrders,
      agencies: raw.agencies,
      entitlements: { active: raw.entitlements.active, seats_sold: raw.entitlements.seatsSold },
      enrollments: {
        total: raw.enrollments.total,
        completed: raw.enrollments.completed,
        completion_percent: raw.enrollments.completionPercent
      },
      assessments: {
        graded: raw.assessments.graded,
        passed: raw.assessments.passed,
        pass_rate_percent: raw.assessments.passRatePercent
      },
      certificates: raw.certificates
    };
  },
  async reportsCompletions(): Promise<{ items: CourseCompletion[] }> {
    return api.get("/api/platform/reports/completions");
  },
  async reportsAssessments(): Promise<{ items: AssessmentPassRate[] }> {
    return api.get("/api/platform/reports/assessments");
  },
  agencies(query: ListQueryWithQ): Promise<Paginated<PlatformAgency>> {
    return api.get("/api/platform/agencies", { query: toListQuery(query) });
  },
  agency(agencyUuid: string): Promise<PlatformAgency> {
    return api.get(`/api/platform/agencies/${agencyUuid}`);
  },
  setAgencyStatus(agencyUuid: string, status: string): Promise<void> {
    return api.patch(`/api/platform/agencies/${agencyUuid}`, { status });
  },
  courses(query: ListQueryWithQ): Promise<Paginated<PlatformCourse>> {
    return api.get("/api/platform/courses", { query: toListQuery(query) });
  },
  versions(courseUuid: string): Promise<{ items?: CourseVersion[] }> {
    return api.get(`/api/platform/courses/${courseUuid}/versions`);
  },
  createVersion(courseUuid: string, payload: { version_label: string }): Promise<void> {
    return api.post(`/api/platform/courses/${courseUuid}/versions`, payload);
  },
  publishVersion(versionUuid: string): Promise<void> {
    return api.post(`/api/platform/course-versions/${versionUuid}/publish`);
  },
  products(query: ListQueryWithQ): Promise<Paginated<PlatformProduct>> {
    return api.get("/api/platform/products", { query: toListQuery(query) });
  },
  updateProduct(productUuid: string, payload: { price_cents?: number; status?: string }): Promise<void> {
    return api.patch(`/api/platform/products/${productUuid}`, payload);
  },
  entitlements(query: ListQueryWithQ): Promise<Paginated<PlatformEntitlement>> {
    return api.get("/api/platform/entitlements", { query: toListQuery(query) });
  },
  updateEntitlement(
    entitlementUuid: string,
    payload: { seats_granted?: number; status?: string }
  ): Promise<void> {
    return api.patch(`/api/platform/entitlements/${entitlementUuid}`, payload);
  },
  async auditLog(
    query: ListQueryWithQ & { agencyPublicId?: string; action?: string; from?: string; to?: string }
  ): Promise<Paginated<AuditEntry>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const raw = await api.get<{ items: AuditEntry[]; page: { total: number } }>("/api/platform/audit-log", {
      query: {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        action: query.action ?? query.q,
        agencyPublicId: query.agencyPublicId,
        from: query.from,
        to: query.to
      }
    });
    return {
      items: raw.items,
      total: raw.page.total,
      page,
      page_size: pageSize,
      pages: Math.max(1, Math.ceil(raw.page.total / pageSize))
    };
  },

  // ---- Agencies (provisioning + invitations) --------------------------------------
  createAgency(payload: {
    legalName: string;
    displayName: string;
    slug: string;
    billingEmail?: string;
  }): Promise<{ agency: { publicId: string; slug: string; displayName: string } }> {
    return api.post("/api/agencies", payload);
  },
  inviteAgencyMember(
    agencyPublicId: string,
    payload: { email: string; roleCode: "agency_admin" | "learner" }
  ): Promise<{ invitation: { email: string; roleCode: string; expiresAt: string } }> {
    return api.post(`/api/agencies/${agencyPublicId}/invitations`, payload);
  },
  agencyInvitations(
    agencyPublicId: string,
    status: "pending" | "revoked" | "accepted" | "expired" = "pending"
  ): Promise<{ invitations: AgencyInvitation[] }> {
    return api.get(`/api/agencies/${agencyPublicId}/invitations`, { query: { status } });
  },
  agencyOverview(agencyPublicId: string): Promise<AgencyOverview> {
    return api.get(`/api/agencies/${agencyPublicId}/overview`);
  },
  agencyOrders(
    agencyPublicId: string,
    query: { limit?: number; offset?: number } = {}
  ): Promise<{ orders: AgencyOrder[]; page: { total: number; limit: number; offset: number } }> {
    return api.get(`/api/agencies/${agencyPublicId}/orders`, {
      query: { limit: query.limit ?? 25, offset: query.offset ?? 0 }
    });
  },

  // ---- Reports / ops ---------------------------------------------------------------
  reportsRevenue(): Promise<{ months: MonthlyRevenue[] }> {
    return api.get("/api/platform/reports/revenue");
  },
  observability(): Promise<Observability> {
    return api.get("/api/platform/observability");
  },

  // ---- Catalog authoring: courses → versions → modules → lessons ------------------
  createCourse(payload: { code: string; title: string }): Promise<{ course: { publicId: string } }> {
    return api.post("/api/catalog/courses", payload);
  },
  catalogCourseVersions(coursePublicId: string): Promise<{ versions: CatalogCourseVersion[] }> {
    return api.get(`/api/catalog/courses/${coursePublicId}/versions`);
  },
  createCourseVersion(
    coursePublicId: string,
    payload: {
      title: string;
      description?: string;
      navigationMode?: "sequential" | "free";
      certificateMode?: "none" | "final_only" | "module_and_final";
    }
  ): Promise<{ version: CreatedVersion }> {
    return api.post(`/api/catalog/courses/${coursePublicId}/versions`, payload);
  },
  courseVersion(id: string): Promise<{ version: CourseVersionDetail }> {
    return api.get(`/api/catalog/course-versions/${id}`);
  },
  attachModule(
    courseVersionId: string,
    payload: { moduleVersionId: string; position: number; isRequired?: boolean }
  ): Promise<void> {
    return api.post(`/api/catalog/course-versions/${courseVersionId}/modules`, payload);
  },
  publishCourseVersion(id: string): Promise<void> {
    return api.post(`/api/catalog/course-versions/${id}/publish`);
  },
  createModule(payload: { code: string }): Promise<{ module: { publicId: string } }> {
    return api.post("/api/catalog/modules", payload);
  },
  moduleVersions(modulePublicId: string): Promise<{ versions: CatalogModuleVersion[] }> {
    return api.get(`/api/catalog/modules/${modulePublicId}/versions`);
  },
  createModuleVersion(
    modulePublicId: string,
    payload: { title: string; description?: string }
  ): Promise<{ version: CreatedVersion }> {
    return api.post(`/api/catalog/modules/${modulePublicId}/versions`, payload);
  },
  moduleVersion(id: string): Promise<{ version: ModuleVersionDetail }> {
    return api.get(`/api/catalog/module-versions/${id}`);
  },
  attachLesson(
    moduleVersionId: string,
    payload: { lessonVersionId: string; position: number; isRequired?: boolean }
  ): Promise<void> {
    return api.post(`/api/catalog/module-versions/${moduleVersionId}/lessons`, payload);
  },
  publishModuleVersion(id: string): Promise<void> {
    return api.post(`/api/catalog/module-versions/${id}/publish`);
  },
  createLesson(modulePublicId: string, payload: { code: string }): Promise<{ lesson: { publicId: string } }> {
    return api.post(`/api/catalog/modules/${modulePublicId}/lessons`, payload);
  },
  createLessonVersion(lessonPublicId: string, payload: LessonVersionInput): Promise<{ version: CreatedVersion }> {
    return api.post(`/api/catalog/lessons/${lessonPublicId}/versions`, payload);
  },
  publishLessonVersion(id: string): Promise<void> {
    return api.post(`/api/catalog/lesson-versions/${id}/publish`);
  },

  // ---- Assessment authoring -----------------------------------------------------------
  createAssessment(payload: {
    code: string;
    assessmentType: "module" | "final";
    modulePublicId?: string;
    coursePublicId?: string;
  }): Promise<{ assessment: { publicId: string } }> {
    return api.post("/api/catalog/assessments", payload);
  },
  createAssessmentVersion(
    assessmentPublicId: string,
    payload: {
      title: string;
      passingScore: number;
      maxAttempts?: number;
      scorePolicy?: "highest" | "latest";
      questionCount: number;
      shuffleQuestions?: boolean;
      shuffleAnswers?: boolean;
      feedbackMode?: "immediate" | "after_submit" | "after_pass";
    }
  ): Promise<{ version: CreatedVersion }> {
    return api.post(`/api/catalog/assessments/${assessmentPublicId}/versions`, payload);
  },
  createQuestion(payload: { code: string }): Promise<{ question: { publicId: string } }> {
    return api.post("/api/catalog/questions", payload);
  },
  createQuestionVersion(
    questionPublicId: string,
    payload: { questionType: QuestionType; prompt: string; explanation?: string; points?: number }
  ): Promise<{ version: CreatedVersion }> {
    return api.post(`/api/catalog/questions/${questionPublicId}/versions`, payload);
  },
  addQuestionOption(
    questionVersionId: string,
    payload: { optionKey: string; optionText: string; isCorrect: boolean; position: number }
  ): Promise<void> {
    return api.post(`/api/catalog/question-versions/${questionVersionId}/options`, payload);
  },
  addMatchingPair(
    questionVersionId: string,
    payload: { leftKey: string; leftText: string; rightKey: string; rightText: string; position: number }
  ): Promise<void> {
    return api.post(`/api/catalog/question-versions/${questionVersionId}/pairs`, payload);
  },
  publishQuestionVersion(id: string): Promise<void> {
    return api.post(`/api/catalog/question-versions/${id}/publish`);
  },
  attachQuestion(
    assessmentVersionId: string,
    payload: { questionVersionId: string; position: number; poolGroup?: string; isRequired?: boolean }
  ): Promise<void> {
    return api.post(`/api/catalog/assessment-versions/${assessmentVersionId}/questions`, payload);
  },
  publishAssessmentVersion(id: string): Promise<void> {
    return api.post(`/api/catalog/assessment-versions/${id}/publish`);
  },

  // ---- Products & prices --------------------------------------------------------------
  catalogProducts(status?: "draft" | "active" | "retired"): Promise<{ products: CatalogProduct[] }> {
    return api.get("/api/catalog/products", { query: { status } });
  },
  catalogProduct(publicId: string): Promise<{ product: CatalogProductDetail }> {
    return api.get(`/api/catalog/products/${publicId}`);
  },
  createProduct(payload: {
    code: string;
    name: string;
    productType: "program" | "module";
  }): Promise<{ product: { publicId: string } }> {
    return api.post("/api/catalog/products", payload);
  },
  attachProductContent(
    publicId: string,
    payload: { coursePublicId: string } | { modulePublicId: string }
  ): Promise<void> {
    return api.post(`/api/catalog/products/${publicId}/content`, payload);
  },
  activateProduct(publicId: string): Promise<void> {
    return api.post(`/api/catalog/products/${publicId}/activate`);
  },
  retireProduct(publicId: string): Promise<void> {
    return api.post(`/api/catalog/products/${publicId}/retire`);
  },
  prices(productPublicId: string): Promise<{ prices: ProductPrice[] }> {
    return api.get(`/api/catalog/products/${productPublicId}/prices`);
  },
  createPrice(
    productPublicId: string,
    payload: { billingPeriod: "annual" | "monthly"; unitAmountMinor: number; currency?: "USD" }
  ): Promise<{ price: ProductPrice }> {
    return api.post(`/api/catalog/products/${productPublicId}/prices`, { currency: "USD", ...payload });
  },
  retirePrice(priceId: string): Promise<void> {
    return api.post(`/api/catalog/prices/${priceId}/retire`);
  }
};

export interface AgencyInvitation {
  id: string;
  emailNormalized: string;
  roleCode: string;
  expiresAt: string;
  status: string;
  createdAt: string;
}

export interface AgencyOverview {
  members: number;
  pending_invitations: number;
  seats_available: number;
  recent_orders: number;
}

export interface AgencyOrder {
  publicId: string;
  status: string;
  paymentMethod: "card" | "invoice";
  currency: string;
  totalMinor: number;
  purchaseOrderNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  item?: { productName: string; quantity: number; unitAmountMinor: number; lineTotalMinor: number };
}

export interface MonthlyRevenue {
  month: string;
  orders: number;
  revenueCents: number;
}

export interface QueueStat {
  pending: number;
  sending?: number;
  failed?: number;
  oldestSeconds: number | null;
}

export interface Observability {
  status: string;
  process: {
    uptimeSeconds: number;
    nodeVersion: string;
    memory: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number };
  };
  queues: { auditOutbox: QueueStat; notifications: QueueStat; stripeWebhooks: QueueStat };
}

/** Numeric version id (string) returned by every `POST .../versions` authoring call. */
export interface CreatedVersion {
  id: string;
  versionNo: number;
}

export interface CatalogCourseVersion {
  id: string;
  versionNo: number;
  title: string;
  status: string;
  publishedAt: string | null;
  navigationMode: string;
  certificateMode: string;
}

export interface CourseVersionDetail {
  id: string;
  versionNo: number;
  title: string;
  status: string;
  publishedAt: string | null;
  modules: { moduleVersionId: string; position: number; isRequired: boolean; title: string; status: string }[];
}

export interface CatalogModuleVersion {
  id: string;
  versionNo: number;
  title: string;
  status: string;
  publishedAt: string | null;
}

export interface ModuleVersionDetail extends CatalogModuleVersion {
  lessons: {
    lessonVersionId: string;
    position: number;
    isRequired: boolean;
    title: string;
    lessonType: string;
    status: string;
  }[];
}

export interface LessonVersionInput {
  lessonType: "video" | "reading" | "resource";
  title: string;
  bodyHtml?: string;
  /** Vimeo video id (alphanumeric, `_` or `-`). Required for video lessons only. */
  videoAssetId?: string;
  durationSeconds?: number;
  completionRule?: "open" | "manual" | "video_percent";
  completionThreshold?: number;
}

export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "matching";

export interface CatalogProduct {
  publicId: string;
  code: string;
  name: string;
  productType: string;
  status: string;
}

export interface CatalogProductDetail extends CatalogProduct {
  content: { courseId: string | null; moduleId: string | null } | null;
}

export interface ProductPrice {
  id: string;
  billingPeriod: "annual" | "monthly";
  currency: string;
  unitAmountMinor: number;
  activeFrom: string;
  activeUntil: string | null;
  isActive: boolean;
}
