"use client";

import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import AuthShell, { ErrorBanner, SuccessBanner, errorMessage, submitButtonClass } from "@/features/public/AuthShell";
import { authApi } from "@/features/auth/api";
import { ApiError } from "@/lib/api/error";

const SUCCESS =
  "If an account exists for that email address, we have sent a link to reset your password. The link expires shortly, so please check your inbox (and spam folder) soon.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.requestPasswordReset({ email: email.trim() });
      setDone(true);
    } catch (err) {
      // Only surface transport-level problems; never reveal whether the account exists.
      if (err instanceof ApiError && (err.code === "rate_limited" || err.code === "network" || err.code === "validation")) {
        setError(errorMessage(err, "Something went wrong. Please try again."));
      } else {
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heading={<>Reset your<br /><span className="text-secondary-400">password.</span></>}
      blurb="Enter the email address on your CPMI account and we'll send you a secure link to choose a new password."
      title="Forgot Password"
      subtitle="We'll email you a link to reset your password."
    >
      {done ? (
        <SuccessBanner>{SUCCESS}</SuccessBanner>
      ) : (
        <>
          {error && <ErrorBanner message={error} />}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10 text-sm"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className={submitButtonClass}>
              {loading ? "Sending…" : "Send Reset Link"} {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
