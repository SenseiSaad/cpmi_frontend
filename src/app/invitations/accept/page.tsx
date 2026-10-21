"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, User } from "lucide-react";
import AuthShell, { ErrorBanner, SuccessBanner, errorMessage, submitButtonClass } from "@/features/public/AuthShell";
import PasswordFields, { validatePasswordPair } from "@/features/public/PasswordFields";
import { authApi } from "@/features/auth/api";
import { dashboardForRole } from "@/features/auth/dashboard-for-role";

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationForm />
    </Suspense>
  );
}

function AcceptInvitationForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useSearchParams().get("token")?.trim() ?? "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingMessage, setExistingMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return setError("Please enter your first and last name.");
    const problem = validatePasswordPair(password, confirm);
    if (problem) return setError(problem);
    setError("");
    setLoading(true);
    try {
      const outcome = await authApi.acceptInvitation({
        token,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
      });
      if (outcome.kind === "account_created") {
        queryClient.setQueryData(["auth", "me"], outcome.user);
        router.replace(dashboardForRole(outcome.user.roles));
        return;
      }
      setExistingMessage(outcome.message);
      setLoading(false);
    } catch (err) {
      setError(errorMessage(err, "This invitation is invalid or has expired. Please ask your administrator for a new one."));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heading={<>Join your<br /><span className="text-secondary-400">agency.</span></>}
      blurb="You've been invited to CPMI compliance training. Set up your account to get started."
      title="Accept Invitation"
      subtitle="Create your CPMI account."
    >
      {!token ? (
        <ErrorBanner message="This invitation link is missing its token. Please use the link from your invitation email." />
      ) : existingMessage ? (
        <SuccessBanner>
          <p>{existingMessage}</p>
          <Link href="/auth/login" className="inline-block mt-2 font-bold underline">Sign in to continue</Link>
        </SuccessBanner>
      ) : (
        <>
          {error && <ErrorBanner message={error} />}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first-name" className="label">First name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="first-name" required autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input pl-10 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="last-name" className="label">Last name</label>
                <input id="last-name" required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input text-sm" />
              </div>
            </div>
            <PasswordFields password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} label="Password" />
            <button type="submit" disabled={loading} className={submitButtonClass}>
              {loading ? "Setting up your account…" : "Accept & Create Account"} {!loading && <ArrowRight size={16} />}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-4">
            Already have a CPMI account? Submit the form and we&apos;ll add you to the agency, then{" "}
            <Link href="/auth/login" className="text-primary-600 font-bold hover:underline">sign in</Link>.
          </p>
        </>
      )}
    </AuthShell>
  );
}
