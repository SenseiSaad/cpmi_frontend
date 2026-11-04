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
import { registerAgency } from "@/lib/api/signup";

const schema = z.object({
  agencyName: z.string().trim().min(2, "Enter your agency's name").max(150, "That name is too long"),
  email: z.string().trim().min(1, "Enter your work email").email("Enter a valid email address"),
  terms: z.boolean().refine((v) => v, "Please accept the terms to continue"),
  // Invisible to people; bots fill it in and are quietly ignored.
  website: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function RegisterAgencyPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { agencyName: "", email: "", terms: false, website: "" } });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await registerAgency({ agencyName: values.agencyName, email: values.email, termsAccepted: true, ...(values.website ? { website: values.website } : {}) });
      setSentTo(values.email);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email" subtitle={`We've sent a link to ${sentTo}. Open it to choose your name and password and finish creating your agency account. The link works for a limited time.`}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 grid place-items-center rounded-3xl bg-ok-bg py-10 text-ok">
          <MailCheck className="size-14" aria-hidden />
        </motion.div>
        <p className="mb-4 text-center text-sm text-ink-600">Nothing arrived? Check your spam folder, or submit the form again to get a fresh link.</p>
        <button type="button" onClick={() => setSentTo(null)} className="mx-auto block text-sm font-semibold text-brand-800 underline-offset-4 hover:underline">
          Use a different email
        </button>
        <Link href="/login" className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-ink-700 hover:text-ink-900">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Register your agency"
      subtitle="Create an agency account in a minute. You will confirm your email, then buy seats and invite your team."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
            Sign in
          </Link>
          . Team members join by invitation from their agency administrator.
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError ? (
          <div role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-sm font-medium text-bad">
            {formError}
          </div>
        ) : null}
        <Field label="Agency name" required error={errors.agencyName?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} autoComplete="organization" invalid={invalid} aria-describedby={describedBy} placeholder="e.g. State Department of Transportation" {...register("agencyName")} />}
        </Field>
        <Field label="Your work email" required hint="We will send the confirmation link here. You become the agency administrator." error={errors.email?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="email" autoComplete="email" invalid={invalid} aria-describedby={describedBy} {...register("email")} />}
        </Field>

        {/* Honeypot: hidden from people and from assistive technology. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Leave this empty</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-700">
            <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-brand-700" aria-invalid={!!errors.terms} {...register("terms")} />
            <span>I agree to the Certification Academy terms of use and privacy policy.</span>
          </label>
          {errors.terms ? <p role="alert" className="mt-1.5 text-sm text-bad">{errors.terms.message}</p> : null}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create my agency account
        </Button>
      </form>
    </AuthShell>
  );
}
