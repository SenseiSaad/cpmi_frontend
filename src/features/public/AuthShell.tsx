"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { ApiError } from "@/lib/api/error";

/** Split-screen CPMI auth layout, matching the login page. */
export default function AuthShell({
  heading,
  blurb,
  title,
  subtitle,
  children,
}: {
  heading: ReactNode;
  blurb: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
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
              {heading}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-5 text-white/80 max-w-sm text-sm sm:text-base leading-relaxed"
            >
              {blurb}
            </motion.p>
          </div>
          <div className="flex items-center justify-between text-white/40 text-xs">
            <p>© 2026 Certification Professionals Mastery Institute</p>
            <Link href="/" className="hover:text-white transition-colors">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-6 sm:p-10 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden mb-6">
            <Link href="/">
              <Logo size="md" />
            </Link>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-primary-950">{title}</h1>
            {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
          </div>
          {children}
          <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100">
            <Link href="/auth/login" className="text-primary-600 font-bold hover:underline">
              Back to sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs sm:text-sm">
      <AlertCircle size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl flex items-start gap-2 text-primary-800 text-xs sm:text-sm">
      <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export const submitButtonClass =
  "w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm mt-2";

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}
