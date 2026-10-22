/**
 * Learner API — verified against cpmi-backend. Shapes mirror:
 * - modules/enrollments/service.ts (enrollment + lesson progress)
 * - modules/assessments/service.ts (assessments, attempts, grading)
 * - modules/certificates/service.ts (certificate wallet)
 * - http/routes/me.routes.ts (profile)
 */
import { env } from "@/config/env";

import { http } from "./client";
import { ApiClientError } from "./error";

export type EnrollmentStatus = "assigned" | "in_progress" | "completed" | "expired" | "withdrawn";

export interface EnrollmentSummary {
  uuid: string;
  course: { uuid: string | null; title: string; description: string | null };
  status: EnrollmentStatus;
  progress_percent: number;
  due_at: string;
  agency: { uuid: string; name: string };
}

export interface LessonSummary {
  uuid: string;
  title: string;
  lessonType: string;
  moduleTitle: string;
  modulePosition: number;
  lessonPosition: number;
  durationMinutes: number | null;
  completed: boolean;
  progressPercent: number;
  playbackSeconds: number;
  watchedSeconds: number;
}

export interface EnrollmentDetail extends EnrollmentSummary {
  lessons: LessonSummary[];
  readOnly: boolean;
}

export interface LessonContent {
  lesson: {
    uuid: string;
    title: string;
    lessonType: string;
    /** Sanitized server-side. */
    bodyHtml: string | null;
    video: { provider: string; assetId: string } | null;
    durationSeconds: number | null;
    completionRule: "open" | "manual" | "video_percent" | string;
    completionThreshold: number | null;
    resources: { name: string; mimeType: string; byteSize: string; position: number }[];
  };
  enrollment: { uuid: string; status: EnrollmentStatus };
}

export type ProgressAction = "open" | "heartbeat" | "complete";

export interface ProgressInput {
  enrollment_uuid: string;
  lesson_uuid: string;
  action: ProgressAction;
  playback_seconds?: number;
  watched_delta_seconds?: number;
  idempotency_key?: string;
}

export interface ProgressResult {
  lesson: { uuid: string; completed: boolean; progress_percent: number };
  enrollment: { status: EnrollmentStatus; progress_percent: number };
}

export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "matching";

export interface AssessmentOverview {
  assessmentPublicId: string;
  kind: "module" | "final";
  title: string;
  availableFrom: string;
  attemptsUsed: number;
  maxAttempts: number | null;
  bestScorePercent: number | null;
  hasPassed: boolean;
  inProgressAttemptId: string | null;
}

export interface AttemptQuestion {
  questionPublicId: string;
  questionType: QuestionType;
  /** Sanitized server-side. */
  promptHtml: string;
  pointsPossible: number;
  displayPosition: number;
  options?: { optionKey: string; optionText: string }[];
  pairs?: { left: { key: string; text: string }[]; right: { key: string; text: string }[] };
  results?: { isCorrect: boolean | null; pointsAwarded: number | null; explanationHtml: string | null };
}

export interface AttemptView {
  attemptPublicId: string;
  attemptNo: number;
  status: "in_progress" | "submitted" | "graded" | "abandoned";
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  scorePercent: number | null;
  passed: boolean | null;
  possiblePoints: number | null;
  questions: AttemptQuestion[];
}

export interface SubmitResult extends AttemptView {
  passedThreshold: number;
}

export interface AnswerValue {
  selected?: string[];
  matches?: Record<string, string>;
}
export type AnswerMap = Record<string, AnswerValue>;

export interface MyCertificate {
  uuid: string;
  certificateNumber: string;
  certificateType: string;
  courseTitle: string | null;
  moduleTitle: string | null;
  issuedAt: string;
  expiresAt: string | null;
  status: "valid" | "revoked";
  revokedAt: string | null;
  revocationReason: string | null;
  pdfUrl: string;
}

export interface CertificateVerification {
  found: boolean;
  valid: boolean;
  certificate?: {
    certificateNumber: string;
    certificateType: "module" | "final";
    learnerName: string;
    courseTitle: string | null;
    moduleTitle: string | null;
    issuedAt: string;
    expiresAt: string | null;
  };
  revocation?: { revokedAt: string; reason: string };
}

export interface Profile {
  email: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
}

export type ProfileUpdate = Partial<Pick<Profile, "first_name" | "last_name" | "job_title">>;

const enc = encodeURIComponent;

export const learnerKeys = {
  enrollments: ["learner", "enrollments"] as const,
  enrollment: (ref: string) => ["learner", "enrollment", ref] as const,
  lesson: (ref: string, lessonId: string) => ["learner", "lesson", ref, lessonId] as const,
  assessments: (ref: string) => ["learner", "assessments", ref] as const,
  attempts: (ref: string, assessmentId: string) => ["learner", "attempts", ref, assessmentId] as const,
  attempt: (id: string) => ["learner", "attempt", id] as const,
  certificates: ["learner", "certificates"] as const,
  profile: ["learner", "profile"] as const,
};

export async function listEnrollments(): Promise<EnrollmentSummary[]> {
  return (await http<{ items: EnrollmentSummary[] }>("GET", "/api/me/enrollments")).items;
}

export function getEnrollment(ref: string): Promise<EnrollmentDetail> {
  return http<EnrollmentDetail>("GET", `/api/me/enrollments/${enc(ref)}`);
}

export function getLesson(ref: string, lessonId: string): Promise<LessonContent> {
  return http<LessonContent>("GET", `/api/me/enrollments/${enc(ref)}/lessons/${enc(lessonId)}`);
}

export function recordProgress(input: ProgressInput): Promise<ProgressResult> {
  return http<ProgressResult>("POST", "/api/me/progress", input);
}

export async function listAssessments(ref: string): Promise<AssessmentOverview[]> {
  return (await http<{ items: AssessmentOverview[] }>("GET", `/api/me/enrollments/${enc(ref)}/assessments`)).items;
}

export interface EnrollmentAssessment extends AssessmentOverview {
  enrollment: EnrollmentSummary;
}

/** Assessments across every enrollment (404s from completed enrollments are skipped). */
export async function listAllAssessments(enrollments: EnrollmentSummary[]): Promise<EnrollmentAssessment[]> {
  const results = await Promise.all(
    enrollments.map(async (enrollment) => {
      try {
        const items = await listAssessments(enrollment.uuid);
        return items.map((a) => ({ ...a, enrollment }));
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 404) return [];
        throw err;
      }
    }),
  );
  return results.flat();
}

export function startAttempt(ref: string, assessmentId: string): Promise<AttemptView> {
  return http<AttemptView>("POST", `/api/me/enrollments/${enc(ref)}/assessments/${enc(assessmentId)}/attempts`);
}

export async function listAttempts(ref: string, assessmentId: string): Promise<AttemptView[]> {
  return (
    await http<{ items: AttemptView[] }>(
      "GET",
      `/api/me/enrollments/${enc(ref)}/assessments/${enc(assessmentId)}/attempts`,
    )
  ).items;
}

export function saveAnswers(attemptId: string, answers: AnswerMap): Promise<void> {
  return http<void>("POST", `/api/me/attempts/${enc(attemptId)}/answers`, { answers });
}

export function submitAttempt(attemptId: string, answers: AnswerMap): Promise<SubmitResult> {
  return http<SubmitResult>("POST", `/api/me/attempts/${enc(attemptId)}/submit`, { answers });
}

export function getAttempt(attemptId: string): Promise<AttemptView> {
  return http<AttemptView>("GET", `/api/me/attempts/${enc(attemptId)}`);
}

export async function listCertificates(): Promise<MyCertificate[]> {
  return (await http<{ items: MyCertificate[] }>("GET", "/api/me/certificates")).items;
}

/**
 * Public certificate verification by the unguessable token printed on the PDF.
 * Never verify by certificate number: numbers are enumerable and the backend rejects them.
 */
export function verifyCertificate(token: string): Promise<CertificateVerification> {
  return http<CertificateVerification>("GET", "/api/public/certificates/verify", undefined, {
    query: { token },
  });
}

/** Fetches the certificate PDF (session cookie) and triggers a browser download. */
export async function downloadCertificatePdf(cert: MyCertificate): Promise<void> {
  const res = await fetch(`${env.apiBaseUrl}${cert.pdfUrl}`, { credentials: "include" });
  if (!res.ok) {
    throw new ApiClientError(res.status === 401 ? "unauthenticated" : res.status === 404 ? "not_found" : "internal", res.status === 404 ? "Certificate not found." : "Could not download the certificate.", { status: res.status });
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cert.certificateNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getProfile(): Promise<Profile> {
  return http<Profile>("GET", "/api/me/profile");
}

export function updateProfile(body: ProfileUpdate): Promise<void> {
  return http<void>("PATCH", "/api/me/profile", body);
}

export function newIdempotencyKey(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}:${rand}`.replace(/[^A-Za-z0-9:_-]/g, "");
}
