"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api } from "@/lib/api";

const schema = z.object({ email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit({ email }: Values) {
    setFormError(null);
    try {
      await api.auth.requestReset(email);
      setSentTo(email);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email" subtitle={`If an account exists for ${sentTo}, we've sent a link to reset your password. It expires in 30 minutes and can be used once.`}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 grid place-items-center rounded-3xl bg-ok-bg py-10 text-ok">
          <MailCheck className="size-14" aria-hidden />
        </motion.div>
        <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-ink-700 hover:text-ink-900">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter the email you use to sign in and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError ? (
          <div role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-sm font-medium text-bad">
            {formError}
          </div>
        ) : null}
        <Field label="Email address" error={errors.email?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="email" autoComplete="email" invalid={invalid} aria-describedby={describedBy} {...register("email")} />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
        <Link href="/login" className="flex items-center justify-center gap-2 pt-1 text-sm font-semibold text-ink-700 hover:text-ink-900">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
