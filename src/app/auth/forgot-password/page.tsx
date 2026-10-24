"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";

import AuthLayout, { AuthHeading } from "@/components/auth/AuthLayout";
import { FormAlert, TextField } from "@/components/auth/fields";
import { errorCode, errorMessage, requestPasswordReset } from "@/lib/auth-flow";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
});
type Values = z.infer<typeof schema>;

const RESEND_SECONDS = 30;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function send(email: string) {
    setFormError("");
    try {
      await requestPasswordReset(email);
      setSentTo(email);
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      setFormError(
        errorCode(error) === "rate_limited"
          ? "Too many requests. Please wait a few minutes before trying again."
          : errorMessage(error)
      );
    }
  }

  async function resend() {
    if (!sentTo || cooldown > 0) return;
    setResending(true);
    await send(sentTo);
    setResending(false);
  }

  if (sentTo) {
    return (
      <AuthLayout>
        <div className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-500">
          <MailCheck size={26} aria-hidden />
        </div>
        <div className="mt-6" role="status">
          <AuthHeading title="Check your email">
            If an account exists for <strong className="break-all font-semibold text-ink">{sentTo}</strong>, we have sent a link
            to reset your password. It can be used once and expires in 30 minutes.
          </AuthHeading>
        </div>

        {formError ? (
          <div className="mt-6">
            <FormAlert>{formError}</FormAlert>
          </div>
        ) : null}

        <div className="mt-8 rounded-md border border-line-soft bg-paper p-4 text-sm leading-relaxed text-ink-500">
          Nothing arrived? Check your spam folder, and make sure you used the address your agency registered for you.
        </div>

        <button type="button" onClick={resend} disabled={cooldown > 0 || resending} className="btn-line mt-6 h-12 w-full">
          {resending ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden /> Sending
            </>
          ) : cooldown > 0 ? (
            <span className="num">Send again in {cooldown}s</span>
          ) : (
            "Send the email again"
          )}
        </button>

        <Link href="/auth/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-primary-500 hover:underline">
          <ArrowLeft size={15} aria-hidden /> Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeading title="Reset your password">
        Enter the email address you sign in with and we will send you a link to choose a new password.
      </AuthHeading>

      {formError ? (
        <div className="mt-6">
          <FormAlert>{formError}</FormAlert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit((values) => send(values.email))} className="mt-8 space-y-5" noValidate>
        <TextField
          label="Email address"
          type="email"
          placeholder="name@agency.gov"
          autoComplete="email"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <button type="submit" disabled={isSubmitting} className="btn-forest h-12 w-full text-base">
          {isSubmitting ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden /> Sending
            </>
          ) : (
            <>
              Send reset link <ArrowRight size={17} aria-hidden />
            </>
          )}
        </button>
      </form>

      <Link href="/auth/login" className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-primary-500 hover:underline">
        <ArrowLeft size={15} aria-hidden /> Back to sign in
      </Link>
    </AuthLayout>
  );
}
