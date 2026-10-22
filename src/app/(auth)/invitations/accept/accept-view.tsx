"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { CheckCircle2, LinkIcon, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api } from "@/lib/api";
import { ROLE_HOME } from "@/lib/api/fixtures";
import { describeError } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";

const schema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name").max(100),
    lastName: z.string().trim().min(1, "Enter your last name").max(100),
    password: z.string().min(12, "Use at least 12 characters").max(200, "Use at most 200 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
type Values = z.infer<typeof schema>;

export function AcceptView() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { refresh } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [addedOnly, setAddedOnly] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { firstName: "", lastName: "", password: "", confirm: "" } });
  const password = watch("password");

  if (!token) {
    return (
      <AuthShell title="This invitation link is incomplete" subtitle="Open the link from your invitation email, or ask your administrator to send a new one.">
        <ButtonLink href="/login" variant="dark" size="lg" className="w-full">
          Go to sign in
        </ButtonLink>
      </AuthShell>
    );
  }

  if (addedOnly) {
    return (
      <AuthShell title="You've been added" subtitle="You already have an account, so this invitation was linked to it. For your security, sign in with your existing password.">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 flex items-center gap-3 rounded-2xl bg-ok-bg p-4 text-ok">
          <MailCheck className="size-6 shrink-0" aria-hidden />
          <p className="text-sm font-medium">The new agency now appears on your account.</p>
        </motion.div>
        <ButtonLink href="/login" size="lg" className="w-full">
          Sign in
        </ButtonLink>
      </AuthShell>
    );
  }

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      const result = await api.auth.acceptInvitation(token, {
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
      });
      if (result.signedIn) {
        const session = await refresh();
        router.push(session ? ROLE_HOME[session.role] : "/login");
      } else {
        setAddedOnly(true);
      }
    } catch (error) {
      setFormError(describeError(error));
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="You've been invited to join your agency's training portal. Set a password to get started."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-navy-900/[0.05] px-4 py-3 text-sm text-ink-700">
        <LinkIcon className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0">You&apos;re accepting an invitation from your agency administrator.</span>
        <CheckCircle2 className="ml-auto size-4 shrink-0 text-ok" aria-hidden />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError ? (
          <div role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-sm font-medium text-bad">
            {formError}
          </div>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName?.message}>
            {({ id, describedBy, invalid }) => <Input id={id} autoComplete="given-name" invalid={invalid} aria-describedby={describedBy} {...register("firstName")} />}
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            {({ id, describedBy, invalid }) => <Input id={id} autoComplete="family-name" invalid={invalid} aria-describedby={describedBy} {...register("lastName")} />}
          </Field>
        </div>
        <div>
          <Field label="Password" error={errors.password?.message}>
            {({ id, describedBy, invalid }) => <Input id={id} type="password" autoComplete="new-password" invalid={invalid} aria-describedby={describedBy} {...register("password")} />}
          </Field>
          <PasswordStrength value={password} />
        </div>
        <Field label="Confirm password" error={errors.confirm?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="password" autoComplete="new-password" invalid={invalid} aria-describedby={describedBy} {...register("confirm")} />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create account &amp; continue
        </Button>
      </form>
    </AuthShell>
  );
}
