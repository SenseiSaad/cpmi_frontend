import { redirect } from "next/navigation";

/**
 * Superseded: sign-in lives at /login (src/app/(auth)/login). This old route used a demo-only mock
 * session and a helper that no longer exists, which broke `next build`. It now just forwards, so
 * any old link or bookmark to /auth/login still lands on the real sign-in page.
 */
export default function LegacyLoginRedirect() {
  redirect("/login");
}
