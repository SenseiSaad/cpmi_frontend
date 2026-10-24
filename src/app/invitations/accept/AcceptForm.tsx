"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, KeyRound, Loader2, TriangleAlert, UserCheck } from "lucide-react";

import AuthLayout, { AuthHeading } from "@/components/auth/AuthLayout";
import { FormAlert, PasswordField, PasswordGuidance, TextField } from "@/components/auth/fields";
import { acceptInvitation, errorCode, errorMessage, extractInvitationToken } from "@/lib/auth-flow";
import { getRoleDashboard } from "@/lib/utils";

const schema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name").max(100, "Use 100 characters or fewer"),
    lastName: z.string().trim().min(1, "Enter your last name").max(100, "Use 100 characters or fewer"),
    password: z.string().min(12, "Use at least 12 characters").max(200, "Use 200 characters or fewer"),
    confirm: z.string().min(1, "Re-enter your password"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords do not match" });
type Values = z.infer<typeof schema>;

/** Shown when the page is opened without a link: lets people paste the link or code from their email. */
function PasteInvitation() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = extractInvitationToken(value);
    if (!token) {
      setError("That doesn't look like an invitation link or code. Copy it again from your email.");
      return;
    }
    router.push(`/invitations/accept?token=${encodeURIComponent(token)}`);
  }

  return (
    <AuthLayout>
      <AuthHeading title="Accept your invitation">
        Open the link in your invitation email. If it does not open, paste the link or the invitation code here.
      </AuthHeading>
      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <TextField
          label="Invitation link or code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          icon={<KeyRound size={16} />}
          placeholder="Paste it here"
          autoComplete="off"
          spellCheck={false}
          error={error}
        />
        <button type="submit" className="btn-forest h-12 w-full text-base">
          Continue <ArrowRight size={17} aria-hidden />
        </button>
      </form>
      <p className="mt-8 border-t border-line-soft pt-6 text-sm leading-relaxed text-ink-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-primary-500 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function AcceptForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [formError, setFormError] = useState("");
  const [linkProblem, setLinkProblem] = useState(false);
  const [addedOnly, setAddedOnly] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { firstName: "", lastName: "", password: "", confirm: "" } });

  async function onSubmit(values: Values) {
    setFormError("");
    try {
      const result = await acceptInvitation({
        token,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
      });
      if (result.signedIn) {
        router.push(getRoleDashboard(result.role ?? "learner"));
      } else {
        setAddedOnly(true);
      }
    } catch (error) {
      const code = errorCode(error);
      if (code === "expired" || code === "invalid") setLinkProblem(true);
      setFormError(code === "rate_limited" ? "Too many attempts. Please wait a few minutes and try again." : errorMessage(error));
    }
  }

  if (!token) return <PasteInvitation />;

  if (linkProblem) {
    return (
      <AuthLayout>
        <div className="grid size-14 place-items-center rounded-full bg-secondary-50 text-secondary-700">
          <TriangleAlert size={26} aria-hidden />
        </div>
        <div className="mt-6">
          <AuthHeading title="This invitation can't be used">
            {formError || "The link is invalid, expired or has been withdrawn."} Ask your agency administrator to send you a new
            invitation.
          </AuthHeading>
        </div>
        <Link href="/auth/login" className="btn-line mt-8 h-12 w-full text-base">
          Go to sign in
        </Link>
      </AuthLayout>
    );
  }

  if (addedOnly) {
    return (
      <AuthLayout>
        <div className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-500">
          <UserCheck size={26} aria-hidden />
        </div>
        <div className="mt-6" role="status">
          <AuthHeading title="You've been added">
            You already have a CPMI account, so the new agency has been added to it. For your security, sign in with your
            existing password.
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
      <AuthHeading title="Create your account">
        You&apos;ve been invited to the CPMI Certification Academy. Tell us who you are and choose a password.
      </AuthHeading>

      {formError ? (
        <div className="mt-6">
          <FormAlert>{formError}</FormAlert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
          <TextField label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <div>
          <PasswordField label="Password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <PasswordGuidance value={watch("password")} />
        </div>
        <PasswordField label="Confirm password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />

        <button type="submit" disabled={isSubmitting} className="btn-forest h-12 w-full text-base">
          {isSubmitting ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden /> Creating account
            </>
          ) : (
            <>
              Create account <ArrowRight size={17} aria-hidden />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 border-t border-line-soft pt-6 text-sm leading-relaxed text-ink-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-primary-500 hover:underline">
          Sign in instead
        </Link>
        . Your invitation will be added to it.
      </p>
    </AuthLayout>
  );
}
