"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";

import AuthLayout, { AuthHeading } from "@/components/auth/AuthLayout";
import { FormAlert, PasswordField, PasswordGuidance } from "@/components/auth/fields";
import { confirmPasswordReset, errorCode, errorMessage } from "@/lib/auth-flow";

const schema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters").max(200, "Use 200 characters or fewer"),
    confirm: z.string().min(1, "Re-enter your new password"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords do not match" });
type Values = z.infer<typeof schema>;

export default function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");
  const [linkProblem, setLinkProblem] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  async function onSubmit(values: Values) {
    setFormError("");
    try {
      await confirmPasswordReset(token, values.password);
      setDone(true);
    } catch (error) {
      const code = errorCode(error);
      if (code === "expired" || code === "invalid") setLinkProblem(true);
      setFormError(code === "rate_limited" ? "Too many attempts. Please wait a few minutes and try again." : errorMessage(error));
    }
  }

  if (!token || linkProblem) {
    return (
      <AuthLayout>
        <div className="grid size-14 place-items-center rounded-full bg-secondary-50 text-secondary-700">
          <TriangleAlert size={26} aria-hidden />
        </div>
        <div className="mt-6">
          <AuthHeading title="This link can't be used">
            {formError || "The reset link is missing or incomplete. Request a new one and use the most recent email."}
          </AuthHeading>
        </div>
        <Link href="/auth/forgot-password" className="btn-forest mt-8 h-12 w-full text-base">
          Request a new link <ArrowRight size={17} aria-hidden />
        </Link>
        <Link href="/auth/login" className="mt-6 block text-center text-sm font-semibold text-primary-500 hover:underline">
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-500">
          <ShieldCheck size={26} aria-hidden />
        </div>
        <div className="mt-6" role="status">
          <AuthHeading title="Password updated">
            For your security you have been signed out on every device. Sign in with your new password.
          </AuthHeading>
        </div>
        <Link href="/auth/login" className="btn-forest mt-8 h-12 w-full text-base">
          Continue to sign in <ArrowRight size={17} aria-hidden />
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeading title="Choose a new password">Use a long, unique passphrase. This link works once.</AuthHeading>

      {formError ? (
        <div className="mt-6">
          <FormAlert>{formError}</FormAlert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div>
          <PasswordField label="New password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <PasswordGuidance value={watch("password")} />
        </div>
        <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />

        <button type="submit" disabled={isSubmitting} className="btn-forest h-12 w-full text-base">
          {isSubmitting ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden /> Updating
            </>
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
