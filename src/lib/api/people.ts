"use client";

/**
 * Detail pages for an agency (platform staff) and for one learner (agency administrators and platform staff).
 * Every call names the agency explicitly: the backend resolves it from the URL and checks the caller's role for
 * THAT agency, so the same endpoints serve an agency administrator (their own agency) and platform staff (any agency).
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { http } from "./client";
import { mapEntitlement, mapOrder, type BackendPage } from "./live";
import type { Entitlement, Order, Page } from "./types";

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const pageOf = <T,>(items: T[], page: Partial<BackendPage> | undefined, limit: number, offset: number): Page<T> => ({
  items,
  total: Number(page?.total ?? items.length),
  limit: Number(page?.limit ?? limit),
  offset: Number(page?.offset ?? offset),
});

// ---- Agency (platform staff) ------------------------------------------------------------------------------

export interface AgencyProfile {
  uuid: string;
  name: string;
  legalName: string;
  slug: string;
  status: string;
  billingEmail: string | null;
  logoUrl?: string | null;
  createdAt: string;
  admins: { name: string; email: string; status: string }[];
  members: number;
  activeMembers: number;
  learners: number;
}

export interface AgencyOverviewStats {
  members: { active: number };
  seats: { capacity: number; assigned: number };
  enrollments: { total: number; completed: number; inProgress: number; completionPercent: number | null };
  assessments: { attempts: number; graded: number; passed: number; passRatePercent: number | null; averageScorePercent: number | null };
  certificates: { issued: number; revoked: number };
}

export interface AgencyLearnerLine {
  membershipId: string;
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

export interface AuditLine {
  id: string;
  action: string;
  actorType: string;
  occurredAt: string;
  metadata: unknown;
}

export const fetchAgencyProfile = async (agencyId: string) => (await http<{ agency: AgencyProfile }>("GET", `/api/platform/agencies/${agencyId}/profile`)).agency;
export const fetchAgencyStats = (agencyId: string) => http<AgencyOverviewStats>("GET", `/api/agencies/${agencyId}/reports/overview`);

export async function fetchAgencyLearners(agencyId: string, q: { limit: number; offset: number }): Promise<Page<AgencyLearnerLine>> {
  const raw = await http<{ items: AgencyLearnerLine[]; total: number }>("GET", `/api/agencies/${agencyId}/reports/learners`, undefined, { query: q });
  return pageOf(arr<AgencyLearnerLine>(raw.items), { total: raw.total }, q.limit, q.offset);
}
export async function fetchAgencyOrders(agencyId: string, q: { limit: number; offset: number }): Promise<Page<Order>> {
  const raw = await http<{ orders: any[]; page: BackendPage }>("GET", `/api/agencies/${agencyId}/orders`, undefined, { query: q });
  return pageOf(arr<any>(raw.orders).map(mapOrder), raw.page, q.limit, q.offset);
}
export async function fetchAgencyEntitlements(agencyId: string, q: { limit: number; offset: number }): Promise<Page<Entitlement>> {
  const raw = await http<{ entitlements: any[]; page: BackendPage }>("GET", `/api/agencies/${agencyId}/entitlements`, undefined, { query: q });
  return pageOf(arr<any>(raw.entitlements).map(mapEntitlement), raw.page, q.limit, q.offset);
}
export async function fetchAgencyActivity(agencyId: string, q: { limit: number; offset: number }): Promise<Page<AuditLine>> {
  const raw = await http<{ items: AuditLine[]; page: BackendPage }>("GET", `/api/agencies/${agencyId}/audit-log`, undefined, { query: q });
  return pageOf(arr<AuditLine>(raw.items), raw.page, q.limit, q.offset);
}
export const setAgencyStatus = (agencyId: string, status: "active" | "suspended") => http("PATCH", `/api/platform/agencies/${agencyId}`, { status });

export const useAgencyProfile = (agencyId: string) => useQuery({ queryKey: ["agency-detail", agencyId, "profile"], queryFn: () => fetchAgencyProfile(agencyId) });
export const useAgencyStats = (agencyId: string) => useQuery({ queryKey: ["agency-detail", agencyId, "stats"], queryFn: () => fetchAgencyStats(agencyId) });
export const useAgencyLearners = (agencyId: string, q: { limit: number; offset: number }, enabled = true) =>
  useQuery({ queryKey: ["agency-detail", agencyId, "learners", q], queryFn: () => fetchAgencyLearners(agencyId, q), enabled, placeholderData: keepPreviousData });
export const useAgencyOrders = (agencyId: string, q: { limit: number; offset: number }, enabled = true) =>
  useQuery({ queryKey: ["agency-detail", agencyId, "orders", q], queryFn: () => fetchAgencyOrders(agencyId, q), enabled, placeholderData: keepPreviousData });
export const useAgencyEntitlements = (agencyId: string, q: { limit: number; offset: number }, enabled = true) =>
  useQuery({ queryKey: ["agency-detail", agencyId, "entitlements", q], queryFn: () => fetchAgencyEntitlements(agencyId, q), enabled, placeholderData: keepPreviousData });
export const useAgencyActivity = (agencyId: string, q: { limit: number; offset: number }, enabled = true) =>
  useQuery({ queryKey: ["agency-detail", agencyId, "activity", q], queryFn: () => fetchAgencyActivity(agencyId, q), enabled, placeholderData: keepPreviousData });

// ---- One learner ------------------------------------------------------------------------------------------

export interface LearnerAssessment {
  assessmentPublicId: string;
  kind: "module" | "final";
  title: string;
  attemptsUsed: number;
  maxAttempts: number | null;
  baseAttempts: number | null;
  extraAttempts: number;
  attemptsRemaining: number | null;
  bestScorePercent: number | null;
  hasPassed: boolean;
  inProgressAttemptId: string | null;
  locked: boolean;
  lockedReason: string | null;
  attempts: { attemptNo: number; status: string; scorePercent: number | null; passed: boolean | null; startedAt: string; gradedAt: string | null }[];
  allowances: { id: string; extraAttempts: number; reason: string; grantedBy: string; grantedAt: string }[];
}

export interface LearnerEnrollment {
  enrollmentUuid: string;
  title: string;
  status: string;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  lastActivityAt: string | null;
  lessonsDone: number;
  lessonsTotal: number;
  progressPercent: number;
  modules: { title: string; position: number; done: number; total: number }[];
  assessments: LearnerAssessment[];
  certificates: { uuid: string; certificateNumber: string; certificateType: "module" | "final"; title: string; issuedAt: string; status: "valid" | "revoked" }[];
}

export interface LearnerDetail {
  member: {
    membershipId: string;
    membershipStatus: string;
    employeeReference: string | null;
    joinedAt: string | null;
    user: { publicId: string; email: string; firstName: string; lastName: string; status: string; avatarUrl?: string | null };
    roles: string[];
  };
  enrollments: LearnerEnrollment[];
}

export const fetchLearnerDetail = (agencyId: string, membershipId: string) => http<LearnerDetail>("GET", `/api/agencies/${agencyId}/members/${membershipId}/learning`);
export const useLearnerDetail = (agencyId: string, membershipId: string) =>
  useQuery({ queryKey: ["learner-detail", agencyId, membershipId], queryFn: () => fetchLearnerDetail(agencyId, membershipId) });

export interface GrantResult {
  attemptsAllowed: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  extraAttemptsTotal: number;
}
export const grantExtraAttempts = (agencyId: string, enrollmentUuid: string, assessmentUuid: string, body: { extraAttempts: number; reason: string }) =>
  http<GrantResult>("POST", `/api/agencies/${agencyId}/enrollments/${enrollmentUuid}/assessments/${assessmentUuid}/extra-attempts`, body);

export const setMemberStatus = (agencyId: string, membershipId: string, action: "suspend" | "reactivate" | "remove") =>
  http("POST", `/api/agencies/${agencyId}/members/${membershipId}/status`, { action });
