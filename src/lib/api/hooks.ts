"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useToast } from "@/components/ui/toast";

import { http } from "./client";
import { api, ApiClientError, type MemberQuery } from "./index";
import { requireAgencyId } from "./session-store";
import type { AgencySummary, Order, Page } from "./types";
import {
  getEnrollment,
  getProfile,
  learnerKeys,
  listAllAssessments,
  listCertificates,
  listEnrollments,
  updateProfile,
  type EnrollmentAssessment,
  type EnrollmentSummary,
  type EnrollmentDetail,
  type MyCertificate,
  type Profile,
  type ProfileUpdate,
} from "./learner";

/** Read hooks. Pages call these, never `api` directly, so the adapter stays swappable. */
export const useMembers = (q: MemberQuery) => useQuery({ queryKey: ["members", q], queryFn: () => api.members.list(q), placeholderData: keepPreviousData });
export const useAllMembers = () => useQuery({ queryKey: ["members-all"], queryFn: () => api.members.all() });
export const useInvitations = () => useQuery({ queryKey: ["invitations"], queryFn: () => api.invitations.list() });
export const useEntitlements = () => useQuery({ queryKey: ["entitlements"], queryFn: () => api.seats.entitlements() });
export const useSeats = (entitlementId: string | null) => useQuery({ queryKey: ["seats", entitlementId], queryFn: () => api.seats.list(entitlementId as string), enabled: !!entitlementId });
export const useStoreProducts = () => useQuery({ queryKey: ["store"], queryFn: () => api.store.products() });
export const useOrders = (q: { limit?: number; offset?: number }) => useQuery({ queryKey: ["orders", q], queryFn: () => api.store.orders(q), placeholderData: keepPreviousData });
export const useKpis = () => useQuery({ queryKey: ["kpis"], queryFn: () => api.platform.kpis() });
export const useHealth = () => useQuery({ queryKey: ["health"], queryFn: () => api.platform.health() });
export const useAgencies = (q: { search?: string; status?: string; limit?: number; offset?: number }) => useQuery({ queryKey: ["agencies", q], queryFn: () => api.platform.agencies(q), placeholderData: keepPreviousData });
export const useAgency = (id: string) => useQuery({ queryKey: ["agency", id], queryFn: () => api.platform.agency(id) });
export const useAllOrders = (q: { limit?: number; offset?: number; status?: string }) => useQuery({ queryKey: ["all-orders", q], queryFn: () => api.platform.allOrders(q), placeholderData: keepPreviousData });
export const useCatalog = (status?: string) => useQuery({ queryKey: ["catalog", status ?? "all"], queryFn: () => api.catalog.products(status) });
export const useCourse = () => useQuery({ queryKey: ["course"], queryFn: () => api.catalog.course() });
export const useLearnCourse = () => useQuery({ queryKey: ["learn-course"], queryFn: () => api.learner.course() });
export const useQuiz = () => useQuery({ queryKey: ["quiz"], queryFn: () => api.learner.quiz() });
export const useCertificates = () => useQuery({ queryKey: ["certificates"], queryFn: () => api.learner.certificates() });
export const useActivity = () => useQuery({ queryKey: ["activity"], queryFn: () => api.feeds.activity() });
export const useNotifications = () => useQuery({ queryKey: ["notifications"], queryFn: () => api.feeds.notifications() });

// ---- Learner (real backend view models) ------------------------------------------------

export const useEnrollments = () =>
  useQuery({ queryKey: learnerKeys.enrollments, queryFn: listEnrollments });
export const useEnrollment = (ref: string | null) =>
  useQuery({ queryKey: learnerKeys.enrollment(ref ?? ""), queryFn: () => getEnrollment(ref as string), enabled: !!ref });
export const useLearnerCertificates = () =>
  useQuery<MyCertificate[]>({ queryKey: learnerKeys.certificates, queryFn: listCertificates });
export const useProfile = () => useQuery<Profile>({ queryKey: learnerKeys.profile, queryFn: getProfile });
export const useAllAssessments = (enrollments: EnrollmentSummary[] | undefined) =>
  useQuery<EnrollmentAssessment[]>({
    queryKey: ["learner", "assessments-all", enrollments?.map((e) => e.uuid) ?? []],
    queryFn: () => listAllAssessments(enrollments ?? []),
    enabled: !!enrollments,
  });

export function useUpdateProfile() {
  const toast = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileUpdate) => updateProfile(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: learnerKeys.profile });
      toast.success("Profile updated");
    },
    onError: (error) => toast.error("That didn't work", describeError(error)),
  });
}

// ---- Agency administration extras --------------------------------------------------------

export interface AgencyOverview {
  members: number;
  pending_invitations: number;
  seats_available: number;
  recent_orders: number;
}

export interface AgencyReportOverview {
  members: { active: number };
  seats: { capacity: number; assigned: number };
  enrollments: { total: number; completed: number; inProgress: number; completionPercent: number | null };
  assessments: { attempts: number; graded: number; passed: number; passRatePercent: number | null; averageScorePercent: number | null };
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

export const useAgencyOverview = (enabled: boolean) =>
  useQuery<AgencyOverview>({
    queryKey: ["agency-overview"],
    queryFn: () => http<AgencyOverview>("GET", `/api/agencies/${requireAgencyId()}/overview`),
    enabled,
  });

export const useAgencyReport = (enabled: boolean) =>
  useQuery<AgencyReportOverview>({
    queryKey: ["agency-report"],
    queryFn: () => http<AgencyReportOverview>("GET", `/api/agencies/${requireAgencyId()}/reports/overview`),
    enabled,
  });

export const useAgencyLearnerReport = (enabled: boolean) =>
  useQuery<{ items: AgencyLearnerReport[] }>({
    queryKey: ["agency-learners-report"],
    queryFn: () => http<{ items: AgencyLearnerReport[] }>("GET", `/api/agencies/${requireAgencyId()}/reports/learners`),
    enabled,
  });

// ---- Platform extras ----------------------------------------------------------------------

export const usePlatformAgencyList = (q: { search?: string; limit?: number; offset?: number }) =>
  useQuery<Page<AgencySummary>>({
    queryKey: ["agencies", q],
    queryFn: () => api.platform.agencies(q),
    placeholderData: keepPreviousData,
  });

export const usePlatformOrders = (q: { limit?: number; offset?: number }) =>
  useQuery<Page<Order>>({
    queryKey: ["all-orders", q],
    queryFn: () => api.platform.allOrders(q),
    placeholderData: keepPreviousData,
  });

export function describeError(error: unknown): string {
  if (error instanceof ApiClientError) {
    const detail = error.details?.[0];
    return detail ? `${error.message}: ${detail.field} - ${detail.message}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

interface ActionOptions<R> {
  /** Query key prefixes to refresh after success. */
  invalidate?: string[];
  success?: string | ((result: R) => string);
}

/**
 * A mutation that toasts its outcome and refreshes related lists.
 * `run(...)` resolves to the result (or `true` for void actions), or `undefined` if it failed
 * (the error is already shown).
 */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, options: ActionOptions<R> = {}) {
  const toast = useToast();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: A) => fn(...args),
    onSuccess: async (result) => {
      await Promise.all((options.invalidate ?? []).map((key) => qc.invalidateQueries({ queryKey: [key] })));
      const message = typeof options.success === "function" ? options.success(result) : options.success;
      if (message) toast.success(message);
    },
    onError: (error) => toast.error("That didn't work", describeError(error)),
  });
  const { mutateAsync } = mutation;
  const run = useCallback(async (...args: A): Promise<R | true | undefined> => {
    try {
      const result = await mutateAsync(args);
      return result === undefined ? true : result;
    } catch {
      return undefined;
    }
  }, [mutateAsync]);
  return { run, pending: mutation.isPending };
}
