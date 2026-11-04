/** Plain-English wording for the audit trail, so an administrator reads sentences, not event codes. */
const LABELS: Record<string, string> = {
  "agency.provisioned": "Agency created",
  "agency.suspended": "Agency suspended",
  "agency.reactivated": "Agency reactivated",
  "invitation.issued": "Invitation sent",
  "invitation.accepted": "Invitation accepted",
  "invitation.revoked": "Invitation withdrawn",
  "member.suspended": "Member suspended",
  "member.reactivated": "Member reactivated",
  "member.removed": "Member removed",
  "member.role_changed": "Member's role changed",
  "seat.assigned": "Seat assigned",
  "seat.released": "Seat released",
  "seat.reassigned": "Seat moved to another person",
  "order.created": "Order placed",
  "order.paid": "Order paid",
  "order.voided": "Order cancelled",
  "enrollment.created": "Course assigned",
  "enrollment.completed": "Course completed",
  "assessment.attempt_started": "Started a quiz or exam",
  "assessment.attempt_submitted": "Finished a quiz or exam",
  "assessment.extra_attempts_granted": "Extra tries given",
  "certificate.issued": "Certificate issued",
  "certificate.revoked": "Certificate revoked",
  "certificate.reissued": "Certificate reissued",
  "entitlement.suspended": "Subscription suspended",
  "entitlement.reactivated": "Subscription reactivated",
  "entitlement.revoked": "Subscription revoked",
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
};

export function auditLabel(action: string): string {
  if (LABELS[action]) return LABELS[action];
  const words = action.replace(/[._]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Activity";
}

/** One short detail line for the events where the reason matters. */
export function auditDetail(action: string, metadata: unknown): string | null {
  const m = (metadata ?? {}) as Record<string, unknown>;
  if (action === "assessment.extra_attempts_granted") {
    const n = Number(m.extraAttempts) || 0;
    return `${n} more ${n === 1 ? "try" : "tries"} for ${String(m.assessment ?? "an exam")}. Reason: ${String(m.reason ?? "—")}`;
  }
  if (action === "certificate.issued" && m.certificateNumber) return `Certificate ${String(m.certificateNumber)}`;
  if (typeof m.reason === "string" && m.reason) return `Reason: ${m.reason}`;
  if (typeof m.email === "string") return String(m.email);
  return null;
}
