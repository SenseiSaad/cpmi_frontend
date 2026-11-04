"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Award, CheckCircle2, ChevronLeft, Clock, GraduationCap, Lock, PlusCircle, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge, StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { grantExtraAttempts, setMemberStatus, useLearnerDetail, type LearnerAssessment, type LearnerEnrollment } from "@/lib/api/people";
import { cn } from "@/lib/utils";

const date = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");
const initials = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
const ENROLLMENT_LABEL: Record<string, string> = { assigned: "Not started", in_progress: "In progress", completed: "Completed", expired: "Expired", withdrawn: "Withdrawn" };

/** What a person looking at an assessment needs to know first, in a few words. */
function assessmentState(a: LearnerAssessment): { label: string; tone: "ok" | "warn" | "bad" | "neutral" | "info" } {
  if (a.hasPassed) return { label: "Passed", tone: "ok" };
  if (a.inProgressAttemptId) return { label: "Taking it now", tone: "info" };
  if (a.maxAttempts !== null && a.attemptsRemaining === 0) return { label: "Out of tries", tone: "bad" };
  if (a.locked) return { label: "Not open yet", tone: "neutral" };
  if (a.attemptsUsed > 0) return { label: "Not passed yet", tone: "warn" };
  return { label: "Not started", tone: "neutral" };
}

function triesText(a: LearnerAssessment): string {
  if (a.maxAttempts === null) return `${a.attemptsUsed} used · unlimited tries`;
  const extra = a.extraAttempts > 0 ? ` (${a.baseAttempts} + ${a.extraAttempts} extra)` : "";
  return `${a.attemptsUsed} of ${a.maxAttempts} used${extra}`;
}

// ---- Give more tries ------------------------------------------------------------------------------------------

function GrantTriesDialog({
  target,
  agencyId,
  membershipId,
  onClose,
}: {
  target: { enrollment: LearnerEnrollment; assessment: LearnerAssessment } | null;
  agencyId: string;
  membershipId: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const [count, setCount] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!target) return null;
  const { enrollment, assessment } = target;
  const allowedNow = assessment.maxAttempts ?? 0;
  const roomLeft = 10 - assessment.extraAttempts;
  const reasonOk = reason.trim().length >= 3;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await grantExtraAttempts(agencyId, enrollment.enrollmentUuid, assessment.assessmentPublicId, { extraAttempts: count, reason: reason.trim() });
      await qc.invalidateQueries({ queryKey: ["learner-detail", agencyId, membershipId] });
      toast.success("More tries given", `${res.attemptsRemaining} ${res.attemptsRemaining === 1 ? "try" : "tries"} left. The learner has been emailed.`);
      setReason("");
      setCount(1);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Give more tries"
      description={`${assessment.title} · ${enrollment.title}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!reasonOk || roomLeft <= 0} icon={<PlusCircle className="size-4" aria-hidden />} onClick={() => void save()}>
            Give {count} more {count === 1 ? "try" : "tries"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="rounded-2xl bg-canvas-soft p-3 text-sm text-ink-700">
          Right now: <b>{triesText(assessment)}</b>. After this the learner will be allowed <b>{allowedNow + count}</b> in total and can try again straight away.
        </p>
        <Field label="How many more tries?">
          {({ id }) => (
            <Select id={id} value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].filter((n) => n <= roomLeft).map((n) => (
                <option key={n} value={n}>{n} more {n === 1 ? "try" : "tries"}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Why?" required hint="This is kept as a permanent record with your name and the date.">
          {({ id, describedBy }) => (
            <Textarea id={id} aria-describedby={describedBy} rows={3} maxLength={500} placeholder="e.g. They were unwell on the day, or the connection dropped during the exam." value={reason} onChange={(e) => setReason(e.target.value)} />
          )}
        </Field>
        {roomLeft <= 0 ? <p className="text-sm text-bad">The limit of 10 extra tries for this exam has been reached.</p> : null}
        {error ? <p role="alert" className="rounded-xl bg-bad-bg p-3 text-sm text-bad">{error}</p> : null}
      </div>
    </Modal>
  );
}

// ---- One course the learner is on ----------------------------------------------------------------------------

function EnrollmentCard({
  enrollment,
  canManage,
  onGrant,
}: {
  enrollment: LearnerEnrollment;
  canManage: boolean;
  onGrant: (a: LearnerAssessment) => void;
}) {
  const active = enrollment.status === "assigned" || enrollment.status === "in_progress";
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-ink-900">{enrollment.title}</h2>
            <Badge tone={enrollment.status === "completed" ? "ok" : active ? "brand" : "neutral"} dot>{ENROLLMENT_LABEL[enrollment.status] ?? enrollment.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            Assigned {date(enrollment.assignedAt)} · {enrollment.startedAt ? `started ${date(enrollment.startedAt)}` : "not started"}
            {enrollment.completedAt ? ` · completed ${date(enrollment.completedAt)}` : ` · access until ${date(enrollment.expiresAt)}`}
            {enrollment.lastActivityAt ? ` · last active ${date(enrollment.lastActivityAt)}` : ""}
          </p>
        </div>
        <div className="min-w-[10rem] text-right">
          <p className="tnum text-2xl font-extrabold text-ink-900">{Math.round(enrollment.progressPercent)}%</p>
          <p className="text-xs text-ink-600">{enrollment.lessonsDone} of {enrollment.lessonsTotal} lessons</p>
        </div>
      </div>
      <ProgressBar value={enrollment.progressPercent} label={`${enrollment.title} progress`} className="mt-3" />

      {enrollment.modules.length > 0 ? (
        <section className="mt-6" aria-label="Progress by module">
          <h3 className="text-sm font-bold text-ink-900">Progress by module</h3>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {enrollment.modules.map((m) => (
              <li key={m.position} className="rounded-2xl bg-canvas-soft px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-ink-900">{m.title}</span>
                  <span className="tnum shrink-0 text-ink-600">{m.done}/{m.total}</span>
                </div>
                <ProgressBar value={m.total ? (m.done / m.total) * 100 : 0} label={`${m.title} progress`} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6" aria-label="Quizzes and exams">
        <h3 className="text-sm font-bold text-ink-900">Quizzes and exams</h3>
        {enrollment.assessments.length === 0 ? (
          <p className="mt-2 text-sm text-ink-600">This course has no quizzes or exams.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {enrollment.assessments.map((a) => {
              const state = assessmentState(a);
              const canGrant = canManage && active && !a.hasPassed && a.baseAttempts !== null && a.extraAttempts < 10;
              const needsMore = a.maxAttempts !== null && a.attemptsRemaining === 0 && !a.hasPassed;
              return (
                <li key={a.assessmentPublicId} className={cn("rounded-2xl p-4 ring-1", needsMore ? "bg-bad-bg/40 ring-bad/30" : "bg-white ring-line")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="navy">{a.kind === "final" ? "Final exam" : "Module quiz"}</Badge>
                        <Badge tone={state.tone} dot>{state.label}</Badge>
                      </div>
                      <p className="mt-1.5 font-semibold text-ink-900">{a.title}</p>
                      <p className="text-sm text-ink-600">
                        {triesText(a)} · best score {a.bestScorePercent === null ? "—" : `${Math.round(a.bestScorePercent)}%`}
                      </p>
                      {a.locked && !a.hasPassed ? <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600"><Lock className="size-3.5" aria-hidden /> {a.lockedReason}</p> : null}
                    </div>
                    {canGrant ? (
                      <Button size="sm" variant={needsMore ? "primary" : "secondary"} icon={<PlusCircle className="size-4" aria-hidden />} onClick={() => onGrant(a)}>
                        Give more tries
                      </Button>
                    ) : null}
                  </div>

                  {a.attempts.length > 0 ? (
                    <ol className="mt-3 flex flex-wrap gap-2" aria-label="Attempts">
                      {a.attempts.map((t) => (
                        <li key={t.attemptNo} className={cn("flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold ring-1", t.passed ? "bg-ok-bg text-ok ring-ok/30" : t.status === "graded" ? "bg-canvas-soft text-ink-700 ring-line" : "bg-warn-bg text-warn ring-warn/30")}>
                          {t.passed ? <CheckCircle2 className="size-3.5" aria-hidden /> : t.status === "graded" ? <XCircle className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
                          Try {t.attemptNo}: {t.scorePercent === null ? "in progress" : `${Math.round(t.scorePercent)}%`}
                          <span className="font-normal text-ink-600">· {date(t.startedAt)}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  {a.allowances.length > 0 ? (
                    <ul className="mt-3 space-y-1.5 border-t border-line pt-3" aria-label="Extra tries given">
                      {a.allowances.map((g) => (
                        <li key={g.id} className="flex items-start gap-2 text-sm text-ink-700">
                          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
                          <span><b>+{g.extraAttempts} {g.extraAttempts === 1 ? "try" : "tries"}</b> from {g.grantedBy} on {date(g.grantedAt)}: “{g.reason}”</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {enrollment.certificates.length > 0 ? (
        <section className="mt-6" aria-label="Certificates">
          <h3 className="text-sm font-bold text-ink-900">Certificates</h3>
          <ul className="mt-2 space-y-2">
            {enrollment.certificates.map((c) => (
              <li key={c.uuid} className="flex flex-wrap items-center gap-3 rounded-2xl bg-ok-bg/50 px-4 py-2.5 text-sm">
                <Award className="size-4 text-ok" aria-hidden />
                <span className="font-semibold text-ink-900">{c.title}</span>
                <span className="font-mono text-xs text-ink-600">{c.certificateNumber}</span>
                <span className="text-ink-600">issued {date(c.issuedAt)}</span>
                <Badge tone={c.status === "valid" ? "ok" : "bad"} dot>{c.status === "valid" ? "Valid" : "Revoked"}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Panel>
  );
}

// ---- The page body --------------------------------------------------------------------------------------------

export function LearnerDetailView({ agencyId, membershipId, backHref, backLabel, canManage }: { agencyId: string; membershipId: string; backHref: string; backLabel: string; canManage: boolean }) {
  const detail = useLearnerDetail(agencyId, membershipId);
  const qc = useQueryClient();
  const toast = useToast();
  const [grant, setGrant] = useState<{ enrollment: LearnerEnrollment; assessment: LearnerAssessment } | null>(null);
  const [confirm, setConfirm] = useState<"suspend" | "reactivate" | null>(null);
  const [busy, setBusy] = useState(false);

  async function changeMember(action: "suspend" | "reactivate") {
    setBusy(true);
    try {
      await setMemberStatus(agencyId, membershipId, action);
      await Promise.all(["learner-detail", "members", "agency-detail"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
      toast.success(action === "suspend" ? "Learner suspended" : "Learner reactivated");
      setConfirm(null);
    } catch (e) {
      toast.error("That didn't work", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  const back = (
    <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-600 hover:text-brand-800">
      <ChevronLeft className="size-4" aria-hidden /> {backLabel}
    </Link>
  );

  if (detail.isError) {
    return (
      <>
        {back}
        <Panel><ErrorState message={detail.error instanceof Error ? detail.error.message : "This learner could not be loaded."} onRetry={() => void detail.refetch()} /></Panel>
      </>
    );
  }
  if (detail.isPending || !detail.data) {
    return (
      <>
        {back}
        <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-72" /></div>
      </>
    );
  }

  const { member, enrollments } = detail.data;
  const fullName = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;
  const needAttention = enrollments.flatMap((e) => e.assessments).filter((a) => a.maxAttempts !== null && a.attemptsRemaining === 0 && !a.hasPassed).length;

  return (
    <>
      {back}
      <header className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/[0.04]">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-navy-900 text-lg font-bold text-brand-200" aria-hidden>{initials(member.user.firstName, member.user.lastName)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-navy-900">{fullName}</h1>
            <StatusPill status={member.membershipStatus} />
            {member.roles.includes("agency_admin") ? <Badge tone="navy">Administrator</Badge> : null}
          </div>
          <p className="mt-0.5 font-mono text-sm text-ink-600">{member.user.email}</p>
          <p className="mt-0.5 text-sm text-ink-600">
            {member.employeeReference ? `Employee ID ${member.employeeReference} · ` : ""}Joined {date(member.joinedAt)}
          </p>
        </div>
        {canManage ? (
          member.membershipStatus === "active" ? (
            <Button variant="secondary" onClick={() => setConfirm("suspend")}>Suspend</Button>
          ) : member.membershipStatus === "suspended" ? (
            <Button onClick={() => setConfirm("reactivate")}>Reactivate</Button>
          ) : null
        ) : null}
      </header>

      {needAttention > 0 ? (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl bg-bad-bg p-4 text-sm text-bad">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p><b>{fullName.split(" ")[0]} has used every try on {needAttention === 1 ? "an exam" : `${needAttention} exams`} and cannot go on.</b> {canManage ? "Use “Give more tries” below if they should have another go." : ""}</p>
        </div>
      ) : null}

      {enrollments.length === 0 ? (
        <Panel>
          <EmptyState icon={GraduationCap} title="Not on a course yet" description="Assign this person a seat from the Seats page and their courses will appear here." />
        </Panel>
      ) : (
        <div className="space-y-6">
          {enrollments.map((e) => (
            <EnrollmentCard key={e.enrollmentUuid} enrollment={e} canManage={canManage} onGrant={(assessment) => setGrant({ enrollment: e, assessment })} />
          ))}
        </div>
      )}

      <GrantTriesDialog key={grant?.assessment.assessmentPublicId ?? "none"} target={grant} agencyId={agencyId} membershipId={membershipId} onClose={() => setGrant(null)} />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === "suspend" ? `Suspend ${fullName}?` : `Reactivate ${fullName}?`}
        description={confirm === "suspend" ? "They will lose access and their seat will be freed. You can reactivate them later." : "They will be able to sign in and use the agency again."}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant={confirm === "suspend" ? "danger" : "primary"} loading={busy} onClick={() => confirm && void changeMember(confirm)}>{confirm === "suspend" ? "Suspend" : "Reactivate"}</Button></>}
      >
        <p className="text-sm text-ink-700">{confirm === "suspend" ? "Their progress and certificates are kept." : ""}</p>
      </Modal>
    </>
  );
}
