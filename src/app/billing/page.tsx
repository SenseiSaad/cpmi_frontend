import { redirect } from "next/navigation";

/** Backend emails and Stripe link to /billing; CPMI billing lives in the agency portal. */
export default function Page() {
  redirect("/agency/settings");
}
