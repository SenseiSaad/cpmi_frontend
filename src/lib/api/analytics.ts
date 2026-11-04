"use client";

/**
 * Management reports. The same screens serve platform staff (`/api/platform/analytics/*`, every agency) and an agency's
 * administrators (`/api/agencies/:id/analytics/*`, their own agency). The server decides what each may see; the base path
 * is the only difference here.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { http } from "./client";

export type ReportName = "summary" | "courses-in-progress" | "courses-completed" | "completions" | "students" | "agencies" | "revenue" | "subscriptions" | "dormant";

export interface ReportParams {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  days?: number;
  bucket?: "month" | "quarter" | "year";
  search?: string;
}

const clean = (p: ReportParams) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== "")) as Record<string, string | number>;

export function fetchReport<T>(base: string, name: ReportName, params: ReportParams): Promise<T> {
  return http<T>("GET", `${base}/${name}`, undefined, { query: clean(params) });
}

/** A same-origin link that downloads the report as a spreadsheet (the session cookie authorises it). */
export function csvHref(base: string, name: ReportName, params: ReportParams): string {
  const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(clean(params)).map(([k, v]) => [k, String(v)])), format: "csv" });
  q.delete("limit");
  q.delete("offset");
  return `${base}/${name}?${q.toString()}`;
}

export function useReport<T>(base: string, name: ReportName, params: ReportParams, enabled = true) {
  return useQuery({
    queryKey: ["analytics", base, name, params],
    queryFn: () => fetchReport<T>(base, name, params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ---- Shapes (mirror modules/reporting/analytics.ts) --------------------------------------------------------------

export interface PageInfo { total: number; limit: number; offset: number }

export interface Summary {
  students: { total: number; newInPeriod: number };
  courses: { notStarted: number; inProgress: number; completedInPeriod: number; completedTotal: number };
  completions: { count: number; learningSeconds: number; avgSecondsToComplete: number | null };
  dormant: number;
  revenue?: { periodMinor: number; mrrMinor: number; activeSubscriptions: number; agencies: number };
  subscriptions?: { active: number; nextRenewal: string | null };
}
export interface SummaryResponse { range: { from: string; to: string }; summary: Summary; definitions: Record<string, string> }

export interface CourseProgressRow { agencyUuid: string; agency: string; course: string; learners: number; notStarted: number; inProgress: number; avgPercent: number }
export interface CompletedCourseRow { agencyUuid: string; agency: string; course: string; completed: number; avgSecondsToComplete: number | null; learningSeconds: number }
export interface CompletionRow { completedAt: string; agencyUuid: string; agency: string; membershipId: string; learner: string; email: string; course: string; secondsToComplete: number | null; learningSeconds: number }
export interface CompletionsResponse { rows: CompletionRow[]; totals: { count: number; learningSeconds: number; avgSecondsToComplete: number | null }; page: PageInfo }
export interface StudentRow { agencyUuid: string; agency: string; students: number; newInPeriod: number }
export interface StudentsResponse { rows: StudentRow[]; series: { bucket: string; count: number }[]; bucket: "day" | "week" | "month"; page: PageInfo }
export interface AgencyAccountRow { agencyUuid: string; agency: string; status: string; learners: number; seatsPurchased: number; seatsAssigned: number; activeSubscriptions: number; plans: string; revenueMinor: number; firstSubscriptionStart: string | null; nextRenewal: string | null; lastActivity: string | null }
export interface RevenueResponse {
  bucket: "month" | "quarter" | "year";
  series: { bucket: string; revenueMinor: number; orders: number }[];
  totalMinor: number;
  byAgency: { agencyUuid: string; agency: string; revenueMinor: number; orders: number }[];
  byType: { plan: string; type: string; revenueMinor: number; orders: number }[];
  mrrMinor: number;
  arrMinor: number;
  activeSubscriptions: number;
}
export interface SubscriptionRow { agencyUuid: string; agency: string; product: string; type: string; plan: string; status: string; seats: number; seatsAssigned: number; pricePerSeatMinor: number | null; startsAt: string; renewsAt: string }
export interface SubscriptionsResponse { rows: SubscriptionRow[]; byKind: { type: string; plan: string; count: number; seats: number }[]; mrrMinor: number; page: PageInfo }
export interface DormantRow { agencyUuid: string; agency: string; membershipId: string; learner: string; email: string; lastActivity: string | null; daysDormant: number; unfinishedCourses: number }
export interface Rows<T> { rows: T[]; page: PageInfo }

// ---- Formatting used by every report ------------------------------------------------------------------------------

/** "3 d 4 h", "5 h 20 min", "45 min": a duration a person can read. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return seconds === 0 ? "0 min" : "< 1 min";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ""}`;
  const days = Math.floor(hours / 24);
  return `${days} d${hours % 24 ? ` ${hours % 24} h` : ""}`;
}
