"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, Mail } from "lucide-react";
import AuthShell, { ErrorBanner, submitButtonClass } from "@/features/public/AuthShell";
import { extractToken, isPlausibleToken } from "@/features/public/api";

export default function InvitationExplainerPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = extractToken(value);
    if (!isPlausibleToken(token)) {
      setError("That doesn't look like a valid invitation link. Please paste the full link from your email.");
      return;
    }
    router.push(`/invitations/accept?token=${encodeURIComponent(token)}`);
  };

  return (
    <AuthShell
      heading={<>Invited to<br /><span className="text-secondary-400">CPMI?</span></>}
      blurb="Agency administrators invite staff to CPMI training by email. Your invitation link sets up your account."
      title="Accept Agency Invitation"
      subtitle="Invitations are sent by email from your agency administrator."
    >
      <div className="mb-5 p-4 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-900 text-xs sm:text-sm flex items-start gap-3">
        <Mail size={18} className="flex-shrink-0 mt-0.5 text-secondary-700" />
        <p>
          Open the invitation email and click its <strong>Accept invitation</strong> button. If the button doesn&apos;t work,
          copy the link (or the token) from the email and paste it below. Didn&apos;t get an email? Ask your agency administrator to resend it.
        </p>
      </div>
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="invite" className="label">Invitation link or token</label>
          <div className="relative">
            <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="invite"
              required
              placeholder="Paste your invitation link"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              className="input pl-10 text-sm"
            />
          </div>
        </div>
        <button type="submit" className={submitButtonClass}>
          Continue <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
}
