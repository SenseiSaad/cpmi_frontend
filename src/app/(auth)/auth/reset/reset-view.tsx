"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api } from "@/lib/api";
import { describeError } from "@/lib/api/hooks";

const schema = z
  .object({ password: z.string().min(12, "Use at least 12 characters").max(200, "Use at most 200 characters"), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
type Values = z.infer<typeof schema>;

export function ResetView() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await api.auth.confirmReset(token, values.password);
      setDone(true);
    } catch (error) {
      setFormError(describeError(error));
    }
  }

  if (!token) {
    return (
      <AuthShell title="This reset link is incomplete" subtitle="Request a new link and use the most recent email.">
        <ButtonLink href="/forgot-password" size="lg" className="w-full">
          Request a new link
        </ButtonLink>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You've been signed out of all devices. Sign in with your new password.">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="mb-8 grid place-items-center rounded-3xl bg-ok-bg py-10 text-ok">
          <ShieldCheck className="size-14" aria-hidden />
        </motion.div>
        <ButtonLink href="/login" size="lg" className="w-full">
          Continue to sign in
        </ButtonLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Use a long, unique passphrase. This link can only be used once.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError ? (
          <div role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-sm font-medium text-bad">
            {formError}
          </div>
        ) : null}
        <div>
          <Field label="New password" error={errors.password?.message}>
            {({ id, describedBy, invalid }) => <Input id={id} type="password" autoComplete="new-password" invalid={invalid} aria-describedby={describedBy} {...register("password")} />}
          </Field>
          <PasswordStrength value={watch("password")} />
        </div>
        <Field label="Confirm new password" error={errors.confirm?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="password" autoComplete="new-password" invalid={invalid} aria-describedby={describedBy} {...register("confirm")} />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
