"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export const MIN_PASSWORD_LENGTH = 12;

/** Password + confirmation inputs in the CPMI style. */
export default function PasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
  label = "New password",
}: {
  password: string;
  confirm: string;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
  label?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <div>
        <label htmlFor="password" className="label">{label}</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="password"
            type={show ? "text" : "password"}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            className="input pl-10 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="confirm"
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => onConfirm(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>
      </div>
    </>
  );
}

/** Returns an error message, or null when the pair is acceptable client-side. */
export function validatePasswordPair(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password !== confirm) return "Passwords do not match.";
  return null;
}
