"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import AuthShell, { ErrorBanner, SuccessBanner, errorMessage, submitButtonClass } from "@/features/public/AuthShell";
import PasswordFields, { validatePasswordPair } from "@/features/public/PasswordFields";
import { authApi } from "@/features/auth/api";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const token = useSearchParams().get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validatePasswordPair(password, confirm);
    if (problem) return setError(problem);
    setError("");
    setLoading(true);
    try {
      await authApi.confirmPasswordReset({ token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, "This reset link is invalid or has expired. Please request a new one."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heading={<>Choose a new<br /><span className="text-secondary-400">password.</span></>}
      blurb="Pick a strong password of at least 12 characters. You'll use it to sign in to CPMI."
      title="Reset Password"
      subtitle="Enter and confirm your new password."
    >
      {!token ? (
        <ErrorBanner message="This reset link is missing its token. Please use the link from your email or request a new one." />
      ) : done ? (
        <SuccessBanner>
          Your password has been updated.{" "}
          <Link href="/auth/login" className="font-bold underline">Sign in</Link> with your new password.
        </SuccessBanner>
      ) : (
        <>
          {error && <ErrorBanner message={error} />}
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordFields password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} />
            <button type="submit" disabled={loading} className={submitButtonClass}>
              {loading ? "Updating…" : "Update Password"} {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </>
      )}
      {!done && (
        <p className="text-center text-xs text-gray-500 mt-4">
          Link expired?{" "}
          <Link href="/auth/forgot-password" className="text-primary-600 font-bold hover:underline">Request a new one</Link>
        </p>
      )}
    </AuthShell>
  );
}
