"use client";

import { Award, BookOpen, Check, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useEnrollments, useLearnerCertificates, useProfile, useUpdateProfile } from "@/lib/api/hooks";
import { ROLE_LABEL } from "@/lib/api/fixtures";
import { useSession } from "@/lib/auth/session";
import { formatNumber, initials } from "@/lib/utils";

const INPUT_CLASS =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0";

const READONLY_INPUT_CLASS = `${INPUT_CLASS} bg-gray-50 text-gray-500 cursor-not-allowed`;

export default function ProfilePage() {
  const profile = useProfile();
  const enrollments = useEnrollments();
  const certificates = useLearnerCertificates();
  const update = useUpdateProfile();
  const session = useSession();
  const toast = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.data) return;
    setFirstName(profile.data.first_name);
    setLastName(profile.data.last_name);
    setJobTitle(profile.data.job_title ?? "");
  }, [profile.data]);

  const current = profile.data;
  const dirty =
    Boolean(current) &&
    (firstName.trim() !== current!.first_name ||
      lastName.trim() !== current!.last_name ||
      jobTitle.trim() !== (current!.job_title ?? ""));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) {
      setFormError("First and last name are required. Certificates are issued to this legal name.");
      return;
    }
    try {
      await update.mutateAsync({ first_name: first, last_name: last, job_title: jobTitle.trim() || null });
      await session.refresh();
      toast.success("Profile preferences updated", "Your name is updated across the portal.");
    } catch {
      // The hook already surfaces the API error as a toast.
    }
  }

  const user = session.user;
  const initialsText = initials(firstName || user?.firstName || "", lastName || user?.lastName || "");
  const certificateCount = certificates.data?.length ?? 0;
  const enrollmentCount = enrollments.data?.length ?? 0;

  return (
    <>
      <div className="no-print">
        <PageHeader
          eyebrow="Learner"
          title="Learner Profile"
          subtitle="Manage your agency credentials, compliance records, and personal details"
        />
      </div>

      <div className="max-w-4xl space-y-6">
        {profile.isError ? (
          <Panel>
            <div role="alert" className="grid place-items-center px-6 py-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-bad-bg text-bad">
                <ShieldCheck className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-gray-900">We couldn&apos;t load your profile</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-600">
                {profile.error instanceof Error ? profile.error.message : "Something went wrong. Please try again."}
              </p>
              <Button variant="secondary" size="sm" className="mt-5" onClick={() => void profile.refetch()}>
                Try again
              </Button>
            </div>
          </Panel>
        ) : profile.isPending ? (
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-80 rounded-3xl" />
          </div>
        ) : (
          <>
            {/* User Card (Zed design) */}
            <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-gray-200/90 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
              <div className="flex items-center gap-5">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#152A13] text-2xl font-black text-secondary-400 shadow-xs"
                  aria-hidden
                >
                  {initialsText}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-gray-900">
                      {firstName} {lastName}
                    </h2>
                    {user ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-highlight-600">
                        Active {ROLE_LABEL[user.role]}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Mail size={14} aria-hidden /> {current?.email ?? user?.email ?? "—"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-primary-700">
                    <UserRound size={14} aria-hidden />
                    {current?.job_title?.trim() ? current.job_title : "No job title on record"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-gray-700 sm:flex-col sm:items-end">
                <span className="flex items-center gap-1.5 font-bold text-gray-700">
                  <Award size={14} className="text-secondary-600" />
                  {formatNumber(certificateCount)} Certificate{certificateCount === 1 ? "" : "s"}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-gray-700">
                  <BookOpen size={14} className="text-primary-600" />
                  {formatNumber(enrollmentCount)} Enrollment{enrollmentCount === 1 ? "" : "s"}
                </span>
                {enrollments.isPending || certificates.isPending ? (
                  <span className="text-[10px] font-medium text-gray-400">Loading…</span>
                ) : null}
              </div>
            </div>

            {/* Profile Information Form (Zed design) */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-xs sm:p-8">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-gray-900">
                Official Learner Information
              </h3>

              <form onSubmit={onSubmit} noValidate className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="profile-first" className="mb-1 block text-xs font-bold text-gray-700">
                      First Name
                    </label>
                    <input
                      id="profile-first"
                      type="text"
                      value={firstName}
                      maxLength={80}
                      autoComplete="given-name"
                      onChange={(event) => setFirstName(event.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-last" className="mb-1 block text-xs font-bold text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="profile-last"
                      type="text"
                      value={lastName}
                      maxLength={80}
                      autoComplete="family-name"
                      onChange={(event) => setLastName(event.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="profile-job" className="mb-1 block text-xs font-bold text-gray-700">
                      Job Title <span className="font-medium text-gray-400">Optional</span>
                    </label>
                    <input
                      id="profile-job"
                      type="text"
                      value={jobTitle}
                      maxLength={120}
                      autoComplete="organization-title"
                      onChange={(event) => setJobTitle(event.target.value)}
                      className={INPUT_CLASS}
                    />
                    <p className="mt-1 text-[10px] text-gray-400">Shown on internal compliance reports.</p>
                  </div>

                  <div>
                    <label htmlFor="profile-email" className="mb-1 block text-xs font-bold text-gray-700">
                      Agency Email
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={current?.email ?? ""}
                      disabled
                      className={READONLY_INPUT_CLASS}
                    />
                    <p className="mt-1 text-[10px] text-gray-400">Managed by your agency administrator.</p>
                  </div>
                </div>

                {user?.agency?.displayName ? (
                  <div>
                    <label htmlFor="profile-agency" className="mb-1 block text-xs font-bold text-gray-700">
                      Affiliated Agency / DOT
                    </label>
                    <input id="profile-agency" type="text" value={user.agency.displayName} disabled className={READONLY_INPUT_CLASS} />
                  </div>
                ) : null}

                {formError ? (
                  <p role="alert" className="rounded-xl bg-bad-bg px-4 py-2.5 text-xs font-medium text-bad">
                    {formError}
                  </p>
                ) : null}

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  {dirty ? (
                    <span className="text-xs font-bold text-highlight-600">You have unsaved changes.</span>
                  ) : (
                    <span className="text-xs text-gray-400">All certificates will be issued to this legal name.</span>
                  )}

                  <button
                    type="submit"
                    disabled={!dirty || update.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-[#152A13] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {update.isPending ? <Save size={13} className="animate-pulse text-secondary-400" /> : <Save size={13} className="text-secondary-400" />}
                    <span>{update.isPending ? "Saving…" : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>

            <Panel className="border-gray-200/90 p-5 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-highlight-600" aria-hidden />
                <p>
                  Names, seats, and the agency email are controlled by your agency administrator; everything else here is yours to edit.
                </p>
              </div>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
