"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api, type RoleCode } from "@/lib/api";
import { ROLE_HOME } from "@/lib/api/fixtures";
import { describeError } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

/** Only follow same-site, same-portal paths (prevents open redirects after sign-in). */
function safeNext(next: string | null, role: RoleCode): string {
  const home = ROLE_HOME[role];
  if (!next || !next.startsWith("/") || next.startsWith("//")) return home;
  return next === home || next.startsWith(`${home}/`) ? next : home;
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      // Email addresses are not case-sensitive; send them in a consistent form.
      const user = await api.auth.login(values.email.trim().toLowerCase(), values.password);
      await refresh();
      router.push(safeNext(params.get("next"), user.role));
    } catch (error) {
      setFormError(describeError(error));
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with the email address you used to create your account."
      footer={
        <>
          New here? Accounts are created by invitation — check your email for an invite link, or{" "}
          <Link href="/#contact" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
            ask your administrator
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-sm font-medium text-bad">
            {formError}
          </motion.div>
        ) : null}
        <Field label="Email address" error={errors.email?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="name@email.com" leading={<Mail className="size-4" aria-hidden />} invalid={invalid} aria-describedby={describedBy} {...register("email")} />}
        </Field>
        <Field label="Password" error={errors.password?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="password" autoComplete="current-password" placeholder="Your password" leading={<KeyRound className="size-4" aria-hidden />} invalid={invalid} aria-describedby={describedBy} {...register("password")} />}
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-brand-800 underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Sign in
          {!isSubmitting ? <ArrowRight className="size-5" aria-hidden /> : null}
        </Button>
      </form>
    </AuthShell>
  );
}
