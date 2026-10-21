"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { authApi } from "@/features/auth/api";
import { dashboardForRole } from "@/features/auth/dashboard-for-role";
import { ApiError } from "@/lib/api/error";

type RoleTab = "learner" | "agency_admin" | "training_manager";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

/** Only same-site relative paths may be used as the post-login destination. */
function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/auth") ? value : null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const expired = searchParams.get("expired") === "1";
  const [activeTab, setActiveTab] = useState<RoleTab>("learner");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The tabs only frame the page; the backend decides which portal the account opens.
  const handleTabChange = (tab: RoleTab) => {
    setActiveTab(tab);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await authApi.login({ email: email.trim(), password });
      const me = user ?? (await authApi.me());
      queryClient.setQueryData(["auth", "me"], me);
      router.replace(safeNext(searchParams.get("next")) ?? dashboardForRole(me.roles));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status !== 401
          ? err.message
          : "Invalid email or password. Please check your details and try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left – Decorative Government Visual (Screen 2 Reference) */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/95 via-primary-900/90 to-primary-900/75" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <Link href="/" className="inline-block">
            <Logo variant="light" size="md" />
          </Link>

          <div>
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight"
            >
              Compliance.
              <br />
              Training.
              <br />
              <span className="text-secondary-400">Impact.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-5 text-white/80 max-w-sm text-sm sm:text-base leading-relaxed"
            >
              Sign in to your account to continue your learning journey and access verified compliance training credentials.
            </motion.p>

            <div className="mt-8 flex items-center gap-3 text-xs text-white/70">
              <span className="w-2 h-2 rounded-full bg-highlight-500 animate-pulse" />
              <span>Accreditation Ready • WCAG 2.1 AA / Section 508 Compliant</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-white/40 text-xs">
            <p>© 2026 Certification Professionals Mastery Institute</p>
            <Link href="/" className="hover:text-white transition-colors">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>

      {/* Right – Form & Role Tabs (Screen 2 Reference) */}
      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-6 sm:p-10 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-6">
            <Link href="/">
              <Logo size="md" />
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-primary-950">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to your account to continue your learning journey.
            </p>
          </div>

          {/* Role Tabs (Screen 2 Direct Reference) */}
          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange("learner")}
              className={`py-2 px-3 rounded-lg transition-all text-center focus:outline-none ${
                activeTab === "learner"
                  ? "bg-white text-primary-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Learner
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("agency_admin")}
              className={`py-2 px-3 rounded-lg transition-all text-center focus:outline-none ${
                activeTab === "agency_admin"
                  ? "bg-white text-primary-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Agency Admin
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("training_manager")}
              className={`py-2 px-3 rounded-lg transition-all text-center focus:outline-none ${
                activeTab === "training_manager"
                  ? "bg-white text-primary-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Super Admin
            </button>
          </div>

          {expired && !error && (
            <div className="mb-4 p-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-800 text-xs sm:text-sm">
              Your session has ended. Please sign in again.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs sm:text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input pl-10 text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pl-10 pr-10 text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300 accent-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                />
                Remember me
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-primary-600 hover:text-primary-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
              >
                Forgot password?
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm mt-2"
            >
              {loading ? "Signing in to CPMI..." : "Sign In"} {!loading && <ArrowRight size={16} />}
            </motion.button>
          </form>

          {/* Subtext matching Screen 2 Reference */}
          <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100">
            <p>
              Don&apos;t have an account?{" "}
              <span className="font-semibold text-gray-700">Contact your agency administrator.</span>
            </p>
            <p className="mt-2">
              Have an invitation code?{" "}
              <Link href="/auth/invitation" className="text-primary-600 font-bold hover:underline">
                Accept Agency Invitation
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
