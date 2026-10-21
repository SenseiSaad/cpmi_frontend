import { redirect } from "next/navigation";

/** Backend emails link to /login; the CPMI sign-in page lives at /auth/login. */
export default function Page() {
  redirect("/auth/login");
}
