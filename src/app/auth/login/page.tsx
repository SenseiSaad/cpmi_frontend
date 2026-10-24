"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Mail } from "lucide-react";

import AuthLayout, { AuthHeading } from "@/components/auth/AuthLayout";
import { FormAlert, PasswordField, TextField } from "@/components/auth/fields";
import { mockLogin } from "@/lib/mock-auth";
import { cn, getRoleDashboard } from "@/lib/utils";

type RoleTab = "learner" | "agency_admin" | "training_manager";

const ROLES: { id: RoleTab; label: string; demo: { email: string; password: string } }[] = [
  { id: "learner", label: "Learner", demo: { email: "learner@agency.gov", password: "learner123" } },
  { id: "agency_admin", label: "Agency admin", demo: { email: "agency@agency.gov", password: "agency123" } },
  { id: "training_manager", label: "Super admin", demo: { email: "admin@cpmi.gov", password: "admin123" } },
];

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<RoleTab>("learner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillDemo = (role: (typeof ROLES)[number]) => {
    setActiveTab(role.id);
    setEmail(role.demo.email);
    setPassword(role.demo.password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Mock authentication with a realistic delay.
    setTimeout(() => {
      const user = mockLogin(email.trim(), password);
      if (user) {
        router.push(getRoleDashboard(user.role));
      } else {
        setError("The email or password is incorrect. Check your details and try again.");
        setLoading(false);
        emailRef.current?.focus();
      }
    }, 600);
  };

  return (
    <AuthLayout>
      <AuthHeading title="Welcome back">Sign in with the email address your agency registered for you.</AuthHeading>

      {error ? (
        <div className="mt-6">
          <FormAlert id="login-error">{error}</FormAlert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <TextField
          ref={emailRef}
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@agency.gov"
          required
          autoComplete="username"
          icon={<Mail size={16} />}
          invalid={!!error}
        />

        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          invalid={!!error}
          labelAside={
            <Link href="/auth/forgot-password" className="rounded text-sm font-medium text-primary-500 hover:text-primary-700 hover:underline">
              Forgot password?
            </Link>
          }
        />

        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded border-line accent-primary-500"
          />
          Keep me signed in on this device
        </label>

        <button type="submit" disabled={loading} className="btn-forest h-12 w-full text-base">
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden /> Signing in
            </>
          ) : (
            <>
              Sign in <ArrowRight size={17} aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 border-t border-line-soft pt-6 text-sm leading-relaxed text-ink-500">
        Accounts are created by invitation. No account yet? Ask your agency administrator.{" "}
        <Link href="/invitations/accept" className="font-semibold text-primary-500 hover:underline">
          Have an invitation?
        </Link>
      </p>

      {/* Prototype helper: fills the form for each role. Remove when the live API is connected. */}
      <section aria-labelledby="demo-title" className="mt-8 rounded-md border border-dashed border-line bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="demo-title" className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
            Prototype demo accounts
          </h2>
          <span className="text-xs text-ink-400">Not real credentials</span>
        </div>
        <div role="group" aria-label="Fill the form for a role" className="mt-3 grid grid-cols-3 gap-2">
          {ROLES.map((role) => {
            const isActive = activeTab === role.id && email === role.demo.email;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => fillDemo(role)}
                aria-pressed={isActive}
                className={cn(
                  "rounded-md border px-2 py-2.5 text-[0.8125rem] font-medium leading-tight transition-colors",
                  isActive ? "border-primary-500 bg-primary-50 text-primary-700" : "border-line bg-white text-ink-700 hover:border-ink-400"
                )}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </section>
    </AuthLayout>
  );
}
